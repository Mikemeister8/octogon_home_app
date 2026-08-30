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
    unit: string;
    is_purchased: boolean;
    created_at: string;
    created_by?: string | null;
}

// Fixed set of units — a plain string column server-side, but a closed
// dropdown client-side so "same ingredient, same unit" aggregation (menu ->
// shopping list) can match on exact unit strings instead of free text like
// "gramos" vs "gr" vs "g" never matching each other.
export const SHOPPING_UNITS = ['ud', 'paquete', 'lata', 'g', 'kg', 'ml', 'l'] as const;
export type ShoppingUnit = typeof SHOPPING_UNITS[number];

export interface MealIngredient {
    id?: string;
    name: string;
    quantity: number;
    // A fixed unit (SHOPPING_UNITS) or a food's own custom sub-unit (e.g.
    // "lonchas") defined on its ShoppingConcept.pack_unit — free text so
    // packaging conversion isn't limited to the closed unit set.
    unit: string;
}

export interface MealBlock {
    id: string;
    menu_id?: string;
    day: string;
    slot: string;
    title: string;
    description?: string;
    ingredients: MealIngredient[];
}

// A named, reusable weekly menu shared by the whole household. Exactly one
// per household can be 'active' (the one currently in use) — the rest are
// 'saved' history that can be reactivated later.
export interface Menu {
    id: string;
    household_id: string;
    name: string;
    status: 'active' | 'saved';
    blocks: MealBlock[];
}

export interface Recipe {
    id: string;
    household_id: string;
    title: string;
    description?: string;
    ingredients: MealIngredient[];
}

export interface ShoppingConcept {
    id: string;
    name: string;
    category?: string;
    // Packaging conversion: 1 pack_unit "package" contains pack_size of the
    // concept's sub-unit (e.g. pack_size=6, pack_unit="lonchas" for jamón).
    // When exporting a menu, sub-unit quantities are summed then converted
    // to whole packages (rounded up). Null on either = no conversion.
    pack_size?: number | null;
    pack_unit?: string | null;
}

// Pending action stored in localStorage during signup
export interface PendingAction {
    type: 'create' | 'join';
    userName: string;
    householdName?: string; // for type='create'
    code?: string;          // for type='join'
}
