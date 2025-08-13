import { getUserFromRequest } from "@/lib/auth";
import { User } from "@/types/db/User";
import { WeightLog } from "@/types/db/WeightLog";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../../db/db";

function toDateKey(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function isYMD(s: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await getUserFromRequest(req, res) as User | null;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = user.id;

    if (req.method === "POST") {
        // Add today's weight (or a provided date)
        const { weight, date } = req.body as { weight?: number; date?: string };

        if (typeof weight !== "number" || !isFinite(weight) || weight <= 0) {
            return res.status(400).json({ error: "Invalid weight" });
        }

        const dateKey = date && isYMD(date) ? date : toDateKey();

        // Use UPSERT to avoid duplicate rows for a given (user_id, date)
        const stmt = db.prepare(`
            INSERT INTO weight_logs (user_id, date, weight)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id, date) DO UPDATE SET weight = weight
        `);
        stmt.run(userId, dateKey, weight);

        const row = db.prepare(`
            SELECT id, user_id, date, created_at, weight
            FROM weight_logs
            WHERE user_id = ? AND date = ?
    `).get(userId, dateKey) as WeightLog;

        return res.status(201).json({ data: row });
    }

    if (req.method === "GET") {
        // Return entries in a time range
        const range = String(req.query.range || "30d");
        let days: number | null = 30;
        if (range === "7d") days = 7;
        else if (range === "30d") days = 30;
        else if (range === "365d") days = 365;
        else if (range === "all") days = null;

        let rows: WeightLog[];
        if (days == null) {
            rows = db.prepare(`
            SELECT id, user_id, date, created_at, weight
            FROM weight_logs
            WHERE user_id = ?
            ORDER BY date ASC
      `).all(userId) as WeightLog[] || [];
        } else {
            // cutoff = today - (days - 1)
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - (days - 1));
            const cutoffKey = toDateKey(cutoff);

            rows = db.prepare(`
        SELECT id, user_id, date, created_at, weight
        FROM weight_logs
        WHERE user_id = ? AND date >= ?
        ORDER BY date ASC
      `).all(userId, cutoffKey) as WeightLog[] || [];
        }

        return res.status(200).json({ data: rows });
    }

    res.setHeader("Allow", "GET,POST");
    return res.status(405).json({ error: "Method Not Allowed" });
}
