import { getUserFromRequest } from '@/lib/auth';
import { User } from '@/types/db/User';
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = await getUserFromRequest(req, res) as User | null;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { date } = req.query;

        if (!user || typeof date !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid date parameter' });
        }

        const logs = db
            .prepare('SELECT name, calories, protein, fat, carbs FROM food_logs WHERE user_id = ? AND date = ? ORDER BY created_at DESC')
            .all(user.id, date);

        return res.status(200).json({ logs });
    } catch (err) {
        console.error('Error verifying token or fetching logs:', err);
        return res.status(401).json({ error: 'Invalid token' });
    }
}
