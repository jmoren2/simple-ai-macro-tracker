// pages/summary.tsx
import Navbar from '@/components/Navbar';
import { User } from '@/types/db/User';
import jwt from 'jsonwebtoken';
import { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import 'react-calendar/dist/Calendar.css';
import db from '../../db/db';

const ReactCalendar = dynamic(() => import('react-calendar'), { ssr: false });

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdevtoken';

type Entry = {
    date: string;
    total: number;
    goal: number;
};

type Props = {
    user: User;
    history: Entry[];
};

export default function Calendar({ history }: Props) {
    const dateMap = useMemo(() => {
        const map: Record<string, 'under' | 'over' | 'exact'> = {};
        for (const { date, total, goal } of history) {
            if (total < goal) map[date] = 'under';
            else if (total > goal) map[date] = 'over';
            else map[date] = 'exact';
        }
        return map;
    }, [history]);

    return (
        <div className="min-h-screen p-6 bg-brand-bg text-brand-text">
            <Navbar />
            <div className="max-w-2xl mx-auto p-6 mt-6 bg-[#2c2c2c] rounded-xl shadow-md">
                <h1 className="text-xl font-bold mb-4 text-center">📅 Calorie Goal Calendar</h1>

                <div className="justify-center flex">
                    <ReactCalendar
                        tileClassName={({ date }) => {
                            const key = date.toISOString().split('T')[0];
                            if (key in dateMap) return `calorie-${dateMap[key]}`;
                            return '';
                        }}
                    />
                </div>

                <div className="text-sm mt-4 text-center text-gray-300">
                    <p><span className="dot under" /> Under goal</p>
                    <p><span className="dot exact" /> Goal met</p>
                    <p><span className="dot over" /> Over goal</p>
                </div>
            </div>
        </div>
    );
}


export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const token = req.cookies?.macroAIToken;
    if (!token) return { redirect: { destination: '/', permanent: false } };

    try {
        const user = jwt.verify(token, JWT_SECRET) as User;
        const history = db.prepare(`
            SELECT date, SUM(calories) as total
            FROM food_logs
            WHERE user_id = ?
            GROUP BY date
            ORDER BY date DESC
            LIMIT 60
    `).all(user.id) as { date: string; total: number }[];

        const result = history.map((entry) => ({
            date: entry.date,
            total: entry.total,
            goal: user.calorie_goal,
        }));

        return { props: { user, history: result } };
    } catch {
        return { redirect: { destination: '/', permanent: false } };
    }
};
