import { getUserFromRequest } from '@/lib/auth';
import { User } from '@/types/db/User';
import { getPSTDateString } from '@/utils/utils';
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const user = await getUserFromRequest(req, res) as User | null;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { items, result } = req.body;

    const date = getPSTDateString(new Date());

    const insert = db.prepare(`
      INSERT INTO food_logs (user_id, name, calories, protein, fat, carbs, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      console.log(`Saving log for ${item} on ${date}`);

      const breakdown = result.breakdown[item.name];
      console.log(`Breakdown for ${item.name}:`, breakdown);

      insert.run(
        user.id,
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
    console.error('create-log error:', err);
    return res.status(500).json({ error: 'Failed to create log' });
  }
}
