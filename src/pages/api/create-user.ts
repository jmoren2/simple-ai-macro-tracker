import { User } from '@/types/db/User';
import bcrypt from 'bcrypt';
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db/db';
import { setJWT } from './login';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const { email: rawEmail, name, password } = req.body;

    if (!rawEmail || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    const email = rawEmail?.trim().toLowerCase();

    const passwordHash = await bcrypt.hash(password, 10);

    try {
        const stmt = db.prepare(`
      INSERT INTO users (email, name, password_hash)
      VALUES (?, ?, ?)
    `);
        const result = stmt.run(email, name ?? null, passwordHash).lastInsertRowid;
        if (!result) {
            return res.status(500).json({ error: 'Failed to create user' });
        }

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result) as User | undefined;
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        setJWT(req, res, user);

        return res.status(201).json({
            user: { id: result, user },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'Email already exists' });
        }

        console.error(err);
        return res.status(500).json({ error: 'Failed to create user' });
    }
}
