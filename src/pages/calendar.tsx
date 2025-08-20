// pages/summary.tsx
import Navbar from '@/components/Navbar';
import { User } from '@/types/db/User';
import { apiFetch } from '@/utils/api';
import jwt from 'jsonwebtoken';
import { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import 'react-calendar/dist/Calendar.css';

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
    console.log(history);

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
                        tileContent={({ date, view }) => {
                            if (view !== 'month') return null;

                            const key = date.toISOString().split('T')[0];
                            const entry = history.find((e) => e.date === key);

                            if (entry) {
                                return (
                                    <div className="text-xs text-center">
                                        {entry.total} cal
                                    </div>
                                );
                            }

                            return null;
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
    const cookie = req.headers.cookie || '';
    const match = cookie.match(/SHTAIToken=([^;]+)/);
    if (!match) {
        console.log('No token found');
        return { redirect: { destination: '/', permanent: false } };
    }

    try {
        const token = match[1];
        const user = jwt.verify(token, process.env.JWT_SECRET!) as User;
        if (!user) {
            console.log('User not found');

            return { redirect: { destination: '/', permanent: false } };
        }
        const apiUrl = process.env.SHTAI_API_URL!;
        const data = await (await apiFetch(`${apiUrl}/food/calendar`, {
            method: 'GET',
            headers: { cookie: req.headers.cookie ?? '' }
        })).json() as { history: { date: string; total: number }[] };

        const result = data.history.map((entry) => ({
            date: entry.date,
            total: entry.total,
            goal: user.calorie_goal,
        }));

        return { props: { user, history: result } };
    } catch (error) {
        console.log('Error fetching calendar data:', error);
        return { redirect: { destination: '/', permanent: false } };
    }
};
