export type TaskFrequency = 'once' | 'multiple';
export type AppTheme = 'cyber' | 'light' | 'octogon';

export interface Task {
    id: string;
    name: string;
    frequency: TaskFrequency;
    points: number;
}

export interface TaskCompletion {
    id: string;
    taskId: string;
    userId: string;
    timestamp: string; // ISO string 
}

export interface User {
    id: string;
    name: string;
    avatar: string; // Tailwind color class or url
    color: string; // e.g. '#ec4899', tailwind hex or class to use for charts/UI
    theme?: AppTheme;
}

export interface HomeSettings {
    name: string;
    logo: string; // icon name or image url
    themeColor: string;
    householdInvitationId?: string; // ID for sharing/joining
}

export interface Reminder {
    id: string;
    title: string;
    description?: string;
    date: string; // ISO Date String
    startTime: string; // HH:mm format
    endTime?: string;
    location?: string;
    participants: string[]; // user IDs
    isCompleted?: boolean;
}

export interface ShoppingConcept {
    id: string;
    name: string;
}

export interface ShoppingItem {
    id: string;
    conceptId: string;
    name: string; // derived from concept or overridden
    addedBy: string; // userId
    addedAt: string; // ISO string
    boughtBy?: string | null; // userId if bought
    boughtAt?: string | null; // ISO string
}

export interface MealIngredient {
    id: string;
    conceptId?: string;
    name: string;
    quantity: number;
    unit?: string;
}

export interface MealBlock {
    id: string;
    title: string;
    description?: string;
    ingredients: MealIngredient[];
}

export interface MealSlot {
    id: string; // e.g., "desayuno"
    name: string; // e.g. "Desayuno"
}

export interface WeeklyMenu {
    id: string;
    name: string;
    isFavorite: boolean;
    slots: MealSlot[];
    blocks: {
        id: string;
        day: number; // 0=Lunes, 6=Domingo
        slotId: string;
        meal: MealBlock;
    }[];
}
