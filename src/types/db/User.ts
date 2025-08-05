export type User = {
    id: number;
    email: string;
    name?: string;
    password_hash: string;
    created_at: string;
    calorie_goal?: number; // Optional, can be set later
};
