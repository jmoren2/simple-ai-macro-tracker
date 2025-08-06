// pages/api/update-calorie-goal.ts
import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db/db';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdevtoken';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const { calorieGoal } = req.body;
    const token = req.cookies.token;

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
        const stmt = db.prepare(`UPDATE users SET calorie_goal = ? WHERE email = ?`);
        stmt.run(calorieGoal, decoded.email);

        return res.status(200).json({ success: true });
    } catch (err) {
        console.log(err);

        return res.status(401).json({ error: 'Invalid token' });
    }
}
