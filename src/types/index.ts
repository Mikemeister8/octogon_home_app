export type TaskFrequency = 'once' | 'multiple';
export type AppTheme = 'cyber' | 'light' | 'octogon';

export interface Task {
    id: string;
    household_id: string;
    title: string;
    description?: string;
    default_points: number;
    allow_multiple_per_day: boolean;
    is_active: boolean;
}

export interface TaskCompletion {
    id: string;
    task_id: string;
    user_id: string;
    points_earned: number;
    completed_at: string; // ISO string 
}

export interface User {
    id: string;
    email?: string;
    full_name: string;
    avatar_url: string;
    color_hex: string;
    theme: AppTheme;
    household_id?: string;
}

export interface HomeSettings {
    id: string;
    name: string;
    logo?: string;
    themeColor: string;
    householdInvitationId?: string;
    token_name: string;
}

export interface Reminder {
    id: string;
    household_id: string;
    title: string;
    due_date: string; // ISO Date String
    assigned_to: string[]; // user IDs
    description?: string;
    is_completed?: boolean;
}

export interface ShoppingItem {
    id: string;
    household_id: string;
    name: string;
    is_purchased: boolean;
    created_at: string; // ISO string
    created_by?: string | null; // userId
}

export interface MealIngredient {
    id: string;
    name: string;
    amount?: string;
    quantity: number;
    unit: string;
}

export interface MealBlock {
    id: string;
    title: string;
    description?: string;
    meal?: string;
    day?: string;
    slotId?: string;
    ingredients: MealIngredient[];
}

export interface WeeklyMenu {
    id: string;
    name: string;
    isFavorite: boolean;
    slots: any[];
    blocks: MealBlock[];
}

export interface ShoppingConcept {
    id: string;
    name: string;
    category?: string;
}
