// pages/api/me.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../../lib/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = getUserFromRequest(req, res);

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    return res.status(200).json({ user });
}
