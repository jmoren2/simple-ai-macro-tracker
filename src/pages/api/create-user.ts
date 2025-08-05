import bcrypt from 'bcrypt';
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const { email, name, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
        const stmt = db.prepare(`
      INSERT INTO users (email, name, password_hash)
      VALUES (?, ?, ?)
    `);
        const result = stmt.run(email, name ?? null, passwordHash);

        return res.status(201).json({
            user: { id: result.lastInsertRowid, email, name },
        });
    } catch (err: any) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'Email already exists' });
        }

        console.error(err);
        return res.status(500).json({ error: 'Failed to create user' });
    }
}
