import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
    Task, TaskCompletion, User, HomeSettings, Reminder,
    ShoppingConcept, ShoppingItem, WeeklyMenu, Household
} from '../types';

interface AppState {
    tokenName: string;
    setTokenName: (name: string) => void;

    homeSettings: HomeSettings;
    setHomeSettings: (settings: HomeSettings) => void;

    users: User[];
    setUsers: (users: User[]) => void;
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;

    tasks: Task[];
    addTask: (task: Task) => void;
    updateTask: (task: Task) => void;
    deleteTask: (id: string) => void;

    completions: TaskCompletion[];
    addCompletion: (completion: TaskCompletion) => void;
    removeCompletion: (completionId: string) => void;

    reminders: Reminder[];
    addReminder: (r: Reminder) => void;
    updateReminder: (r: Reminder) => void;
    deleteReminder: (id: string) => void;

    shoppingConcepts: ShoppingConcept[];
    addShoppingConcept: (sc: ShoppingConcept) => void;
    deleteShoppingConcept: (id: string) => void;
    updateShoppingConcept: (sc: ShoppingConcept) => void;

    shoppingItems: ShoppingItem[];
    addShoppingItem: (si: ShoppingItem) => void;
    updateShoppingItem: (si: ShoppingItem) => void;
    deleteShoppingItem: (id: string) => void;

    weeklyMenus: WeeklyMenu[];
    addWeeklyMenu: (m: WeeklyMenu) => void;
    updateWeeklyMenu: (m: WeeklyMenu) => void;
    deleteWeeklyMenu: (id: string) => void;

    generateInviteId: () => string;
    joinHousehold: (inviteId: string, newUser?: User) => void;

    // Auth & Multi-Tenancy
    households: Household[];
    registerUserAndHousehold: (userName: string, homeName: string) => void;
    loginAsUser: (householdId: string, userId: string) => void;
    logout: () => void;
}

const STORAGE_KEY = 'octogon-multi-storage-state';

const defaultHousehold: Household = {
    id: 'h-default',
    settings: {
        name: 'Hogar Miguel',
        logo: 'Home',
        themeColor: '#00FF88'
    },
    users: [
        { id: 'u1', name: 'Miguel', avatar: 'bg-blue-500', color: '#3b82f6', theme: 'cyber' },
        { id: 'u2', name: 'Elena', avatar: 'bg-pink-500', color: '#ec4899', theme: 'cyber' },
    ],
    tasks: [],
    completions: [],
    reminders: [],
    shoppingConcepts: [],
    shoppingItems: [],
    weeklyMenus: [],
    tokenName: 'Puntos'
};

export const AppContext = createContext<AppState | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [households, setHouseholds] = useState<Household[]>([]);
    const [currentHouseholdId, setCurrentHouseholdId] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Initial load from storage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setHouseholds(parsed.households || []);
                setCurrentHouseholdId(parsed.currentHouseholdId || null);
                setCurrentUserId(parsed.currentUserId || null);
            } catch (e) { console.error(e); }
        } else {
            // Seed default on first ever visit
            setHouseholds([defaultHousehold]);
            setCurrentHouseholdId(defaultHousehold.id);
            setCurrentUserId(defaultHousehold.users[0].id);
        }
    }, []);

    // Selection shortcuts
    const currentHousehold = households.find(h => h.id === currentHouseholdId) || null;
    const currentUser = currentHousehold?.users.find(u => u.id === currentUserId) || null;

    // Helper for updating nested state in households
    const updateCurrentHousehold = (updater: (h: Household) => Household) => {
        if (!currentHouseholdId) return;
        setHouseholds(prev => prev.map(h => h.id === currentHouseholdId ? updater(h) : h));
    };

    // Auto-save
    useEffect(() => {
        if (households.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                households,
                currentHouseholdId,
                currentUserId
            }));
        }
    }, [households, currentHouseholdId, currentUserId]);

    const value: AppState = {
        households,
        currentUser,
        homeSettings: currentHousehold?.settings || defaultHousehold.settings,
        users: currentHousehold?.users || [],
        tokenName: currentHousehold?.tokenName || 'Puntos',

        setTokenName: (name) => updateCurrentHousehold(h => ({ ...h, tokenName: name })),
        setHomeSettings: (settings) => updateCurrentHousehold(h => ({ ...h, settings })),
        setUsers: (users) => updateCurrentHousehold(h => ({ ...h, users })),
        setCurrentUser: (u) => { if (u) setCurrentUserId(u.id); else setCurrentUserId(null); },

        tasks: currentHousehold?.tasks || [],
        addTask: (t) => updateCurrentHousehold(h => ({ ...h, tasks: [...h.tasks, t] })),
        updateTask: (t) => updateCurrentHousehold(h => ({ ...h, tasks: h.tasks.map(x => x.id === t.id ? t : x) })),
        deleteTask: (id) => updateCurrentHousehold(h => ({ ...h, tasks: h.tasks.filter(x => x.id !== id) })),

        completions: currentHousehold?.completions || [],
        addCompletion: (c) => updateCurrentHousehold(h => ({ ...h, completions: [...h.completions, c] })),
        removeCompletion: (id) => updateCurrentHousehold(h => ({ ...h, completions: h.completions.filter(x => x.id !== id) })),

        reminders: currentHousehold?.reminders || [],
        addReminder: (r) => updateCurrentHousehold(h => ({ ...h, reminders: [...h.reminders, r] })),
        updateReminder: (r) => updateCurrentHousehold(h => ({ ...h, reminders: h.reminders.map(x => x.id === r.id ? r : x) })),
        deleteReminder: (id) => updateCurrentHousehold(h => ({ ...h, reminders: h.reminders.filter(x => x.id !== id) })),

        shoppingConcepts: currentHousehold?.shoppingConcepts || [],
        addShoppingConcept: (sc) => updateCurrentHousehold(h => ({ ...h, shoppingConcepts: [...h.shoppingConcepts, sc] })),
        updateShoppingConcept: (sc) => updateCurrentHousehold(h => ({ ...h, shoppingConcepts: h.shoppingConcepts.map(x => x.id === sc.id ? sc : x) })),
        deleteShoppingConcept: (id) => updateCurrentHousehold(h => ({ ...h, shoppingConcepts: h.shoppingConcepts.filter(x => x.id !== id) })),

        shoppingItems: currentHousehold?.shoppingItems || [],
        addShoppingItem: (si) => updateCurrentHousehold(h => ({ ...h, shoppingItems: [...h.shoppingItems, si] })),
        updateShoppingItem: (si) => updateCurrentHousehold(h => ({ ...h, shoppingItems: h.shoppingItems.map(x => x.id === si.id ? si : x) })),
        deleteShoppingItem: (id) => updateCurrentHousehold(h => ({ ...h, shoppingItems: h.shoppingItems.filter(x => x.id !== id) })),

        weeklyMenus: currentHousehold?.weeklyMenus || [],
        addWeeklyMenu: (m) => updateCurrentHousehold(h => ({ ...h, weeklyMenus: [...h.weeklyMenus, m] })),
        updateWeeklyMenu: (m) => updateCurrentHousehold(h => ({ ...h, weeklyMenus: h.weeklyMenus.map(x => x.id === m.id ? m : x) })),
        deleteWeeklyMenu: (id) => updateCurrentHousehold(h => ({ ...h, weeklyMenus: h.weeklyMenus.filter(x => x.id !== id) })),

        generateInviteId: () => {
            const id = Math.random().toString(36).substr(2, 9);
            updateCurrentHousehold(h => ({ ...h, settings: { ...h.settings, householdInvitationId: id } }));
            return id;
        },
        joinHousehold: (inviteId, newUser) => {
            const hIdx = households.findIndex(h => h.settings.householdInvitationId === inviteId);
            if (hIdx === -1) { alert("Invito inválido o no encontrado"); return; }

            const household = households[hIdx];
            if (!newUser) return;

            setHouseholds(prev => prev.map((h, i) => i === hIdx ? { ...h, users: [...h.users, newUser] } : h));
            setCurrentHouseholdId(household.id);
            setCurrentUserId(newUser.id);
        },

        registerUserAndHousehold: (userName, homeName) => {
            const uId = crypto.randomUUID();
            const hId = crypto.randomUUID();
            const newUser: User = { id: uId, name: userName, avatar: 'bg-primary', color: '#00FF88', theme: 'cyber' };
            const newHousehold: Household = {
                id: hId,
                settings: { name: homeName, logo: 'Home', themeColor: '#00FF88' },
                users: [newUser],
                tasks: [],
                completions: [],
                reminders: [],
                shoppingConcepts: [],
                shoppingItems: [],
                weeklyMenus: [],
                tokenName: 'Puntos'
            };
            setHouseholds(prev => [...prev, newHousehold]);
            setCurrentHouseholdId(hId);
            setCurrentUserId(uId);
        },
        loginAsUser: (hId, uId) => {
            setCurrentHouseholdId(hId);
            setCurrentUserId(uId);
        },
        logout: () => {
            setCurrentHouseholdId(null);
            setCurrentUserId(null);
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
