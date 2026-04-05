import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
    Task, TaskCompletion, User, HomeSettings, Reminder,
    ShoppingItem, WeeklyMenu, ShoppingConcept
} from '../types';
import { supabase } from '../lib/supabase';

interface AppState {
    tokenName: string;
    setTokenName: (name: string) => void;

    homeSettings: HomeSettings | null;
    setHomeSettings: (settings: HomeSettings) => void;

    users: User[];
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;

    tasks: Task[];
    addTask: (task: Partial<Task>) => Promise<void>;
    updateTask: (task: Task) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;

    completions: TaskCompletion[];
    addCompletion: (taskId: string, userId: string, points: number) => Promise<void>;
    removeCompletion: (completionId: string) => Promise<void>;

    reminders: Reminder[];
    addReminder: (r: Partial<Reminder>) => Promise<void>;
    deleteReminder: (id: string) => Promise<void>;

    shoppingItems: ShoppingItem[];
    addShoppingItem: (name: string, userId: string) => Promise<void>;
    updateShoppingItem: (si: ShoppingItem) => Promise<void>;
    deleteShoppingItem: (id: string) => Promise<void>;

    weeklyMenus: WeeklyMenu[];
    addWeeklyMenu: (m: Partial<WeeklyMenu>) => Promise<void>;
    updateWeeklyMenu: (m: WeeklyMenu) => Promise<void>;
    deleteWeeklyMenu: (id: string) => Promise<void>;

    shoppingConcepts: ShoppingConcept[];
    addShoppingConcept: (s: string) => Promise<void>;
    deleteShoppingConcept: (id: string) => Promise<void>;

    generateInviteId: () => Promise<string>;
    joinHouseholdLink: (inviteId: string) => Promise<void>;
    resetAllData: () => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
    needsProfileSetup: string | null;
    setupProfile: (userId: string, name: string) => Promise<void>;
}

export const AppContext = createContext<AppState | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(() => JSON.parse(localStorage.getItem('octo_cache_user') || 'null'));
    const [homeSettings, setHomeSettings] = useState<HomeSettings | null>(() => JSON.parse(localStorage.getItem('octo_cache_settings') || 'null'));
    const [users, setUsers] = useState<User[]>(() => JSON.parse(localStorage.getItem('octo_cache_users') || '[]'));
    const [tasks, setTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem('octo_cache_tasks') || '[]'));
    const [completions, setCompletions] = useState<TaskCompletion[]>(() => JSON.parse(localStorage.getItem('octo_cache_comps') || '[]'));
    const [reminders, setReminders] = useState<Reminder[]>(() => JSON.parse(localStorage.getItem('octo_cache_rems') || '[]'));
    const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => JSON.parse(localStorage.getItem('octo_cache_shops') || '[]'));
    const [weeklyMenus, setWeeklyMenus] = useState<WeeklyMenu[]>([]);
    const [shoppingConcepts, setShoppingConcepts] = useState<ShoppingConcept[]>(() => JSON.parse(localStorage.getItem('octo_cache_concepts') || '[]'));
    const [needsProfileSetup, setNeedsProfileSetup] = useState<string | null>(null);
    // If we have cached user and settings, we can bypass the initial loading screen instantly!
    const [loading, setLoading] = useState(!(localStorage.getItem('octo_cache_user') && localStorage.getItem('octo_cache_settings')));

    // Persist states to local storage automatically
    useEffect(() => { if (currentUser) localStorage.setItem('octo_cache_user', JSON.stringify(currentUser)); else localStorage.removeItem('octo_cache_user'); }, [currentUser]);
    useEffect(() => { if (homeSettings) localStorage.setItem('octo_cache_settings', JSON.stringify(homeSettings)); else localStorage.removeItem('octo_cache_settings'); }, [homeSettings]);
    useEffect(() => { localStorage.setItem('octo_cache_users', JSON.stringify(users)); }, [users]);
    useEffect(() => { localStorage.setItem('octo_cache_tasks', JSON.stringify(tasks)); }, [tasks]);
    useEffect(() => { localStorage.setItem('octo_cache_comps', JSON.stringify(completions)); }, [completions]);
    useEffect(() => { localStorage.setItem('octo_cache_rems', JSON.stringify(reminders)); }, [reminders]);
    useEffect(() => { localStorage.setItem('octo_cache_shops', JSON.stringify(shoppingItems)); }, [shoppingItems]);
    useEffect(() => { localStorage.setItem('octo_cache_concepts', JSON.stringify(shoppingConcepts)); }, [shoppingConcepts]);

    // Initial session load
    useEffect(() => {
        let isFetching = false;
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                isFetching = true;
                await fetchUserData(session.user.id);
            } else {
                setLoading(false);
            }
        };
        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            // Skip if checkSession already handled it
            if (isFetching && event === 'INITIAL_SESSION') return;
            if (session?.user) {
                await fetchUserData(session.user.id);
            } else {
                setCurrentUser(null);
                setHomeSettings(null);
                setNeedsProfileSetup(null);
                setLoading(false);
            }
        });

        return () => { authListener.subscription.unsubscribe(); };
    }, []);

    const fetchUserData = async (userId: string) => {
        try {
            // Only show loader if we don't have cached data ensuring a 0-sec load time
            if (!currentUser || !homeSettings) setLoading(true);
            const { data: profile, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (pError || !profile) {
                // Profile missing - can we create it automatically?
                const pendingInvite = sessionStorage.getItem('pendingInvite');
                if (pendingInvite) {
                    // Ultra-robust search in JS to avoid "column not found" PostgREST errors
                    const { data: allHomes } = await supabase.from('households').select('*');
                    const inviteHome = (allHomes || []).find(h => 
                        h.household_invitation_id === pendingInvite || 
                        h.householdInvitationId === pendingInvite
                    );

                    if (inviteHome) {
                        // Create profile silently
                        await supabase.from('profiles').upsert({
                            id: userId,
                            household_id: inviteHome.id,
                            full_name: 'Nuevo Miembro'
                        });
                        sessionStorage.removeItem('pendingInvite');
                        // Retry fetch
                        return fetchUserData(userId);
                    }
                }

                // No invitation found? Create a default household siliently
                const { data: household } = await supabase.from('households').insert({ name: 'Mi Hogar' }).select().single();
                if (household) {
                    await supabase.from('profiles').upsert({
                        id: userId,
                        household_id: household.id,
                        full_name: 'Nuevo Miembro'
                    });
                    return fetchUserData(userId);
                }

                // Fallback for safety
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setNeedsProfileSetup(session.user.id);
                } else {
                    setCurrentUser(null);
                }
                setLoading(false);
                return;
            }

            const mappedUser: User = {
                id: profile.id,
                email: '',
                full_name: profile.full_name || profile.fullName || 'Nuevo Miembro',
                avatar_url: profile.avatar_url || profile.avatarUrl || '',
                color_hex: profile.color_hex || profile.colorHex || '#00FF88',
                theme: (profile.theme as 'cyber' | 'light' | 'octogon') || 'cyber',
                household_id: profile.household_id
            };

            setCurrentUser(mappedUser);

            if (profile.household_id) {
                const [hRes, usersRes, tasksRes, compRes, remRes, shopRes] = await Promise.all([
                    supabase.from('households').select('*').eq('id', profile.household_id).single(),
                    supabase.from('profiles').select('*').eq('household_id', profile.household_id),
                    supabase.from('tasks').select('*').eq('household_id', profile.household_id),
                    supabase.from('task_completions').select('*').in('user_id', [profile.id]),
                    supabase.from('reminders').select('*').eq('household_id', profile.household_id),
                    supabase.from('shopping_items').select('*').eq('household_id', profile.household_id)
                ]);

                if (hRes.data) {
                    setHomeSettings({ 
                        ...hRes.data, 
                        themeColor: hRes.data.theme_color || hRes.data.themeColor || '#00FF88',
                        token_name: hRes.data.token_name || hRes.data.tokenName || 'Puntos',
                        householdInvitationId: hRes.data.household_invitation_id || hRes.data.householdInvitationId
                    });
                }
                if (usersRes.data) setUsers(usersRes.data.map((u) => ({
                    id: u.id,
                    email: '',
                    avatar_url: u.avatar_url || '',
                    household_id: u.household_id,
                    full_name: u.full_name,
                    color_hex: u.color_hex,
                    theme: (u.theme as 'cyber' | 'light' | 'octogon') || 'cyber'
                })));
                if (tasksRes.data) setTasks(tasksRes.data);
                if (compRes.data) setCompletions(compRes.data);
                if (remRes.data) setReminders(remRes.data);
                if (shopRes.data) setShoppingItems(shopRes.data);

                const { data: dbRes } = await supabase.from('shopping_database').select('*').eq('household_id', profile.household_id);
                if (dbRes) setShoppingConcepts(dbRes);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const value: AppState = {
        currentUser, setCurrentUser,
        homeSettings, setHomeSettings: (s) => setHomeSettings(s),
        tokenName: homeSettings?.token_name || 'Puntos',
        setTokenName: async (name) => {
            if (!homeSettings) return;
            await supabase.from('households').update({ token_name: name }).eq('id', homeSettings.id);
            setHomeSettings({ ...homeSettings, token_name: name });
        },
        users,
        loading,
        needsProfileSetup,
        setupProfile: async (userId, name) => {
            try {
                // Try to get the pending invite from sessionStorage to join the right household
                const pendingInvite = sessionStorage.getItem('pendingInvite');
                let householdId: string | null = null;

                if (pendingInvite) {
                    const { data: inviteHome, error: inviteError } = await supabase
                        .from('households')
                        .select('id')
                        .eq('householdInvitationId', pendingInvite)
                        .single();
                    
                    if (inviteHome) {
                        householdId = inviteHome.id;
                        sessionStorage.removeItem('pendingInvite');
                    } else if (inviteError && inviteError.code !== 'PGRST116') {
                        // Throw if it's a real error (not just 'no rows found')
                        throw new Error("No se pudo encontrar el hogar de la invitación: " + inviteError.message);
                    }
                }

                if (!householdId) {
                    // 2. Create Household with minimal columns
                    const { data: household, error: hError } = await supabase
                        .from('households')
                        .insert({ name: name + "'s Home" })
                        .select().single();
                    if (hError) throw new Error("Error al crear el hogar: " + hError.message);
                    if (!household) throw new Error("No se pudo crear el hogar.");
                    householdId = household.id;
                }

                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: userId, 
                    household_id: householdId, 
                    full_name: name || 'Nuevo Miembro'
                });

                if (profileError) throw new Error("Error al crear el perfil: " + profileError.message);

                setNeedsProfileSetup(null);
                await fetchUserData(userId);
            } catch (err: any) {
                console.error("Setup Profile Error:", err);
                throw err;
            }
        },
        shoppingConcepts,

        tasks,
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

        completions,
        addCompletion: async (taskId, userId, points) => {
            const { data, error } = await supabase.from('task_completions').insert({ task_id: taskId, user_id: userId, points_earned: points }).select().single();
            if (data && !error) setCompletions(prev => [...prev, data]);
        },
        removeCompletion: async (id) => {
            await supabase.from('task_completions').delete().eq('id', id);
            setCompletions(prev => prev.filter(x => x.id !== id));
        },

        reminders,
        addReminder: async (r) => {
            if (!homeSettings) return;
            const { data, error } = await supabase.from('reminders').insert({ ...r, household_id: homeSettings.id }).select().single();
            if (data && !error) setReminders(prev => [...prev, data]);
        },
        deleteReminder: async (id) => {
            await supabase.from('reminders').delete().eq('id', id);
            setReminders(prev => prev.filter(x => x.id !== id));
        },

        shoppingItems,
        addShoppingItem: async (name, userId) => {
            if (!homeSettings) return;
            const { data, error } = await supabase.from('shopping_items').insert({ name, created_by: userId, household_id: homeSettings.id }).select().single();
            if (data && !error) setShoppingItems(prev => [...prev, data]);
            if (error) console.error("Error adding shopping item:", error);
        },
        updateShoppingItem: async (si) => {
            await supabase.from('shopping_items').update(si).eq('id', si.id);
            setShoppingItems(prev => prev.map(x => x.id === si.id ? si : x));
        },
        deleteShoppingItem: async (id) => {
            await supabase.from('shopping_items').delete().eq('id', id);
            setShoppingItems(prev => prev.filter(x => x.id !== id));
        },

        weeklyMenus,
        addWeeklyMenu: async (m) => { setWeeklyMenus(p => [...p, m as WeeklyMenu]); },
        updateWeeklyMenu: async (m) => { setWeeklyMenus(p => p.map(x => x.id === m.id ? m : x)); },
        deleteWeeklyMenu: async (id) => { setWeeklyMenus(p => p.filter(x => x.id !== id)); },

        addShoppingConcept: async (name) => {
            if (!homeSettings) return;
            const { data, error } = await supabase.from('shopping_database').insert({ name, household_id: homeSettings.id }).select().single();
            if (data && !error) setShoppingConcepts(prev => [...prev, data]);
        },
        deleteShoppingConcept: async (id) => {
            await supabase.from('shopping_database').delete().eq('id', id);
            setShoppingConcepts(prev => prev.filter(x => x.id !== id));
        },

        generateInviteId: async () => {
            if (!homeSettings) return '';
            const id = Math.random().toString(36).substr(2, 9);
            // Try both to be sure
            await supabase.from('households').update({ 
                [homeSettings.household_invitation_id !== undefined ? 'household_invitation_id' : 'householdInvitationId']: id 
            }).eq('id', homeSettings.id);
            setHomeSettings({ ...homeSettings, householdInvitationId: id });
            return id;
        },
        joinHouseholdLink: async (inviteId) => {
            const { data: allHomes } = await supabase.from('households').select('*');
            const inviteHome = (allHomes || []).find(h => 
                h.household_invitation_id === inviteId || 
                h.householdInvitationId === inviteId
            );

            if (inviteHome && currentUser) {
                await supabase.from('profiles').upsert({
                    id: currentUser.id,
                    household_id: inviteHome.id,
                    full_name: currentUser.full_name || 'Nuevo Miembro'
                });
                fetchUserData(currentUser.id);
            }
        },
        logout: async () => {
            await supabase.auth.signOut();
            setCurrentUser(null);
            setHomeSettings(null);
            localStorage.removeItem('octo_cache_user');
            localStorage.removeItem('octo_cache_settings');
            localStorage.removeItem('octo_cache_users');
            localStorage.removeItem('octo_cache_tasks');
            localStorage.removeItem('octo_cache_comps');
            localStorage.removeItem('octo_cache_rems');
            localStorage.removeItem('octo_cache_shops');
            localStorage.removeItem('octo_cache_concepts');
            localStorage.removeItem('octo_active_menu');
        },
        resetAllData: async () => {
            if (!homeSettings) return;
            await supabase.from('task_completions').delete().neq('id', '');
            await supabase.from('shopping_items').delete().eq('household_id', homeSettings.id);
            setCompletions([]);
            setShoppingItems([]);
        }
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppContext must be used within AppProvider");
    return context;
};
