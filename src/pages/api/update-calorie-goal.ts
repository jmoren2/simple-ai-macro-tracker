// pages/api/update-calorie-goal.ts
import { getUserFromRequest } from '@/lib/auth';
import { User } from '@/types/db/User';
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = await getUserFromRequest(req, res) as User | null;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { calorieGoal } = req.body;

    try {
        const stmt = db.prepare(`UPDATE users SET calorie_goal = ? WHERE id = ?`);
        stmt.run(calorieGoal, user.id);

        return res.status(200).json({ success: true });
    } catch (err) {
        console.log(err);

        return res.status(401).json({ error: 'Invalid token' });
    }
}
