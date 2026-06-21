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
    sort_order?: number;
}

export interface TaskCompletion {
    id: string;
    task_id: string;
    user_id: string;
    points_earned: number;
    completed_at: string;
}

export interface User {
    id: string;
    email?: string;
    full_name: string;
    avatar_url: string;
    color_hex: string;
    theme: AppTheme;
}

export interface Membership {
    id: string;
    user_id: string;
    household_id: string;
    role: 'owner' | 'member';
    joined_at: string;
}

export interface HomeSettings {
    id: string;
    name: string;
    logo?: string;
    theme_color?: string;
    themeColor?: string;
    token_name?: string;
    invitation_id?: string;
    householdInvitationId?: string;
}

export interface Reminder {
    id: string;
    household_id: string;
    title: string;
    due_date: string;
    assigned_to: string[];
    description?: string;
    is_completed?: boolean;
}

export interface ShoppingItem {
    id: string;
    household_id: string;
    name: string;
    quantity: number;
    is_purchased: boolean;
    created_at: string;
    created_by?: string | null;
}

export interface MealIngredient {
    name: string;
    quantity: number;
    addToShopping: boolean;
}

export interface MealBlock {
    id: string;
    title: string;
    description?: string;
    ingredients: MealIngredient[];
    day?: string;
    slot?: string;
}

export interface WeeklyMenu {
    id: string;
    name: string;
    isFavorite: boolean;
    mealSlots: string[];
    blocks: MealBlock[];
}

export interface ShoppingConcept {
    id: string;
    name: string;
    category?: string;
}

// Pending action stored in localStorage during signup
export interface PendingAction {
    type: 'create' | 'join';
    userName: string;
    householdName?: string; // for type='create'
    code?: string;          // for type='join'
}
