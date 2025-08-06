import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db/db';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdevtoken';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const userId = decoded.id;
    const { items, result } = req.body;

    const date = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

    const insert = db.prepare(`
      INSERT INTO food_logs (user_id, name, calories, protein, fat, carbs, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      console.log(`Saving log for ${item} on ${date}`);

      const breakdown = result.breakdown[item.name];
      console.log(`Breakdown for ${item.name}:`, breakdown);

      insert.run(
        userId,
        item.name,
        typeof breakdown?.calories === 'number' ? breakdown.calories : null,
        breakdown?.protein ?? null,
        breakdown?.fat ?? null,
        breakdown?.carbs ?? null,
        date
      );
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('save-log error:', err);
    return res.status(500).json({ error: 'Failed to save log' });
  }
}
