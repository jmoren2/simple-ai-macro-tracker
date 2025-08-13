export type WeightLog = {
    id?: number;
    user_id?: number;
    date: string; // Format: YYYY-MM-DD
    created_at?: string; // ISO 8601 format
    weight: number; // Weight in kilograms
};
