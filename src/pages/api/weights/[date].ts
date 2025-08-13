import { getUserFromRequest } from "@/lib/auth";
import { User } from "@/types/db/User";
import { WeightLog } from "@/types/db/WeightLog";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../../db/db";

type Row = {
    id: number;
    user_id: number;
    date: string;
    created_at: string;
    weight: number;
};

function isYMD(s: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await getUserFromRequest(req, res) as User | null;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = user.id;

    const { date } = req.query as { date: string };
    if (!isYMD(date)) return res.status(400).json({ error: "Invalid date (YYYY-MM-DD)" });

    if (req.method === "GET") {
        const weights = db
            .prepare('SELECT date, weight FROM weight_logs WHERE user_id = ? AND date >= ? ORDER BY date ASC')
            .all(user.id, date) as WeightLog[] || [];

        if (!weights) return res.status(404).json({ error: "Not found" });
        return res.status(200).json({ data: weights });
    }

    if (req.method === "PUT") {
        const { weight } = req.body as { weight?: number };
        if (typeof weight !== "number" || !isFinite(weight) || weight <= 0) {
            return res.status(400).json({ error: "Invalid weight" });
        }

        const info = db.prepare(`
      UPDATE weight_logs
      SET weight = ?
      WHERE user_id = ? AND date = ?
    `).run(weight, userId, date);

        if (info.changes === 0) {
            db.prepare(`
        INSERT INTO weight_logs (user_id, date, weight)
        VALUES (?, ?, ?)
      `).run(userId, date, weight);
        }

        const row = db.prepare(`
      SELECT id, user_id, date, created_at, weight
      FROM weight_logs
      WHERE user_id = ? AND date = ?
    `).all(userId, date) as WeightLog[] || [];

        return res.status(200).json({ data: row });
    }

    res.setHeader("Allow", "GET,PUT");
    return res.status(405).json({ error: "Method Not Allowed" });
}
