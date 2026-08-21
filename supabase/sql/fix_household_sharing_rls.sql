-- ============================================================================
-- FIX: "El problema de la habitación"
-- ----------------------------------------------------------------------------
-- Síntoma: cuando un usuario se une a un hogar mediante código de invitación,
-- termina en una copia del hogar donde no ve las tareas/compra/recordatorios
-- ni los cambios de los demás miembros, aunque comparten el mismo household_id.
--
-- Causa más probable: las políticas de Row Level Security (RLS) actuales
-- filtran por "es tu propia fila" (auth.uid() = user_id / created_by) en vez
-- de "eres miembro del hogar (household_id) al que pertenece la fila". Esto
-- hace que cada usuario solo pueda ver/editar lo que él mismo creó, aunque
-- todos apunten al mismo hogar en la base de datos.
--
-- Este script:
--   1) Elimina TODAS las políticas existentes de las tablas implicadas
--      (sin importar su nombre actual).
--   2) Crea una función helper is_household_member(household_id) que
--      comprueba pertenencia real vía la tabla `memberships`.
--   3) Recrea políticas correctas: "puedes ver/editar una fila si eres
--      miembro del hogar al que pertenece esa fila".
--   4) Reescribe check_invite_code(...) como SECURITY DEFINER para que
--      pueda validar un código de invitación ANTES de que el usuario sea
--      miembro del hogar (incluso antes de iniciar sesión).
--
-- CÓMO APLICARLO:
--   Supabase Dashboard → tu proyecto → SQL Editor → pega este archivo
--   completo → Run. Es seguro re-ejecutarlo (es idempotente).
--
-- Ajusta los nombres de tabla/columna si en tu proyecto difieren de los
-- que usa el código en src/store/AppContext.tsx.
-- ============================================================================

-- ── Helper: ¿el usuario autenticado es miembro de este hogar? ───────────────
create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.household_id = p_household_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_household_owner(p_household_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.household_id = p_household_id
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_owner(uuid) to authenticated;

-- ── Utilidad: elimina todas las políticas existentes de una tabla ───────────
do $$
declare
  tbl text;
  pol record;
begin
  foreach tbl in array array[
    'households', 'memberships', 'profiles', 'invitations',
    'tasks', 'task_completions', 'reminders',
    'shopping_items', 'shopping_database'
  ]
  loop
    for pol in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = tbl
    loop
      execute format('drop policy %I on public.%I', pol.policyname, tbl);
    end loop;
  end loop;
end $$;

-- Asegura RLS activo (no lo desactiva si ya lo estaba)
alter table public.households enable row level security;
alter table public.memberships enable row level security;
alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.tasks enable row level security;
alter table public.task_completions enable row level security;
alter table public.reminders enable row level security;
alter table public.shopping_items enable row level security;
alter table public.shopping_database enable row level security;

-- ============================================================================
-- households
-- ============================================================================
create policy "households_select_members"
  on public.households for select
  using (public.is_household_member(id));

create policy "households_insert_authenticated"
  on public.households for insert
  with check (auth.uid() is not null);

create policy "households_update_members"
  on public.households for update
  using (public.is_household_member(id))
  with check (public.is_household_member(id));

create policy "households_delete_owner"
  on public.households for delete
  using (public.is_household_owner(id));

-- ============================================================================
-- memberships
-- ============================================================================
-- Ver: cualquier miembro del hogar puede ver la lista de miembros del hogar.
create policy "memberships_select_household"
  on public.memberships for select
  using (public.is_household_member(household_id));

-- Insertar: un usuario solo puede crear su PROPIA membresía (no puede meter
-- a otros), y solo si el hogar tiene al menos una invitación emitida (evita
-- que alguien se una a un household_id adivinado sin pasar por un código).
create policy "memberships_insert_self"
  on public.memberships for insert
  with check (
    user_id = auth.uid()
    and (
      role = 'owner'
      or exists (
        select 1 from public.invitations i
        where i.household_id = memberships.household_id
      )
    )
  );

-- Borrar: puedes salir tú mismo del hogar, o el owner puede expulsar a otros.
create policy "memberships_delete_self_or_owner"
  on public.memberships for delete
  using (
    user_id = auth.uid()
    or public.is_household_owner(household_id)
  );

-- ============================================================================
-- profiles
-- ============================================================================
-- Ver: tu propio perfil, o el de cualquiera con quien compartas un hogar.
create policy "profiles_select_self_or_housemates"
  on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.memberships mine
      join public.memberships theirs on theirs.household_id = mine.household_id
      where mine.user_id = auth.uid()
        and theirs.user_id = profiles.id
    )
  );

create policy "profiles_insert_self"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================================
-- invitations
-- ============================================================================
-- La validación de código (antes de unirse) pasa por la función
-- check_invite_code (SECURITY DEFINER, más abajo), que ignora RLS.
-- Estas políticas solo gobiernan la gestión normal de códigos ya siendo
-- miembro (p.ej. verlos/generarlos desde Ajustes).
create policy "invitations_select_members"
  on public.invitations for select
  using (public.is_household_member(household_id));

create policy "invitations_insert_members"
  on public.invitations for insert
  with check (public.is_household_member(household_id));

create policy "invitations_delete_members"
  on public.invitations for delete
  using (public.is_household_member(household_id));

-- ============================================================================
-- tasks / reminders / shopping_items / shopping_database
-- (todas tienen household_id directamente)
-- ============================================================================
create policy "tasks_all_members"
  on public.tasks for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "reminders_all_members"
  on public.reminders for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "shopping_items_all_members"
  on public.shopping_items for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "shopping_database_all_members"
  on public.shopping_database for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- ============================================================================
-- task_completions (no tiene household_id propio: se relaciona vía task_id)
-- ============================================================================
create policy "task_completions_select_household"
  on public.task_completions for select
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_completions.task_id
        and public.is_household_member(t.household_id)
    )
  );

create policy "task_completions_insert_household"
  on public.task_completions for insert
  with check (
    exists (
      select 1 from public.tasks t
      where t.id = task_completions.task_id
        and public.is_household_member(t.household_id)
    )
    and exists (
      select 1 from public.tasks t
      join public.memberships m
        on m.household_id = t.household_id
      where t.id = task_completions.task_id
        and m.user_id = task_completions.user_id
    )
  );

create policy "task_completions_delete_household"
  on public.task_completions for delete
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_completions.task_id
        and public.is_household_member(t.household_id)
    )
  );

-- ============================================================================
-- check_invite_code: debe poder ejecutarse ANTES de ser miembro del hogar
-- (incluso antes de iniciar sesión, ver Auth.tsx -> validateCode), así que
-- tiene que ser SECURITY DEFINER para saltarse RLS de forma controlada.
-- ============================================================================
create or replace function public.check_invite_code(codigo_ingresado text)
returns table (household_id uuid, household_name text)
language sql
security definer
stable
set search_path = public
as $$
  select h.id as household_id, h.name as household_name
  from public.invitations i
  join public.households h on h.id = i.household_id
  where upper(i.code) = upper(codigo_ingresado)
  order by i.created_at desc
  limit 1;
$$;

grant execute on function public.check_invite_code(text) to anon, authenticated;

-- ============================================================================
-- FIN
-- ============================================================================
