import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
    joinSpaceByInviteLink: (inviteId: string) => Promise<void>;
    resetAllData: () => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
    needsProfileSetup: string | null;
    setupProfile: (userId: string, name: string) => Promise<void>;
    createHousehold: (userId: string, name: string) => Promise<void>;
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
        console.log("FETCH USER DATA - Sincronizando datos para:", userId);
        try {
            // Only show loader if we don't have cached data ensuring a 0-sec load time
            if (!currentUser || !homeSettings) setLoading(true);
            
            const fetchPromise = async () => {
                const { data: profile, error: pError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();
                return { profile, pError };
            };

            const { profile, pError }: any = await Promise.race([
                fetchPromise(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout al obtener perfil")), 10000))
            ]);

            if (pError || !profile) {
                // Profile missing - NEVER create automatically.
                // Just signal that setup is needed.
                const { data: { session } } = await supabase.auth.getSession();
                console.log("FETCH USER DATA - User has no profile, needs setup:", userId);
                
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
                        householdInvitationId: hRes.data.invitation_id || hRes.data.household_invitation_id || hRes.data.householdInvitationId
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

    const value: AppState = useMemo(() => ({
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
        setupProfile: async (userId: string, name: string) => {
            console.log("---- SETUP PROFILE CHECKPOINTS ----");
            console.log("STEP 1: setupProfile START", userId);
            try {
                const pendingInviteRaw = localStorage.getItem('pendingInvite');
                const pendingInvite = pendingInviteRaw?.trim();
                console.log("STEP 2: pendingInvite found and trimmed", pendingInvite);
                if (!pendingInvite) throw new Error("No hay invitación pendiente.");

                console.log("LOG: STEP 3 - Buscando invitación en BD...");
                console.log("LOG: Valor de búsqueda (inviteId):", pendingInvite);
                
                const { data: inviteHome, error: fetchError } = await supabase
                    .from('households')
                    .select('*')
                    .or(`invitation_id.eq.${pendingInvite},household_invitation_id.eq.${pendingInvite},households_invitation_id.eq.${pendingInvite},householdInvitationId.eq.${pendingInvite}`)
                    .maybeSingle();

                console.log("LOG: Resultado Query BD:", inviteHome);
                console.log("LOG: Error Query BD:", fetchError);

                if (fetchError) {
                    console.error("LOG: CRITICAL ERROR STEP 3 - Fetch failed", fetchError);
                    throw fetchError;
                }
                
                if (!inviteHome) {
                    console.error("LOG: STEP 3 FAIL - Invitación NO encontrada en BD para ID:", pendingInvite);
                    throw new Error("INVITE_NOT_FOUND: No se ha encontrado ningún hogar con ese código.");
                }

                console.log("LOG: STEP 4 - Hogar encontrado con éxito:", inviteHome.id);
                console.log("LOG: STEP 5 - Insertando perfil de usuario...");
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: userId, 
                    household_id: inviteHome.id, 
                    full_name: name || 'Nuevo Miembro'
                });

                if (profileError) {
                    console.error("STEP 5 ERROR: Profile Error", profileError);
                    throw profileError;
                }

                console.log("STEP 6: Profile Upserted OK");
                localStorage.removeItem('pendingInvite');
                setNeedsProfileSetup(null);
                
                console.log("STEP 7: Fetching all user data...");
                await fetchUserData(userId);
                console.log("STEP 8: SETUP COMPLETE");
            } catch (err: any) {
                console.error("---- SETUP PROFILE FAILED AT STEP " + (err.step || '?') + " ----", err);
                throw err;
            }
        },
        createHousehold: async (userId: string, name: string) => {
            console.log("CREATE HOUSEHOLD START - User:", userId);
            try {
                const { data: household, error: hError } = await supabase
                    .from('households')
                    .insert({ name: name || "Mi Hogar" })
                    .select().single();
                
                if (hError) throw hError;

                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: userId, 
                    household_id: household.id, 
                    full_name: name || 'Jefe de Hogar'
                });

                if (profileError) throw profileError;

                setNeedsProfileSetup(null);
                await fetchUserData(userId);
            } catch (err: any) {
                console.error("Create Household Error:", err);
                throw err;
            }
        },
        generateInviteId: async () => {
            if (!homeSettings) return '';
            const id = Math.random().toString(36).substring(2, 11).toUpperCase();
            
            const { error: updateError } = await supabase.from('households').update({ 
                invitation_id: id,
                household_invitation_id: id,
                householdInvitationId: id
            }).eq('id', homeSettings.id);

            if (updateError) {
                console.error("Error generating invite:", updateError);
                // Try just one if the above failed
                await supabase.from('households').update({ 
                    invitation_id: id 
                }).eq('id', homeSettings.id);
            }

            setHomeSettings({ 
                ...homeSettings, 
                invitation_id: id,
                householdInvitationId: id,
                household_invitation_id: id 
            });
            return id;
        },
        joinSpaceByInviteLink: async (inviteIdRaw: string) => {
            const inviteId = inviteIdRaw.trim();
            console.log("---- JOIN FLOW CHECKPOINTS ----");
            console.log("STEP 1: iniciando joinSpaceByInviteLink con ID sanitizado", inviteId);
            
            const joinSubStep = async () => {
                console.log("STEP 2: usuario actual", currentUser?.id);
                if (!currentUser) throw new Error("Debes estar logueado para unirte.");

                console.log("LOG: STEP 3 - Buscando invitación en BD...");
                console.log("LOG: Valor de búsqueda (inviteId o Code):", inviteId);
                
                const { data: inviteHome, error: fetchError } = await supabase
                    .from('households')
                    .select('*')
                    .or(`invitation_id.eq.${inviteId},household_invitation_id.eq.${inviteId},households_invitation_id.eq.${inviteId},householdInvitationId.eq.${inviteId}`)
                    .maybeSingle();

                console.log("LOG: Resultado Query BD:", inviteHome);
                console.log("LOG: Error Query BD:", fetchError);

                if (fetchError) {
                    console.error("LOG: CRITICAL ERROR STEP 3 - Fetch failed", fetchError);
                    throw fetchError;
                }
                
                if (!inviteHome) {
                    console.error("LOG: STEP 3 FAIL - Invitación NO encontrada en BD para ID:", inviteId);
                    throw new Error("INVITE_NOT_FOUND: El código introducido no existe o ha expirado.");
                }

                console.log("LOG: STEP 4 - Invitación válida para hogar:", inviteHome.name, "(ID:", inviteHome.id, ")");
                console.log("LOG: STEP 5 - Asignando hogar al perfil del usuario...");
                
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: currentUser.id,
                    household_id: inviteHome.id,
                    full_name: currentUser.full_name || 'Nuevo Miembro'
                });

                if (profileError) {
                    console.error("LOG: STEP 5 FAIL - Error al insertar perfil", profileError);
                    throw profileError;
                }

                console.log("LOG: STEP 6 - Perfil vinculado correctamente");
                console.log("LOG: STEP 7 - Sincronizando datos finales...");
                await fetchUserData(currentUser.id);
                
                console.log("LOG: STEP 8 - TODO OK - Usuario unido correctamente.");
            };

            try {
                // Mandatory 10s Timeout
                await Promise.race([
                    joinSubStep(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error("TIMEOUT: El servidor no responde al vincular el hogar.")), 10000)
                    )
                ]);
                console.log("STEP 9: joinSpaceByInviteLink FINALIZADO OK");
            } catch (err: any) {
                console.error("---- JOIN FAILED ----", err);
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
        logout: async () => {
            await supabase.auth.signOut();
            setCurrentUser(null);
            localStorage.removeItem('pendingInvite');
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
    }), [currentUser, homeSettings, users, loading, needsProfileSetup, shoppingConcepts, tasks, completions, reminders, shoppingItems, weeklyMenus]);

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
