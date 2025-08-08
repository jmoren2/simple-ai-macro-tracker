import { getUserFromRequest } from '@/lib/auth';
import { User } from '@/types/db/User';
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../db/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') return res.status(405).end('Method not allowed');

    const user = await getUserFromRequest(req, res) as User | null;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { id } = req.query;
        if (!id || Array.isArray(id)) {
            return res.status(400).json({ error: 'Invalid or missing log id' });
        }

        const deleteLog = db.prepare(`
            DELETE FROM food_logs
            WHERE id = ? AND user_id = ?
        `);

        deleteLog.run(id, user.id);

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('delete-log error:', err);
        return res.status(500).json({ error: 'Failed to delete log' });
    }
}
