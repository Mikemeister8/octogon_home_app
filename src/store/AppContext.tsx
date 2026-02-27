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
    logout: () => Promise<void>;
    loading: boolean;
}

export const AppContext = createContext<AppState | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [homeSettings, setHomeSettings] = useState<HomeSettings | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [completions, setCompletions] = useState<TaskCompletion[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
    const [weeklyMenus, setWeeklyMenus] = useState<WeeklyMenu[]>([]);
    const [shoppingConcepts, setShoppingConcepts] = useState<ShoppingConcept[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial session load
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchUserData(session.user.id);
            } else {
                setLoading(false);
            }
        };
        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_, session) => {
            if (session?.user) {
                await fetchUserData(session.user.id);
            } else {
                setCurrentUser(null);
                setHomeSettings(null);
                setLoading(false);
            }
        });

        return () => { authListener.subscription.unsubscribe(); };
    }, []);

    const fetchUserData = async (userId: string) => {
        try {
            setLoading(true);
            const { data: profile, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (pError || !profile) {
                setCurrentUser(null);
                setLoading(false);
                return;
            }

            const mappedUser: User = {
                id: profile.id,
                email: '',
                full_name: profile.full_name,
                avatar_url: profile.avatar_url || '',
                color_hex: profile.color_hex || '#00FF88',
                theme: profile.theme as any || 'cyber',
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

                if (hRes.data) setHomeSettings({ ...hRes.data, themeColor: hRes.data.themeColor || '#00FF88' });
                if (usersRes.data) setUsers(usersRes.data.map((u: any) => ({ ...u, full_name: u.full_name, color_hex: u.color_hex, theme: u.theme || 'cyber' })));
                if (tasksRes.data) setTasks(tasksRes.data);
                if (compRes.data) setCompletions(compRes.data);
                if (remRes.data) setReminders(remRes.data);
                if (shopRes.data) setShoppingItems(shopRes.data);
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

        shoppingConcepts,
        addShoppingConcept: async (name) => { setShoppingConcepts(p => [...p, { id: Math.random().toString(), name }]); },
        deleteShoppingConcept: async (id) => { setShoppingConcepts(p => p.filter(x => x.id !== id)); },

        generateInviteId: async () => {
            if (!homeSettings) return '';
            const id = Math.random().toString(36).substr(2, 9);
            await supabase.from('households').update({ householdInvitationId: id }).eq('id', homeSettings.id);
            setHomeSettings({ ...homeSettings, householdInvitationId: id });
            return id;
        },
        joinHouseholdLink: async (inviteId) => {
            const { data: household } = await supabase.from('households').select('id').eq('householdInvitationId', inviteId).single();
            if (household && currentUser) {
                await supabase.from('profiles').update({ household_id: household.id }).eq('id', currentUser.id);
                fetchUserData(currentUser.id);
            }
        },
        logout: async () => {
            await supabase.auth.signOut();
            setCurrentUser(null);
            setHomeSettings(null);
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
