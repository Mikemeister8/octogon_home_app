import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type {
    Task, TaskCompletion, User, HomeSettings, Reminder,
    ShoppingItem, WeeklyMenu, ShoppingConcept, AppTheme, PendingAction
} from '../types';
import { supabase } from '../lib/supabase';

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
    addShoppingItem: (name: string, userId: string) => Promise<void>;
    updateShoppingItem: (si: ShoppingItem) => Promise<void>;
    deleteShoppingItem: (id: string) => Promise<void>;

    // Weekly menus
    weeklyMenus: WeeklyMenu[];
    addWeeklyMenu: (m: Partial<WeeklyMenu>) => Promise<void>;
    updateWeeklyMenu: (m: WeeklyMenu) => Promise<void>;
    deleteWeeklyMenu: (id: string) => Promise<void>;

    // Shopping concepts
    shoppingConcepts: ShoppingConcept[];
    addShoppingConcept: (name: string) => Promise<void>;
    deleteShoppingConcept: (id: string) => Promise<void>;

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
    resetAllData: () => Promise<void>;
}

export const AppContext = createContext<AppState | null>(null);

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
    const [weeklyMenus, setWeeklyMenus] = useState<WeeklyMenu[]>([]);
    const [shoppingConcepts, setShoppingConcepts] = useState<ShoppingConcept[]>(() => JSON.parse(localStorage.getItem('octo_cache_concepts') || '[]'));

    const [loading, setLoading] = useState(true);
    const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
    const [setupError, setSetupError] = useState<string | null>(null);

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

    // ── Internal: load all data for a specific household ──────────────────────
    const loadHouseholdData = async (householdId: string) => {
        const [hRes, invRes] = await Promise.all([
            supabase.from('households').select('*').eq('id', householdId).single(),
            supabase.from('invitations').select('code').eq('household_id', householdId)
                .order('created_at', { ascending: false }).limit(1).maybeSingle()
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

        // Members via memberships
        const { data: memberships } = await supabase
            .from('memberships').select('user_id').eq('household_id', householdId);
        const memberIds = (memberships || []).map((m: any) => m.user_id);

        const { data: membersProfiles } = memberIds.length > 0
            ? await supabase.from('profiles').select('*').in('id', memberIds)
            : { data: [] };

        const mappedUsers: User[] = (membersProfiles || []).map((p: any) => ({
            id: p.id,
            email: '',
            full_name: p.full_name || 'Usuario',
            avatar_url: p.avatar_url || '',
            color_hex: p.color_hex || '#00FF88',
            theme: (p.theme as AppTheme) || 'cyber',
        }));
        setUsers(mappedUsers);

        // Data queries in parallel
        const [tasksRes, remsRes, shopsRes, dbRes] = await Promise.all([
            supabase.from('tasks').select('*').eq('household_id', householdId),
            supabase.from('reminders').select('*').eq('household_id', householdId),
            supabase.from('shopping_items').select('*').eq('household_id', householdId),
            supabase.from('shopping_database').select('*').eq('household_id', householdId),
        ]);

        if (tasksRes.data) setTasks(tasksRes.data);
        if (remsRes.data) setReminders(remsRes.data);
        if (shopsRes.data) setShoppingItems(shopsRes.data);
        if (dbRes.data) setShoppingConcepts(dbRes.data);

        // Completions from ALL members
        if (memberIds.length > 0) {
            const { data: comps } = await supabase
                .from('task_completions').select('*').in('user_id', memberIds);
            if (comps) setCompletions(comps);
        }
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

            // Get profile
            const { data: profile } = await supabase
                .from('profiles').select('*').eq('id', userId).single();

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

            // Check for pending join (existing user visiting invite link)
            const pendingJoinCode = localStorage.getItem('octo_join_code');
            if (pendingJoinCode) {
                try {
                    await joinHouseholdByCodeInternal(userId, pendingJoinCode, profile.full_name);
                    localStorage.removeItem('octo_join_code');
                } catch (e) {
                    console.warn('[FETCH] Auto-join from pending code failed:', e);
                    localStorage.removeItem('octo_join_code');
                }
            }

            // Get all memberships
            const { data: memberships } = await supabase
                .from('memberships').select('household_id').eq('user_id', userId);
            const householdIds = (memberships || []).map((m: any) => m.household_id);

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
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;
                if (session?.user) {
                    handled = true;
                    await fetchUserData(session.user.id);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error('[AUTH] getSession error:', err);
                setLoading(false);
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
                // Only fetch if we are signing in OR if we don't have the user yet
                if (event === 'SIGNED_IN' || !handled || !currentUser) {
                    handled = true;
                    await fetchUserData(session.user.id);
                }
            }
        });

        return () => { listener.subscription.unsubscribe(); };
    }, [currentUser]);

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

        tokenName: homeSettings?.token_name || 'Puntos',
        setTokenName: async (name: string) => {
            if (!homeSettings) return;
            await supabase.from('households').update({ token_name: name }).eq('id', homeSettings.id);
            setHomeSettings({ ...homeSettings, token_name: name });
        },

        users, tasks, completions, reminders, shoppingItems, weeklyMenus, shoppingConcepts,
        loading, needsProfileSetup, setupError,

        retrySetup: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) await fetchUserData(user.id);
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
        },
        updateTask: async (t) => {
            await supabase.from('tasks').update(t).eq('id', t.id);
            setTasks(prev => prev.map(x => x.id === t.id ? t : x));
        },
        deleteTask: async (id) => {
            await supabase.from('tasks').delete().eq('id', id);
            setTasks(prev => prev.filter(x => x.id !== id));
        },

        // ── Completions ────────────────────────────────────────────────────────
        addCompletion: async (taskId, userId, points) => {
            const { data, error } = await supabase.from('task_completions')
                .insert({ task_id: taskId, user_id: userId, points_earned: points }).select().single();
            if (data && !error) setCompletions(prev => [...prev, data]);
        },
        removeCompletion: async (id) => {
            await supabase.from('task_completions').delete().eq('id', id);
            setCompletions(prev => prev.filter(x => x.id !== id));
        },

        // ── Reminders ──────────────────────────────────────────────────────────
        addReminder: async (r) => {
            if (!homeSettings) return;
            const { data, error } = await supabase.from('reminders')
                .insert({ ...r, household_id: homeSettings.id }).select().single();
            if (data && !error) setReminders(prev => [...prev, data]);
        },
        deleteReminder: async (id) => {
            await supabase.from('reminders').delete().eq('id', id);
            setReminders(prev => prev.filter(x => x.id !== id));
        },

        // ── Shopping ───────────────────────────────────────────────────────────
        addShoppingItem: async (name, userId) => {
            if (!homeSettings) return;
            const { data, error } = await supabase.from('shopping_items')
                .insert({ name, created_by: userId, household_id: homeSettings.id }).select().single();
            if (data && !error) setShoppingItems(prev => [...prev, data]);
        },
        updateShoppingItem: async (si) => {
            await supabase.from('shopping_items').update(si).eq('id', si.id);
            setShoppingItems(prev => prev.map(x => x.id === si.id ? si : x));
        },
        deleteShoppingItem: async (id) => {
            await supabase.from('shopping_items').delete().eq('id', id);
            setShoppingItems(prev => prev.filter(x => x.id !== id));
        },

        // ── Weekly menus ───────────────────────────────────────────────────────
        addWeeklyMenu: async (m) => { setWeeklyMenus(p => [...p, m as WeeklyMenu]); },
        updateWeeklyMenu: async (m) => { setWeeklyMenus(p => p.map(x => x.id === m.id ? m : x)); },
        deleteWeeklyMenu: async (id) => { setWeeklyMenus(p => p.filter(x => x.id !== id)); },

        // ── Shopping concepts ──────────────────────────────────────────────────
        addShoppingConcept: async (name) => {
            if (!homeSettings) return;
            const { data, error } = await supabase.from('shopping_database')
                .insert({ name, household_id: homeSettings.id }).select().single();
            if (data && !error) setShoppingConcepts(prev => [...prev, data]);
        },
        deleteShoppingConcept: async (id) => {
            await supabase.from('shopping_database').delete().eq('id', id);
            setShoppingConcepts(prev => prev.filter(x => x.id !== id));
        },

        // ── Logout ─────────────────────────────────────────────────────────────
        logout: async () => {
            await supabase.auth.signOut();
            localStorage.clear();
            setCurrentUser(null);
            setHomeSettings(null);
            setHouseholds([]);
            setActiveHouseholdId(null);
            setUsers([]);
            setTasks([]);
            setCompletions([]);
            setReminders([]);
            setShoppingItems([]);
            setShoppingConcepts([]);
        },

        resetAllData: async () => {
            if (!homeSettings) return;
            await supabase.from('task_completions').delete().neq('id', '');
            await supabase.from('shopping_items').delete().eq('household_id', homeSettings.id);
            setCompletions([]);
            setShoppingItems([]);
        },

    }), [currentUser, households, homeSettings, activeHouseholdId, users, tasks, completions,
        reminders, shoppingItems, weeklyMenus, shoppingConcepts, loading, needsProfileSetup, setupError]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useAppContext must be used within AppProvider');
    return ctx;
};
