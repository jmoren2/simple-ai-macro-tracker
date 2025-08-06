import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db/db';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdevtoken';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        const userId = decoded.id;
        const { date } = req.query;

        if (!decoded || typeof date !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid date parameter' });
        }

        // const user = db.prepare('SELECT id FROM users WHERE email = ?').get(decoded.email);
        // if (!user) {
        //     return res.status(404).json({ error: 'User not found' });
        // }

        const logs = db
            .prepare('SELECT name, calories, protein, fat, carbs FROM food_logs WHERE user_id = ? AND created_at = ?')
            .all(userId, date);

        return res.status(200).json({ logs });
    } catch (err) {
        console.error('Error verifying token or fetching logs:', err);
        return res.status(401).json({ error: 'Invalid token' });
    }
}
