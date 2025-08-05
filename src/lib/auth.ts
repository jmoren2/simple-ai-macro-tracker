// lib/auth.ts
import { getCookie } from 'cookies-next';
import jwt from 'jsonwebtoken';
import type { NextApiRequest, NextApiResponse } from 'next';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdevtoken';

export async function getUserFromRequest(req: NextApiRequest, res: NextApiResponse) {
    const token = await getCookie('token', { req, res });
    if (!token || typeof token !== 'string') return null;

    try {
        const user = jwt.verify(token, JWT_SECRET);
        return user;
    } catch (err) {
        return null;
    }
}
