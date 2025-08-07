export type FoodLog = {
    id: number;
    user_id: number;
    name: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    date: string; // Format: YYYY-MM-DD
    created_at: string; // ISO 8601 format
};
