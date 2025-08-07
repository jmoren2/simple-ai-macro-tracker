import { getUserFromRequest } from '@/lib/auth';
import { User } from '@/types/db/User';
import bcrypt from 'bcrypt';
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end('Method not allowed');

    const user = await getUserFromRequest(req, res) as User | null;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {

        const { name, email, password } = req.body;

        const updates: string[] = [];
        const values: (string | number)[] = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }

        if (email) {
            updates.push('email = ?');
            values.push(email);
        }

        if (password) {
            const hashed = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            values.push(hashed);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nothing to update' });
        }

        values.push(user.id); // where clause

        db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        refreshJWT(req, res, user.id);

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: 'Invalid token or update error' });
    }
}
