// /pages/api/food-names.ts
import { User } from '@/types/db/User';
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db/db';
import { getUserFromRequest } from '../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = await getUserFromRequest(req, res) as User | null;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const stmt = db.prepare(`SELECT DISTINCT name FROM food_logs WHERE user_id = ? ORDER BY name ASC`);
    const rows = stmt.all(user.id) as { name: string }[];
    const names = rows.map((row) => row.name);

    res.json({ names });
}
