-- ============================================================================
-- FIX: "El problema de la habitación" — YA APLICADO EN PRODUCCIÓN
-- ----------------------------------------------------------------------------
-- Este archivo documenta el fix real que ya se ejecutó directamente contra
-- el proyecto de Supabase (lrmqhoygbalfhvtxlmsk) vía el conector MCP, en
-- varias migraciones. Se deja aquí en control de versiones para que el
-- historial del repo refleje lo que hay en la base de datos real. Es
-- idempotente: se puede re-ejecutar sin romper nada.
--
-- CAUSA RAÍZ CONFIRMADA (no una hipótesis: se verificó con los datos reales
-- del proyecto):
--   Las políticas de RLS dependían de auth_household_id(), una función que
--   devolvía UN SOLO hogar por usuario (`LIMIT 1` sin ORDER BY) leyendo de
--   `memberships`. Pero memberships tiene UNIQUE(user_id, household_id), NO
--   UNIQUE(user_id) — el esquema (y el selector de hogar del sidebar) permite
--   explícitamente que un usuario pertenezca a varios hogares. Cualquier
--   acceso a un hogar que no fuera el elegido arbitrariamente por ese
--   `LIMIT 1` quedaba mal evaluado.
--
--   Además, el cliente nunca mostraba ningún error cuando el setup (crear o
--   unirse a un hogar) fallaba a mitad de camino: needsProfileSetup/
--   setupError se guardaban en el estado pero ninguna pantalla los leía. El
--   usuario volvía en silencio a la pantalla de bienvenida y, sin saberlo,
--   creaba un hogar nuevo. Los datos del proyecto lo confirmaron: 13 hogares
--   huérfanos bajo la misma cuenta (creados en ráfagas de segundos = reintentos
--   silenciosos) y una segunda cuenta real con sesión válida pero cero perfil
--   y cero membresía. Ese bug de UI se corrigió aparte, en el código del
--   cliente (App.tsx, AppContext.tsx, src/pages/CompleteSetup.tsx).
-- ============================================================================

-- ── Helpers: pertenencia real a un hogar (soporta multi-hogar) ──────────────
create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.household_id = target_household_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.shares_household_with(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships mine
    join public.memberships theirs on theirs.household_id = mine.household_id
    where mine.user_id = auth.uid()
      and theirs.user_id = target_user_id
  );
$$;

-- Solo el rol `authenticated` necesita poder invocarlas: se usan dentro de
-- políticas RLS, evaluadas como el rol que hace la consulta (no como el
-- "definer" de la función — SECURITY DEFINER solo cambia los permisos con
-- los que corre el CUERPO de la función sobre otras tablas, no el permiso de
-- EJECUTARLA). No se exponen a `anon`.
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.shares_household_with(uuid) to authenticated;

-- ── households ────────────────────────────────────────────────────────────
drop policy if exists h_select on public.households;
drop policy if exists h_update on public.households;

create policy h_select on public.households for select
  using (public.is_household_member(id));

create policy h_update on public.households for update
  using (public.is_household_member(id));

-- ── invitations ───────────────────────────────────────────────────────────
drop policy if exists inv_select_own on public.invitations;

create policy inv_select_own on public.invitations for select
  using (public.is_household_member(household_id));

-- ── memberships ───────────────────────────────────────────────────────────
drop policy if exists m_select on public.memberships;

create policy m_select on public.memberships for select
  using (public.is_household_member(household_id));

-- ── profiles ──────────────────────────────────────────────────────────────
drop policy if exists p_select on public.profiles;

create policy p_select on public.profiles for select
  using (
    id = auth.uid()
    or public.shares_household_with(id)
  );

-- ── tasks ─────────────────────────────────────────────────────────────────
drop policy if exists t_select on public.tasks;
drop policy if exists t_insert on public.tasks;
drop policy if exists t_update on public.tasks;
drop policy if exists t_delete on public.tasks;

create policy t_select on public.tasks for select
  using (public.is_household_member(household_id));
create policy t_insert on public.tasks for insert
  with check (public.is_household_member(household_id));
create policy t_update on public.tasks for update
  using (public.is_household_member(household_id));
create policy t_delete on public.tasks for delete
  using (public.is_household_member(household_id));

-- ── reminders ─────────────────────────────────────────────────────────────
drop policy if exists r_select on public.reminders;
drop policy if exists r_insert on public.reminders;
drop policy if exists r_update on public.reminders;
drop policy if exists r_delete on public.reminders;

create policy r_select on public.reminders for select
  using (public.is_household_member(household_id));
create policy r_insert on public.reminders for insert
  with check (public.is_household_member(household_id));
create policy r_update on public.reminders for update
  using (public.is_household_member(household_id));
create policy r_delete on public.reminders for delete
  using (public.is_household_member(household_id));

-- ── shopping_items ────────────────────────────────────────────────────────
drop policy if exists si_select on public.shopping_items;
drop policy if exists si_insert on public.shopping_items;
drop policy if exists si_update on public.shopping_items;
drop policy if exists si_delete on public.shopping_items;

create policy si_select on public.shopping_items for select
  using (public.is_household_member(household_id));
create policy si_insert on public.shopping_items for insert
  with check (public.is_household_member(household_id));
create policy si_update on public.shopping_items for update
  using (public.is_household_member(household_id));
create policy si_delete on public.shopping_items for delete
  using (public.is_household_member(household_id));

-- ── shopping_database ─────────────────────────────────────────────────────
drop policy if exists sd_select on public.shopping_database;
drop policy if exists sd_insert on public.shopping_database;
drop policy if exists sd_delete on public.shopping_database;

create policy sd_select on public.shopping_database for select
  using (public.is_household_member(household_id));
create policy sd_insert on public.shopping_database for insert
  with check (public.is_household_member(household_id));
create policy sd_delete on public.shopping_database for delete
  using (public.is_household_member(household_id));

-- ── task_completions (sin household_id propio: se relaciona vía task_id) ───
drop policy if exists tc_select on public.task_completions;
drop policy if exists tc_insert on public.task_completions;
drop policy if exists tc_delete on public.task_completions;

create policy tc_select on public.task_completions for select
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_completions.task_id
        and public.is_household_member(t.household_id)
    )
  );
create policy tc_insert on public.task_completions for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.tasks t
      where t.id = task_completions.task_id
        and public.is_household_member(t.household_id)
    )
  );
create policy tc_delete on public.task_completions for delete
  using (user_id = auth.uid());

-- ── check_invite_code: comparación case-insensitive (ya lo era vía el
-- cliente, esto lo hace robusto también si alguien inserta un código a
-- mano) y toma el más reciente si hubiera códigos duplicados. ────────────────
create or replace function public.check_invite_code(codigo_ingresado text)
returns table(household_id uuid, household_name text)
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  RETURN QUERY
  SELECT i.household_id, h.name
  FROM invitations i
  JOIN households h ON h.id = i.household_id
  WHERE upper(i.code) = upper(codigo_ingresado)
  ORDER BY i.created_at DESC
  LIMIT 1;
END;
$function$;

-- ── Tablas que tenían RLS desactivado por completo (cualquiera con la clave
-- anon podía leer/escribir todas las filas). Ninguna la usa el código del
-- cliente hoy, así que activar RLS sin políticas (deny-by-default) cierra el
-- hueco sin romper nada. Si en el futuro se implementan estas funciones
-- (recetas semanales en BD, historial de competición, ajustes manuales de
-- puntos), añadir políticas del mismo estilo que las de arriba.
alter table public.manual_adjustments enable row level security;
alter table public.meal_weeks enable row level security;
alter table public.meals enable row level security;
alter table public.competition_history enable row level security;

-- ============================================================================
-- Limpieza: la función auth_household_id() (causa raíz) y un helper
-- duplicado sin usar (is_member_of, de un intento de fix anterior que nunca
-- se conectó a ninguna política) se eliminaron por completo — nada las
-- referencia ya.
-- ============================================================================
drop function if exists public.auth_household_id();
drop function if exists public.is_member_of(uuid);
