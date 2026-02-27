import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
    Task, TaskCompletion, User, HomeSettings, Reminder,
    ShoppingConcept, ShoppingItem, WeeklyMenu
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
    joinHousehold: (inviteId: string) => void;
}

const defaultUsers: User[] = [
    { id: 'u1', name: 'Miguel', avatar: 'bg-blue-500', color: '#3b82f6', theme: 'cyber' },
    { id: 'u2', name: 'Elena', avatar: 'bg-pink-500', color: '#ec4899', theme: 'cyber' },
];

const defaultHomeSettings: HomeSettings = {
    name: 'Mi Hogar',
    logo: 'Home', // lucide-react icon name as a fallback or string
    themeColor: '#a855f7' // purple
};

export const AppContext = createContext<AppState | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tokenName, setTokenName] = useState('Puntos');
    const [homeSettings, setHomeSettings] = useState<HomeSettings>(defaultHomeSettings);

    const [users, setUsers] = useState<User[]>(defaultUsers);
    const [currentUser, setCurrentUser] = useState<User | null>(defaultUsers[0]);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [completions, setCompletions] = useState<TaskCompletion[]>([]);

    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [shoppingConcepts, setShoppingConcepts] = useState<ShoppingConcept[]>([]);
    const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
    const [weeklyMenus, setWeeklyMenus] = useState<WeeklyMenu[]>([]);

    // Load state from local storage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('octogon-state');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.tokenName) setTokenName(parsed.tokenName);
                if (parsed.homeSettings) setHomeSettings(parsed.homeSettings);
                if (parsed.users) {
                    const migratedUsers = parsed.users.map((u: any) => ({
                        ...u,
                        theme: u.theme === 'default' ? 'cyber' : (u.theme || 'cyber')
                    }));
                    setUsers(migratedUsers);
                }
                if (parsed.tasks) setTasks(parsed.tasks);
                if (parsed.completions) setCompletions(parsed.completions);
                if (parsed.reminders) setReminders(parsed.reminders);
                if (parsed.shoppingConcepts) setShoppingConcepts(parsed.shoppingConcepts);
                if (parsed.shoppingItems) setShoppingItems(parsed.shoppingItems);
                if (parsed.weeklyMenus) setWeeklyMenus(parsed.weeklyMenus);
            }
        } catch (e) {
            console.error("Failed to load local state", e);
        }
    }, []);

    // Ensure currentUser is valid when users array changes
    useEffect(() => {
        const currentUserInUsers = users.find(u => u.id === currentUser?.id) || null;
        if (currentUser && !currentUserInUsers && users.length > 0) {
            setCurrentUser(users[0]);
        } else if (currentUser && currentUserInUsers && (currentUserInUsers.color !== currentUser.color || currentUserInUsers.theme !== currentUser.theme)) {
            setCurrentUser(currentUserInUsers);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [users]);

    // Save state to local storage on change
    useEffect(() => {
        localStorage.setItem('octogon-state', JSON.stringify({
            tokenName,
            homeSettings,
            users,
            tasks,
            completions,
            reminders,
            shoppingConcepts,
            shoppingItems,
            weeklyMenus
        }));
    }, [tokenName, homeSettings, users, tasks, completions, reminders, shoppingConcepts, shoppingItems, weeklyMenus, currentUser]);

    const value: AppState = {
        tokenName, setTokenName,
        homeSettings, setHomeSettings,
        users, setUsers,
        currentUser, setCurrentUser,

        tasks,
        addTask: (t) => setTasks((prev) => [...prev, t]),
        updateTask: (t) => setTasks((prev) => prev.map(x => x.id === t.id ? t : x)),
        deleteTask: (id) => setTasks((prev) => prev.filter(x => x.id !== id)),

        completions,
        addCompletion: (c) => setCompletions((prev) => [...prev, c]),
        removeCompletion: (id) => setCompletions((prev) => prev.filter(x => x.id !== id)),

        reminders,
        addReminder: (r) => setReminders((prev) => [...prev, r]),
        updateReminder: (r) => setReminders((prev) => prev.map(x => x.id === r.id ? r : x)),
        deleteReminder: (id) => setReminders((prev) => prev.filter(x => x.id !== id)),

        shoppingConcepts,
        addShoppingConcept: (sc) => setShoppingConcepts((prev) => [...prev, sc]),
        updateShoppingConcept: (sc) => setShoppingConcepts((prev) => prev.map(x => x.id === sc.id ? sc : x)),
        deleteShoppingConcept: (id) => setShoppingConcepts((prev) => prev.filter(x => x.id !== id)),

        shoppingItems,
        addShoppingItem: (si) => setShoppingItems((prev) => [...prev, si]),
        updateShoppingItem: (si) => setShoppingItems((prev) => prev.map(x => x.id === si.id ? si : x)),
        deleteShoppingItem: (id) => setShoppingItems((prev) => prev.filter(x => x.id !== id)),

        weeklyMenus,
        addWeeklyMenu: (m) => setWeeklyMenus((prev) => [...prev, m]),
        updateWeeklyMenu: (m) => setWeeklyMenus((prev) => prev.map(x => x.id === m.id ? m : x)),
        deleteWeeklyMenu: (id) => setWeeklyMenus((prev) => prev.filter(x => x.id !== id)),

        generateInviteId: () => {
            const id = crypto.randomUUID();
            setHomeSettings({ ...homeSettings, householdInvitationId: id });
            return id;
        },
        joinHousehold: (inviteId) => {
            // In a real app, this would fetch data from a backend by inviteId.
            // For this simulation, we'll just "mock" joining by updating the local settings.
            setHomeSettings({ ...homeSettings, householdInvitationId: inviteId });
            // We could also clear local data if it's a "fresh" start for the joining user.
        }
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppContext must be used within AppProvider");
    return context;
};
