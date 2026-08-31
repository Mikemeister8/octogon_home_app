import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import type {
    Task, TaskCompletion, User, HomeSettings, Reminder,
    ShoppingItem, Menu, MealBlock, MealIngredient, Recipe,
    ShoppingConcept, AppTheme, PendingAction
} from '../types';
import { supabase } from '../lib/supabase';
import { normalizeName } from '../utils/text';

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT INTERFACE
// ─────────────────────────────────────────────────────────────────────────────
interface AppState {
    // User
    currentUser: User | null;
    setCurrentUser: (u: User | null) => void;

    // Households
    households: HomeSettings[];
    homeSettings: HomeSettings | null;
    activeHouseholdId: string | null;
    switchHousehold: (id: string) => Promise<void>;
    setHomeSettings: (s: HomeSettings) => void;

    // Manual refresh (a "refresh" button, as opposed to a full page reload —
    // pulling to refresh on mobile reloads the page and has been reported to
    // drop the session; this re-fetches in place instead)
    refreshing: boolean;
    refreshData: () => Promise<void>;

    // Token
    tokenName: string;
    setTokenName: (name: string) => Promise<void>;

    // Members of active household
    users: User[];

    // Tasks
    tasks: Task[];
    addTask: (t: Partial<Task>) => Promise<void>;
    updateTask: (t: Task) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;

    // Completions
    completions: TaskCompletion[];
    addCompletion: (taskId: string, userId: string, points: number) => Promise<void>;
    removeCompletion: (id: string) => Promise<void>;

    // Reminders
    reminders: Reminder[];
    addReminder: (r: Partial<Reminder>) => Promise<void>;
    deleteReminder: (id: string) => Promise<void>;

    // Shopping
    shoppingItems: ShoppingItem[];
    addShoppingItem: (name: string, userId: string, quantity?: number, unit?: string) => Promise<void>;
    updateShoppingItem: (si: ShoppingItem) => Promise<void>;
    deleteShoppingItem: (id: string) => Promise<void>;

    // Menus — shared by the whole household. Exactly one is 'active' (menú
    // en curso) at a time; the rest are 'saved' history you can reactivate.
    menus: Menu[];
    createMenu: (name: string) => Promise<string>;
    activateMenu: (menuId: string) => Promise<void>;
    deleteMenu: (menuId: string) => Promise<void>;
    saveMenuBlock: (menuId: string, block: { day: string; slot: string; title: string; description?: string; ingredients: MealIngredient[] }) => Promise<void>;
    deleteMenuBlock: (blockId: string) => Promise<void>;
    exportMenuToShopping: (menuId: string) => Promise<void>;

    // Recipe bank — also shared by the household.
    recipes: Recipe[];
    addRecipe: (title: string, description: string, ingredients: MealIngredient[]) => Promise<void>;

    // Shopping concepts
    shoppingConcepts: ShoppingConcept[];
    addShoppingConcept: (name: string) => Promise<void>;
    deleteShoppingConcept: (id: string) => Promise<void>;
    updateShoppingConcept: (id: string, updates: { pack_size?: number | null; pack_unit?: string | null }) => Promise<void>;

    // Invitations
    validateInviteCode: (code: string) => Promise<{ householdId: string; householdName: string } | null>;
    joinHouseholdByCode: (code: string) => Promise<void>;
    generateInviteCode: () => Promise<string>;

    // Auth/setup
    loading: boolean;
    needsProfileSetup: boolean;
    setupError: string | null;
    retrySetup: () => Promise<void>;
    completeSetup: (action:
        | { type: 'create'; householdName: string; userName: string }
        | { type: 'join'; code: string; userName: string }
    ) => Promise<void>;

    logout: () => Promise<void>;

    // Reset by module — each clears one module's data for the active
    // household, keeping tasks (and everything else) untouched.
    resetRanking: () => Promise<void>;
    resetShoppingList: () => Promise<void>;
    resetShoppingDatabase: () => Promise<void>;
    resetReminders: () => Promise<void>;
    resetMenus: () => Promise<void>;
}

export const AppContext = createContext<AppState | null>(null);

// supabase-js serializes every auth call (getSession/getUser/signOut) — and,
// internally, every REST query too, since each one calls getSession() first
// to attach the current token — behind a single in-memory mutex on the
// client. A silent token refresh that never returns (a throttled background
// tab, a flaky mobile connection) wedges that mutex for the rest of the page
// life: every later auth/data call queues behind it and hangs forever, with
// no userland API to clear it. The only guaranteed escape is a full reload,
// which builds a fresh client with a fresh mutex.
const withTimeout = <T,>(promise: PromiseLike<T>, ms = 6000): Promise<T> =>
    new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
        promise.then(
            (v) => { clearTimeout(timer); resolve(v); },
            (e) => { clearTimeout(timer); reject(e); }
        );
    });

// A "TypeError: Failed to fetch" means the browser's fetch() call itself
// never got a response — a dropped mobile connection switching towers, wifi
// hand-off, DNS hiccup — as opposed to a Postgres/RLS error, which comes
// back as a normal {error} result instead of a thrown exception. A
// withTimeout "timed out after Xms" is the other retry-worthy case: it
// means the call — including, critically, the auth mutex described above —
// never resolved at all within the deadline. Both cases mean the request
// essentially never reached (or came back from) the server, so retrying
// can't create a duplicate row the way blindly retrying any failure could.
// The timeout case in particular is worth retrying rather than just
// surfacing: Supabase's own internal lock-recovery (the "steal" fallback
// documented on the auth client) typically clears a wedge within ~5s on its
// own, well inside a 10s timeout — so by the time the first attempt times
// out, the wedge has usually already resolved itself, and a fresh attempt
// right after tends to just work instead of hitting the same wall again.
const isRetryableFailure = (err: unknown): boolean =>
    err instanceof TypeError
    || (err instanceof Error && (err.message === 'Failed to fetch' || err.message.startsWith('timed out after')));

const withNetworkRetry = async <T,>(fn: () => PromiseLike<T>): Promise<T> => {
    try {
        return await fn();
    } catch (err) {
        if (!isRetryableFailure(err)) throw err;
        await new Promise(resolve => setTimeout(resolve, 500));
        return await fn();
    }
};

const hardReset = () => {
    localStorage.clear();
    // ?mode=login tells Auth.tsx to open straight on the login screen — someone
    // who just signed out (or got bounced by a stuck auth client) already has
    // an account; the "create/join a household" welcome screen is the wrong
    // default for them.
    window.location.href = '/auth?mode=login';
};

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(
        () => JSON.parse(localStorage.getItem('octo_cache_user') || 'null')
    );
    const [households, setHouseholds] = useState<HomeSettings[]>(
        () => JSON.parse(localStorage.getItem('octo_cache_households') || '[]')
    );
    const [homeSettings, setHomeSettings] = useState<HomeSettings | null>(
        () => JSON.parse(localStorage.getItem('octo_cache_settings') || 'null')
    );
    const [activeHouseholdId, setActiveHouseholdId] = useState<string | null>(
        () => localStorage.getItem('octo_active_household') || null
    );
    const [users, setUsers] = useState<User[]>(() => JSON.parse(localStorage.getItem('octo_cache_users') || '[]'));
    const [tasks, setTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem('octo_cache_tasks') || '[]'));
    const [completions, setCompletions] = useState<TaskCompletion[]>(() => JSON.parse(localStorage.getItem('octo_cache_comps') || '[]'));
    const [reminders, setReminders] = useState<Reminder[]>(() => JSON.parse(localStorage.getItem('octo_cache_rems') || '[]'));
    const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => JSON.parse(localStorage.getItem('octo_cache_shops') || '[]'));
    const [shoppingConcepts, setShoppingConcepts] = useState<ShoppingConcept[]>(() => JSON.parse(localStorage.getItem('octo_cache_concepts') || '[]'));
    const [menus, setMenus] = useState<Menu[]>(() => JSON.parse(localStorage.getItem('octo_cache_menus') || '[]'));
    const [recipes, setRecipes] = useState<Recipe[]>(() => JSON.parse(localStorage.getItem('octo_cache_recipes') || '[]'));

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
    const [setupError, setSetupError] = useState<string | null>(null);

    // Circuit breaker for loadHouseholdData: whatever ends up calling it
    // repeatedly — a flaky realtime reconnect storm, an unexpected retry
    // path — this makes sure only one load is ever in flight and caps how
    // often a new one can start, so a bug elsewhere can no longer turn into
    // hundreds of requests/second against the database.
    const loadInFlightRef = useRef(false);
    const lastLoadAtRef = useRef(0);
    const MIN_LOAD_INTERVAL_MS = 3000;

    // Cache persistence
    useEffect(() => { if (currentUser) localStorage.setItem('octo_cache_user', JSON.stringify(currentUser)); else localStorage.removeItem('octo_cache_user'); }, [currentUser]);
    useEffect(() => { if (homeSettings) localStorage.setItem('octo_cache_settings', JSON.stringify(homeSettings)); else localStorage.removeItem('octo_cache_settings'); }, [homeSettings]);
    useEffect(() => { localStorage.setItem('octo_cache_households', JSON.stringify(households)); }, [households]);
    useEffect(() => { localStorage.setItem('octo_cache_users', JSON.stringify(users)); }, [users]);
    useEffect(() => { localStorage.setItem('octo_cache_tasks', JSON.stringify(tasks)); }, [tasks]);
    useEffect(() => { localStorage.setItem('octo_cache_comps', JSON.stringify(completions)); }, [completions]);
    useEffect(() => { localStorage.setItem('octo_cache_rems', JSON.stringify(reminders)); }, [reminders]);
    useEffect(() => { localStorage.setItem('octo_cache_shops', JSON.stringify(shoppingItems)); }, [shoppingItems]);
    useEffect(() => { localStorage.setItem('octo_cache_concepts', JSON.stringify(shoppingConcepts)); }, [shoppingConcepts]);
    useEffect(() => { localStorage.setItem('octo_cache_menus', JSON.stringify(menus)); }, [menus]);
    useEffect(() => { localStorage.setItem('octo_cache_recipes', JSON.stringify(recipes)); }, [recipes]);

    // ── Internal: load all data for a specific household ──────────────────────
    // Only two things here actually depend on each other: membersProfiles and
    // completions both need memberIds, which comes from the memberships query.
    // Everything else (household, invitation, tasks, reminders, shopping) only
    // needs householdId, which we already have — so they all fire in one round
    // trip instead of the five sequential ones this used to take.
    const loadHouseholdData = async (householdId: string) => {
        if (loadInFlightRef.current) return;
        const now = Date.now();
        if (now - lastLoadAtRef.current < MIN_LOAD_INTERVAL_MS) return;
        loadInFlightRef.current = true;
        lastLoadAtRef.current = now;
        try {
            await loadHouseholdDataInner(householdId);
        } finally {
            loadInFlightRef.current = false;
        }
    };

    const loadHouseholdDataInner = async (householdId: string) => {
        const [hRes, invRes, membershipsRes, tasksRes, remsRes, shopsRes, dbRes, menusRes, recipesRes] = await Promise.all([
            supabase.from('households').select('*').eq('id', householdId).single(),
            supabase.from('invitations').select('code').eq('household_id', householdId)
                .order('created_at', { ascending: false }).limit(1).maybeSingle(),
            supabase.from('memberships').select('user_id').eq('household_id', householdId),
            supabase.from('tasks').select('*').eq('household_id', householdId),
            supabase.from('reminders').select('*').eq('household_id', householdId),
            supabase.from('shopping_items').select('*').eq('household_id', householdId),
            supabase.from('shopping_database').select('*').eq('household_id', householdId),
            supabase.from('menus').select('*, menu_blocks(*, menu_ingredients(*))').eq('household_id', householdId),
            supabase.from('recipes').select('*, recipe_ingredients(*)').eq('household_id', householdId),
        ]);

        if (hRes.data) {
            const mapped: HomeSettings = {
                ...hRes.data,
                themeColor: hRes.data.theme_color || '#00FF88',
                token_name: hRes.data.token_name || 'Puntos',
                invitation_id: invRes.data?.code,
                householdInvitationId: invRes.data?.code,
            };
            setHomeSettings(mapped);
        }

        if (tasksRes.data) setTasks(tasksRes.data);
        if (remsRes.data) setReminders(remsRes.data);
        if (shopsRes.data) setShoppingItems(shopsRes.data);
        if (dbRes.data) setShoppingConcepts(dbRes.data);

        if (menusRes.data) {
            setMenus(menusRes.data.map((m: any) => ({
                id: m.id,
                household_id: m.household_id,
                name: m.name,
                status: m.status,
                blocks: (m.menu_blocks || []).map((b: any) => ({
                    id: b.id,
                    menu_id: b.menu_id,
                    day: b.day,
                    slot: b.slot,
                    title: b.title,
                    description: b.description,
                    ingredients: (b.menu_ingredients || []).map((i: any) => ({
                        id: i.id, name: i.name, quantity: i.quantity, unit: i.unit,
                    })),
                })),
            })));
        }
        if (recipesRes.data) {
            setRecipes(recipesRes.data.map((r: any) => ({
                id: r.id,
                household_id: r.household_id,
                title: r.title,
                description: r.description,
                ingredients: (r.recipe_ingredients || []).map((i: any) => ({
                    id: i.id, name: i.name, quantity: i.quantity, unit: i.unit,
                })),
            })));
        }

        const memberIds = (membershipsRes.data || []).map((m: any) => m.user_id);

        const [membersRes, compsRes] = await Promise.all([
            memberIds.length > 0
                ? supabase.from('profiles').select('*').in('id', memberIds)
                : Promise.resolve({ data: [] as any[] }),
            memberIds.length > 0
                ? supabase.from('task_completions').select('*').in('user_id', memberIds)
                : Promise.resolve({ data: [] as any[] }),
        ]);

        const mappedUsers: User[] = (membersRes.data || []).map((p: any) => ({
            id: p.id,
            email: '',
            full_name: p.full_name || 'Usuario',
            avatar_url: p.avatar_url || '',
            color_hex: p.color_hex || '#00FF88',
            theme: (p.theme as AppTheme) || 'cyber',
        }));
        setUsers(mappedUsers);

        if (compsRes.data) setCompletions(compsRes.data);
    };

    // ── Internal: create a brand-new household ────────────────────────────────
    const createHouseholdInternal = async (userId: string, householdName: string, userName: string) => {
        console.log('[SETUP] Creating household:', householdName, 'for user:', userId);

        // 1. Upsert profile
        const { error: pErr } = await supabase.from('profiles').upsert({
            id: userId, full_name: userName, color_hex: '#00FF88', theme: 'cyber'
        });
        if (pErr) throw new Error(`Profile error: ${pErr.message}`);

        // 2. Create household
        const { data: household, error: hErr } = await supabase
            .from('households').insert({ name: householdName }).select().single();
        if (hErr) throw new Error(`Household error: ${hErr.message}`);

        // 3. Create membership as owner
        const { error: mErr } = await supabase.from('memberships').insert({
            user_id: userId, household_id: household.id, role: 'owner'
        });
        if (mErr) throw new Error(`Membership error: ${mErr.message}`);

        console.log('[SETUP] Household created:', household.id);
        return household.id;
    };

    // ── Internal: join household via code ─────────────────────────────────────
    const joinHouseholdByCodeInternal = async (userId: string, code: string, userName: string) => {
        const normalized = code.trim().toUpperCase();
        console.log('[JOIN] Looking for invite code:', normalized);

        const { data: invite, error: invErr } = await supabase
            .rpc('check_invite_code', { codigo_ingresado: normalized })
            .maybeSingle() as { data: any, error: any };

        console.log('[JOIN] Invite result:', invite, 'Error:', invErr);

        if (!invite) throw new Error(`Código de invitación "${normalized}" no encontrado.`);

        console.log('[JOIN] Upserting profile for user:', userId);
        // Upsert profile
        const { error: pErr } = await supabase.from('profiles').upsert({
            id: userId, full_name: userName, color_hex: '#00FF88', theme: 'cyber'
        });
        if (pErr) throw new Error(`Profile insert error: ${pErr.message}`);

        console.log('[JOIN] Checking for existing membership...');
        // Check if already a member
        const { data: existing } = await supabase
            .from('memberships').select('id')
            .eq('user_id', userId).eq('household_id', invite.household_id).maybeSingle();
        if (existing) {
            console.log('[JOIN] Already a member, skipping insert');
            return invite.household_id;
        }

        console.log('[JOIN] Inserting membership for household:', invite.household_id);
        // Insert membership
        const { data: mData, error: mErr } = await supabase.from('memberships').insert({
            user_id: userId, household_id: invite.household_id, role: 'member'
        }).select();

        console.log('[JOIN] Membership INSERT result:', mData, 'Error:', mErr);
        if (mErr) throw new Error(`Membership insert error: ${mErr.message}`);

        return invite.household_id;
    };

    // ── Main fetch: loads user profile + all households + active household data
    const fetchUserData = async (userId: string) => {
        console.log('[FETCH] fetchUserData for:', userId);
        try {
            setLoading(true);
            setNeedsProfileSetup(false);
            setSetupError(null);

            // Get profile. Memberships only need userId, not the profile, so
            // there's no real dependency between them — fetch both in the same
            // round trip instead of one after the other.
            const [profileRes, membershipsRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', userId).single(),
                supabase.from('memberships').select('household_id').eq('user_id', userId),
            ]);
            const profile = profileRes.data;

            if (!profile) {
                console.log('[FETCH] No profile found, checking pending action...');
                const pendingAction: PendingAction | null = JSON.parse(
                    localStorage.getItem('octo_pending_action') || 'null'
                );

                if (pendingAction) {
                    try {
                        if (pendingAction.type === 'create') {
                            await createHouseholdInternal(userId, pendingAction.householdName!, pendingAction.userName);
                        } else if (pendingAction.type === 'join') {
                            await joinHouseholdByCodeInternal(userId, pendingAction.code!, pendingAction.userName);
                        }
                        localStorage.removeItem('octo_pending_action');
                        // Recursive call after setup
                        await fetchUserData(userId);
                        return;
                    } catch (err: any) {
                        console.error('[FETCH] Setup failed:', err);
                        setSetupError(err.message);
                        setNeedsProfileSetup(true);
                        setLoading(false);
                        return;
                    }
                } else {
                    // No profile and no pending action - show setup UI
                    setNeedsProfileSetup(true);
                    setLoading(false);
                    return;
                }
            }

            // Map user
            const mappedUser: User = {
                id: profile.id,
                email: '',
                full_name: profile.full_name || 'Usuario',
                avatar_url: profile.avatar_url || '',
                color_hex: profile.color_hex || '#00FF88',
                theme: (profile.theme as AppTheme) || 'cyber',
            };
            setCurrentUser(mappedUser);

            // Logging in never joins a household on its own — that used to happen
            // silently here whenever a stray `octo_join_code` was sitting in
            // localStorage (e.g. left over from someone having backed out of the
            // invite-code screen earlier in the same tab), which could join an
            // account to a household nobody asked for in that action. Joining is
            // now only ever a deliberate action: the invite-code signup flow
            // (which uses octo_pending_action, not this), or "Unirse a otro
            // hogar" in Settings while already logged in.
            const householdIds = (membershipsRes.data || []).map((m: any) => m.household_id);

            if (householdIds.length === 0) {
                console.warn('[FETCH] User has profile but no households');
                setNeedsProfileSetup(true);
                setLoading(false);
                return;
            }

            // Get all household details
            const { data: householdsData } = await supabase
                .from('households').select('*').in('id', householdIds);

            const mappedHouseholds: HomeSettings[] = (householdsData || []).map((h: any) => ({
                id: h.id,
                name: h.name,
                logo: h.logo,
                theme_color: h.theme_color,
                themeColor: h.theme_color || '#00FF88',
                token_name: h.token_name || 'Puntos',
            }));
            setHouseholds(mappedHouseholds);

            // Determine active household
            const savedId = localStorage.getItem('octo_active_household');
            const validId = mappedHouseholds.find(h => h.id === savedId)?.id || mappedHouseholds[0]?.id;
            setActiveHouseholdId(validId || null);
            if (validId) localStorage.setItem('octo_active_household', validId);

            // Load data for active household
            if (validId) {
                await loadHouseholdData(validId);
            }
        } catch (e: any) {
            console.error('[FETCH] Critical error:', e);
        } finally {
            setLoading(false);
        }
    };

    // ── Auth listener ──────────────────────────────────────────────────────────
    useEffect(() => {
        let handled = false;

        const checkSession = async () => {
            // This runs on every fresh page load/refresh, unprotected until
            // now — a wedged auth mutex here (see withTimeout's comment
            // above) left the user staring at the loading spinner
            // indefinitely, which looked exactly like "refreshing hangs and
            // kicks me out." retrySetup already races the same kind of call
            // against a timeout for its manual "Reintentar" button; this
            // gives the automatic initial load the same escape hatch instead
            // of only offering it after the user notices something's wrong.
            try {
                const { data: { session }, error } = await withTimeout(supabase.auth.getSession());
                if (error) throw error;
                if (session?.user) {
                    handled = true;
                    await withTimeout(fetchUserData(session.user.id), 10000);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error('[AUTH] checkSession stuck, forcing a hard reload:', err);
                hardReset();
            }
        };
        checkSession();

        const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (handled && event === 'INITIAL_SESSION') return;
            
            if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
                setHomeSettings(null);
                setHouseholds([]);
                setActiveHouseholdId(null);
                setNeedsProfileSetup(false);
                setLoading(false);
                handled = false;
            } else if (session?.user) {
                // Only fetch if we are signing in OR if we haven't handled a session yet
                if (event === 'SIGNED_IN' || !handled) {
                    handled = true;
                    await fetchUserData(session.user.id);
                }
            }
        });

        return () => { listener.subscription.unsubscribe(); };
        // Intentionally run once: fetchUserData always sets a fresh `currentUser`
        // object, so depending on `currentUser` here re-subscribed this listener
        // (and re-ran checkSession) on every single fetch, causing an unbounded
        // refetch loop that looked like a permanently stuck loading screen.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Realtime: reflect changes made by other household members ─────────────
    // Without this, one member's completed task / new shopping item / edited
    // reminder only appeared for everyone else after a full manual reload —
    // which looked exactly like each person being in a separate, unsynced
    // household even though the data was shared correctly underneath.
    useEffect(() => {
        // Wait until the initial load is confirmed (not just a cached/stale
        // activeHouseholdId from localStorage) before opening a socket, so a
        // slow/blocked realtime connection on a bad network can never contend
        // with — or get subscribed to the wrong household ahead of — the
        // plain REST calls that log-in depends on.
        if (!activeHouseholdId || loading) return;

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        const refresh = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => { loadHouseholdData(activeHouseholdId); }, 400);
        };

        const channel = supabase
            .channel(`household-${activeHouseholdId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `household_id=eq.${activeHouseholdId}` }, refresh)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders', filter: `household_id=eq.${activeHouseholdId}` }, refresh)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items', filter: `household_id=eq.${activeHouseholdId}` }, refresh)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_database', filter: `household_id=eq.${activeHouseholdId}` }, refresh)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'memberships', filter: `household_id=eq.${activeHouseholdId}` }, refresh)
            // task_completions has no household_id column to filter by directly;
            // refresh() just re-fetches this household's own data either way.
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_completions' }, refresh)
            .subscribe();

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            supabase.removeChannel(channel);
        };
    }, [activeHouseholdId, loading]);

    // ─────────────────────────────────────────────────────────────────────────
    // CONTEXT VALUE
    // ─────────────────────────────────────────────────────────────────────────
    const value: AppState = useMemo(() => ({
        currentUser, setCurrentUser,
        households, homeSettings,
        setHomeSettings: (s) => setHomeSettings(s),
        activeHouseholdId,

        switchHousehold: async (id: string) => {
            setActiveHouseholdId(id);
            localStorage.setItem('octo_active_household', id);
            setLoading(true);
            try { await loadHouseholdData(id); }
            finally { setLoading(false); }
        },

        refreshing,
        refreshData: async () => {
            if (!activeHouseholdId) return;
            setRefreshing(true);
            try { await loadHouseholdData(activeHouseholdId); }
            finally { setRefreshing(false); }
        },

        tokenName: homeSettings?.token_name || 'Puntos',
        setTokenName: async (name: string) => {
            if (!homeSettings) return;
            await supabase.from('households').update({ token_name: name }).eq('id', homeSettings.id);
            setHomeSettings({ ...homeSettings, token_name: name });
        },

        users, tasks, completions, reminders, shoppingItems, menus, recipes, shoppingConcepts,
        loading, needsProfileSetup, setupError,

        retrySetup: async () => {
            // getUser() and fetchUserData() both go through the shared auth
            // mutex above — if it's wedged, race the whole thing against a
            // timeout instead of hanging the "Reintentar" button forever too.
            try {
                const { data: { user } } = await withTimeout(supabase.auth.getUser());
                if (user) await withTimeout(fetchUserData(user.id), 10000);
            } catch (e) {
                console.error('[retrySetup] auth client stuck, forcing a hard reload:', e);
                hardReset();
            }
        },

        // Runs when a signed-in user has no household yet (needsProfileSetup)
        // and needs to create or join one without going through signup again.
        completeSetup: async (action) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No autenticado');

            if (action.type === 'create') {
                await createHouseholdInternal(user.id, action.householdName, action.userName);
            } else {
                await joinHouseholdByCodeInternal(user.id, action.code, action.userName);
            }
            await fetchUserData(user.id);
        },

        // ── Invitations ────────────────────────────────────────────────────────
        validateInviteCode: async (code: string) => {
            const normalized = code.trim().toUpperCase();
            const { data } = await supabase
                .rpc('check_invite_code', { codigo_ingresado: normalized })
                .maybeSingle() as { data: any, error: any };

            if (!data) return null;
            return {
                householdId: data.household_id,
                householdName: data.household_name || 'Hogar',
            };
        },

        joinHouseholdByCode: async (code: string) => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser || !currentUser) throw new Error('No autenticado');
            const householdId = await joinHouseholdByCodeInternal(authUser.id, code, currentUser.full_name);
            // Refresh data
            await fetchUserData(authUser.id);
            // Switch to the new household
            if (householdId) {
                setActiveHouseholdId(householdId);
                localStorage.setItem('octo_active_household', householdId);
            }
        },

        generateInviteCode: async () => {
            if (!homeSettings) return '';
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return '';
            const code = Math.random().toString(36).substring(2, 11).toUpperCase();
            const { error } = await supabase.from('invitations').insert({
                code, household_id: homeSettings.id, created_by: authUser.id
            });
            if (error) throw new Error(`Error generando código: ${error.message}`);
            setHomeSettings({ ...homeSettings, invitation_id: code, householdInvitationId: code });
            return code;
        },

        // ── Tasks ──────────────────────────────────────────────────────────────
        addTask: async (t) => {
            if (!homeSettings) return;
            const { data, error } = await supabase.from('tasks').insert({ ...t, household_id: homeSettings.id }).select().single();
            if (data && !error) setTasks(prev => [...prev, data]);
            else if (error) console.error('[addTask] failed:', error.message);
        },
        updateTask: async (t) => {
            const { error } = await supabase.from('tasks').update(t).eq('id', t.id);
            if (error) { console.error('[updateTask] failed:', error.message); return; }
            setTasks(prev => prev.map(x => x.id === t.id ? t : x));
        },
        deleteTask: async (id) => {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) { console.error('[deleteTask] failed:', error.message); return; }
            setTasks(prev => prev.filter(x => x.id !== id));
        },

        // ── Completions ────────────────────────────────────────────────────────
        addCompletion: async (taskId, userId, points) => {
            const { data, error } = await supabase.from('task_completions')
                .insert({ task_id: taskId, user_id: userId, points_earned: points }).select().single();
            if (data && !error) setCompletions(prev => [...prev, data]);
            else if (error) console.error('[addCompletion] failed:', error.message);
        },
        removeCompletion: async (id) => {
            const { error } = await supabase.from('task_completions').delete().eq('id', id);
            if (error) { console.error('[removeCompletion] failed:', error.message); return; }
            setCompletions(prev => prev.filter(x => x.id !== id));
        },

        // ── Reminders ──────────────────────────────────────────────────────────
        addReminder: async (r) => {
            if (!homeSettings) return;
            const { data, error } = await supabase.from('reminders')
                .insert({ ...r, household_id: homeSettings.id }).select().single();
            if (data && !error) setReminders(prev => [...prev, data]);
            else if (error) console.error('[addReminder] failed:', error.message);
        },
        deleteReminder: async (id) => {
            const { error } = await supabase.from('reminders').delete().eq('id', id);
            if (error) { console.error('[deleteReminder] failed:', error.message); return; }
            setReminders(prev => prev.filter(x => x.id !== id));
        },

        // ── Shopping ───────────────────────────────────────────────────────────
        addShoppingItem: async (name, userId, quantity = 1, unit = 'ud') => {
            if (!homeSettings) return;
            const { data, error } = await supabase.from('shopping_items')
                .insert({ name, created_by: userId, household_id: homeSettings.id, quantity, unit }).select().single();
            if (data && !error) setShoppingItems(prev => [...prev, data]);
            else if (error) console.error('[addShoppingItem] failed:', error.message);
        },
        updateShoppingItem: async (si) => {
            const { error } = await supabase.from('shopping_items').update(si).eq('id', si.id);
            if (error) { console.error('[updateShoppingItem] failed:', error.message); return; }
            setShoppingItems(prev => prev.map(x => x.id === si.id ? si : x));
        },
        deleteShoppingItem: async (id) => {
            const { error } = await supabase.from('shopping_items').delete().eq('id', id);
            if (error) { console.error('[deleteShoppingItem] failed:', error.message); return; }
            setShoppingItems(prev => prev.filter(x => x.id !== id));
        },

        // ── Menus ──────────────────────────────────────────────────────────────
        createMenu: async (name) => {
            if (!homeSettings) throw new Error('Sin hogar activo');
            // Only one menu can be 'active' per household (DB partial unique
            // index enforces it) — demote the current one first or the insert
            // below is rejected.
            const currentActive = menus.find(m => m.status === 'active');
            if (currentActive) {
                await supabase.from('menus').update({ status: 'saved' }).eq('id', currentActive.id);
            }
            const { data, error } = await supabase.from('menus')
                .insert({ household_id: homeSettings.id, name, status: 'active' }).select().single();
            if (error || !data) throw new Error(error?.message || 'No se pudo crear el menú');
            setMenus(prev => [
                ...prev.map(m => m.status === 'active' ? { ...m, status: 'saved' as const } : m),
                { id: data.id, household_id: data.household_id, name: data.name, status: 'active', blocks: [] },
            ]);
            return data.id as string;
        },
        activateMenu: async (menuId) => {
            const currentActive = menus.find(m => m.status === 'active' && m.id !== menuId);
            if (currentActive) {
                const { error } = await supabase.from('menus').update({ status: 'saved' }).eq('id', currentActive.id);
                if (error) { console.error('[activateMenu] failed to demote previous active:', error.message); return; }
            }
            const { error } = await supabase.from('menus').update({ status: 'active' }).eq('id', menuId);
            if (error) { console.error('[activateMenu] failed:', error.message); return; }
            setMenus(prev => prev.map(m => ({
                ...m,
                status: m.id === menuId ? 'active' : (m.status === 'active' ? 'saved' : m.status),
            })));
        },
        deleteMenu: async (menuId) => {
            const { error } = await supabase.from('menus').delete().eq('id', menuId);
            if (error) { console.error('[deleteMenu] failed:', error.message); return; }
            setMenus(prev => prev.filter(m => m.id !== menuId));
        },
        // Upserts on (menu_id, day, slot) and replaces that block's ingredients
        // wholesale — simpler and just as correct as diffing a handful of rows.
        saveMenuBlock: async (menuId, block) => {
            // Throws on failure instead of swallowing it — a caller that
            // only awaits this and closes the modal on return would
            // otherwise look successful on a failed save (the same class of
            // bug fixed for addRecipe). Also inserts the NEW ingredients
            // before removing the OLD ones (rather than delete-then-insert):
            // if the insert fails, the block's existing ingredients are
            // still there instead of having just been wiped out first.
            const { data: blockData, error: blockErr } = await withNetworkRetry(() => withTimeout(
                supabase.from('menu_blocks')
                    .upsert(
                        { menu_id: menuId, day: block.day, slot: block.slot, title: block.title, description: block.description || null },
                        { onConflict: 'menu_id,day,slot' }
                    ).select().single(),
                10000
            ));
            if (blockErr || !blockData) throw new Error(blockErr?.message || 'No se pudo guardar el plato.');

            let ingredientRows: any[] = [];
            if (block.ingredients.length > 0) {
                const { data: insData, error: insErr } = await withNetworkRetry(() => withTimeout(
                    supabase.from('menu_ingredients')
                        .insert(block.ingredients.map(i => ({ block_id: blockData.id, name: i.name, quantity: i.quantity, unit: i.unit })))
                        .select(),
                    10000
                ));
                if (insErr) throw new Error(insErr.message || 'No se pudieron guardar los ingredientes.');
                ingredientRows = insData || [];
            }

            const newIds = ingredientRows.map((i: any) => i.id);
            const cleanup = supabase.from('menu_ingredients').delete().eq('block_id', blockData.id);
            const { error: delErr } = await (newIds.length > 0 ? cleanup.not('id', 'in', `(${newIds.join(',')})`) : cleanup);
            if (delErr) console.error('[saveMenuBlock] cleanup of old ingredients failed:', delErr.message);

            const newBlock: MealBlock = {
                id: blockData.id, menu_id: blockData.menu_id, day: blockData.day, slot: blockData.slot,
                title: blockData.title, description: blockData.description,
                ingredients: ingredientRows.map((i: any) => ({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit })),
            };
            setMenus(prev => prev.map(m => m.id !== menuId ? m : {
                ...m,
                blocks: [...m.blocks.filter(b => !(b.day === block.day && b.slot === block.slot)), newBlock],
            }));
        },
        deleteMenuBlock: async (blockId) => {
            const { error } = await supabase.from('menu_blocks').delete().eq('id', blockId);
            if (error) { console.error('[deleteMenuBlock] failed:', error.message); return; }
            setMenus(prev => prev.map(m => ({ ...m, blocks: m.blocks.filter(b => b.id !== blockId) })));
        },
        // Same ingredient name + same unit -> one summed row (2 latas + 1 lata
        // -> 3 latas); same name but a different unit stays a separate row
        // (3 latas de atún and 200 g de atún don't merge) — UNLESS that unit
        // is a concept's defined sub-unit (e.g. jamón measured in "lonchas"),
        // in which case the summed sub-unit total is converted to whole
        // packages (rounded up — you can't buy 2.3 paquetes) before being
        // merged into the shopping list as "paquete".
        exportMenuToShopping: async (menuId) => {
            if (!homeSettings || !currentUser) return;
            const menu = menus.find(m => m.id === menuId);
            if (!menu) return;
            const allIngredients = menu.blocks.flatMap(b => b.ingredients);

            const rawGroups = new Map<string, { name: string; unit: string; quantity: number }>();
            allIngredients.forEach(ing => {
                const key = `${normalizeName(ing.name)}__${ing.unit.trim().toLowerCase()}`;
                const g = rawGroups.get(key);
                if (g) g.quantity += Number(ing.quantity);
                else rawGroups.set(key, { name: ing.name.trim(), unit: ing.unit.trim(), quantity: Number(ing.quantity) });
            });

            const groups = new Map<string, { name: string; unit: string; quantity: number }>();
            rawGroups.forEach(g => {
                const concept = shoppingConcepts.find(c => normalizeName(c.name) === normalizeName(g.name));
                const isSubUnit = !!concept?.pack_size && !!concept?.pack_unit
                    && concept.pack_unit.trim().toLowerCase() === g.unit.toLowerCase();
                const unit = isSubUnit ? 'paquete' : g.unit;
                const quantity = isSubUnit ? Math.ceil(g.quantity / concept!.pack_size!) : g.quantity;
                const key = `${normalizeName(g.name)}__${unit.toLowerCase()}`;
                const existing = groups.get(key);
                if (existing) existing.quantity += quantity;
                else groups.set(key, { name: g.name, unit, quantity });
            });

            const rows = Array.from(groups.values()).map(({ name, unit, quantity }) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                quantity, unit,
                created_by: currentUser.id,
                household_id: homeSettings.id,
            }));
            if (rows.length === 0) return;
            const { data, error } = await supabase.from('shopping_items').insert(rows).select();
            if (error) { console.error('[exportMenuToShopping] failed:', error.message); return; }
            if (data) setShoppingItems(prev => [...prev, ...data]);
        },

        // ── Recipe bank ────────────────────────────────────────────────────────
        addRecipe: async (title, description, ingredients) => {
            // Throws on failure instead of silently returning — a caller
            // that only awaits this and then shows "¡Receta guardada!"
            // unconditionally would otherwise lie to the user on a failed
            // insert (e.g. a dropped request), which is exactly what
            // happened here: the alert always fired even when nothing was
            // ever written to the database.
            if (!homeSettings) throw new Error('No se pudo guardar: hogar no cargado todavía.');
            const { data: recipeData, error: recipeErr } = await withNetworkRetry(() => withTimeout(
                supabase.from('recipes')
                    .insert({ household_id: homeSettings.id, title, description: description || null }).select().single(),
                10000
            ));
            if (recipeErr || !recipeData) throw new Error(recipeErr?.message || 'No se pudo guardar la receta.');

            let ingredientRows: any[] = [];
            if (ingredients.length > 0) {
                try {
                    const { data: insData, error: insErr } = await withNetworkRetry(() => withTimeout(
                        supabase.from('recipe_ingredients')
                            .insert(ingredients.map(i => ({ recipe_id: recipeData.id, name: i.name, quantity: i.quantity, unit: i.unit })))
                            .select(),
                        10000
                    ));
                    if (insErr) throw new Error(insErr.message || 'No se pudieron guardar los ingredientes.');
                    ingredientRows = insData || [];
                } catch (err) {
                    // Roll back the recipe row itself — a flaky connection
                    // (e.g. mobile network dropping between the two inserts)
                    // must not leave a title-only recipe with none of its
                    // ingredients behind. Either both land or neither does.
                    await supabase.from('recipes').delete().eq('id', recipeData.id);
                    throw err instanceof Error ? err : new Error('No se pudieron guardar los ingredientes.');
                }
            }

            setRecipes(prev => [...prev, {
                id: recipeData.id, household_id: recipeData.household_id, title: recipeData.title, description: recipeData.description,
                ingredients: ingredientRows.map((i: any) => ({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit })),
            }]);
        },

        // ── Shopping concepts ──────────────────────────────────────────────────
        // Self-guards against near-duplicates (same name, different accent or
        // case — "Jamón" vs "jamon") so every caller (recipe/menu ingredient
        // entry, the shopping list's own add form, the food database's manual
        // add) gets deduping for free instead of each having to check first.
        addShoppingConcept: async (name) => {
            if (!homeSettings) return;
            if (shoppingConcepts.some(c => normalizeName(c.name) === normalizeName(name))) return;
            const { data, error } = await supabase.from('shopping_database')
                .insert({ name, household_id: homeSettings.id }).select().single();
            if (data && !error) setShoppingConcepts(prev => [...prev, data]);
            else if (error) console.error('[addShoppingConcept] failed:', error.message);
        },
        deleteShoppingConcept: async (id) => {
            const { error } = await supabase.from('shopping_database').delete().eq('id', id);
            if (error) { console.error('[deleteShoppingConcept] failed:', error.message); return; }
            setShoppingConcepts(prev => prev.filter(x => x.id !== id));
        },
        updateShoppingConcept: async (id, updates) => {
            const { data, error } = await supabase.from('shopping_database').update(updates).eq('id', id).select().single();
            if (error || !data) throw new Error(error?.message || 'No se pudo guardar el formato de paquete.');
            setShoppingConcepts(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
        },

        // ── Logout ─────────────────────────────────────────────────────────────
        // Always ends in a full reload (not just resetting React state): that's
        // what actually guarantees a clean slate — a fresh auth client (in case
        // the shared mutex above is wedged, which is exactly when someone reaches
        // for "Cerrar sesión" as an escape hatch) and no leftover realtime
        // subscriptions from the previous session.
        logout: async () => {
            try {
                await withTimeout(supabase.auth.signOut(), 4000);
            } catch (e) {
                console.warn('[logout] signOut stuck or failed, forcing a hard reload anyway:', e);
            }
            hardReset();
        },

        // ── Reset by module ────────────────────────────────────────────────────
        // Each of these clears one module's data for the active household only
        // (never tasks — those stay) so a member can wipe e.g. just the ranking
        // without touching the shopping list or the food database.
        resetRanking: async () => {
            if (!homeSettings) return;
            const { data: taskRows } = await supabase.from('tasks').select('id').eq('household_id', homeSettings.id);
            const taskIds = (taskRows || []).map((t: any) => t.id);
            if (taskIds.length > 0) {
                const { error } = await supabase.from('task_completions').delete().in('task_id', taskIds);
                if (error) { console.error('[resetRanking] failed:', error.message); return; }
            }
            setCompletions(prev => prev.filter(c => !taskIds.includes(c.task_id)));
        },
        resetShoppingList: async () => {
            if (!homeSettings) return;
            const { error } = await supabase.from('shopping_items').delete().eq('household_id', homeSettings.id);
            if (error) { console.error('[resetShoppingList] failed:', error.message); return; }
            setShoppingItems([]);
        },
        resetShoppingDatabase: async () => {
            if (!homeSettings) return;
            const { error } = await supabase.from('shopping_database').delete().eq('household_id', homeSettings.id);
            if (error) { console.error('[resetShoppingDatabase] failed:', error.message); return; }
            setShoppingConcepts([]);
        },
        resetReminders: async () => {
            if (!homeSettings) return;
            const { error } = await supabase.from('reminders').delete().eq('household_id', homeSettings.id);
            if (error) { console.error('[resetReminders] failed:', error.message); return; }
            setReminders([]);
        },
        // Menus/recipes aren't synced to the household in Supabase yet — Meals.tsx
        // keeps them in this browser's localStorage only — so this only clears
        // them here, not for other members. Settings.tsx says so in the UI.
        // Menus/recipes are now real household data (Supabase, cascade-deletes
        // blocks/ingredients along with their parent row) — not a per-device
        // localStorage cache like before.
        resetMenus: async () => {
            if (!homeSettings) return;
            const { error: menusErr } = await supabase.from('menus').delete().eq('household_id', homeSettings.id);
            if (menusErr) { console.error('[resetMenus] menus failed:', menusErr.message); return; }
            const { error: recipesErr } = await supabase.from('recipes').delete().eq('household_id', homeSettings.id);
            if (recipesErr) { console.error('[resetMenus] recipes failed:', recipesErr.message); return; }
            setMenus([]);
            setRecipes([]);
        },

    }), [currentUser, households, homeSettings, activeHouseholdId, users, tasks, completions,
        reminders, shoppingItems, menus, recipes, shoppingConcepts, loading, refreshing, needsProfileSetup, setupError]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useAppContext must be used within AppProvider');
    return ctx;
};
