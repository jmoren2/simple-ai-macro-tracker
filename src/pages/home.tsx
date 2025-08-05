'use client';

import { User } from '@/types/db/User';
import jwt from 'jsonwebtoken';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { FaPencilAlt } from 'react-icons/fa';
import db from '../../db/db';
import MacroPieChart from '../components/MacroPieChart';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdevtoken';

type FoodItem = {
    name: string;
    calories: number | 'unknown';
};

type MacroBreakdown = {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
};

type Result = {
    total: MacroBreakdown;
    breakdown: {
        [itemName: string]: MacroBreakdown;
    };
};

type Props = {
    user: {
        email: string;
        name: string;
        calorie_goal: number;
    };
};

export default function Home({ user }: Props) {
    const [calorieGoal, setCalorieGoal] = useState(user.calorie_goal);
    const [goalSubmitted, setGoalSubmitted] = useState(calorieGoal > 0);
    const [updatingGoal, setUpdatingGoal] = useState(false);
    const [items, setItems] = useState<FoodItem[]>([]);
    const [name, setName] = useState('');
    const [calories, setCalories] = useState('');
    const [result, setResult] = useState<Result | null>(null);
    const [loading, setLoading] = useState(false);


    const saveGoal = async () => {
        const res = await fetch('/api/update-calorie-goal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ calorieGoal }),
        });

        const data = await res.json();
        if (!res.ok) {
            console.log(data.error || 'Failed to update goal');
        } else {
            console.log('Goal saved!');
        }

        setGoalSubmitted(true);
        setUpdatingGoal(false);
    };

    const addItem = () => {
        if (!name) return;

        const parsed = parseInt(calories, 10);
        const value: number | 'unknown' = isNaN(parsed) ? 'unknown' : parsed;

        setItems([...items, { name, calories: value }]);
        setName('');
        setCalories('');
    };

    const analyzeItems = async () => {
        setLoading(true);
        setResult(null);

        const res = await fetch('/api/analyze-calories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items }),
        });

        const data = await res.json();
        setResult(data);
        setLoading(false);
    };

    const caloriesRemaining = () => {
        if (!result?.total?.calories) return null;
        const remaining = calorieGoal - result.total.calories;
        return remaining;
    };

    return (
        <main className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-xl mx-auto bg-white shadow-xl rounded-xl p-6">
                <h1 className="text-2xl font-bold mb-4 text-center text-gray-900">🧠 Simple AI Macro Tracker</h1>
                <div className="text-center mb-6">
                    <p className="text-gray-700">Welcome, {user.name || user.email}!</p>
                    <Link href="/logout" className="text-blue-600 hover:underline">
                        Logout
                    </Link>
                </div>

                {!goalSubmitted ? (
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-center text-gray-800">Whats your calorie goal for the day?</p>
                        <input
                            type="number"
                            placeholder="e.g. 2200"
                            className="w-48 border px-4 py-2 rounded text-center text-gray-600"
                            value={calorieGoal}
                            onChange={(e) => setCalorieGoal(parseInt(e.target.value))}
                        />
                        <button
                            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                            onClick={() => saveGoal()}
                        >
                            Continue
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="mb-4 text-gray-900 text-center">
                            🎯 Daily Goal: <strong>{calorieGoal} cal</strong>
                            <button
                                onClick={() => setUpdatingGoal(true)}
                                className="ml-2 text-blue-600 hover:text-blue-800"
                                title="Edit Goal"
                            >
                                <FaPencilAlt className="inline mr-1" size={10} />
                            </button>
                        </p>

                        {updatingGoal && (
                            <div className="mb-4 flex gap-2 items-center justify-center">
                                <input
                                    type="number"
                                    className="border px-4 py-2 rounded text-center w-32 text-gray-600"
                                    value={calorieGoal}
                                    onChange={(e) => setCalorieGoal(parseInt(e.target.value))}
                                />
                                <button
                                    onClick={saveGoal}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Save
                                </button>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2 mb-4 text-gray-600">
                            <input
                                type="text"
                                placeholder="Food name"
                                className="flex-1 border px-4 py-2 rounded"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Calories"
                                className="w-32 border px-4 py-2 rounded"
                                value={calories}
                                onChange={(e) => setCalories(isNaN(parseInt(e.target.value, 10)) ? 'unknown' : e.target.value)}
                            />
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                onClick={addItem}
                            >
                                Add
                            </button>
                        </div>

                        <ul className="mb-4">
                            {items.map((item, idx) => (
                                <li key={idx} className="flex justify-between border-b py-1 text-sm text-gray-700">
                                    <span>{item.name}</span>
                                    <span>
                                        {typeof item.calories === 'number' && !isNaN(item.calories)
                                            ? `${item.calories} cal`
                                            : 'unknown'}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <button
                            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
                            onClick={analyzeItems}
                            disabled={items.length === 0 || loading}
                        >
                            {loading ? 'Analyzing...' : 'Analyze Items'}
                        </button>

                        {result && (
                            <div className="mt-6">
                                <h2 className="text-lg font-semibold mb-2 text-gray-900">Result</h2>
                                <pre className="bg-gray-800 text-green-100 text-sm p-4 rounded overflow-x-auto">
                                    {JSON.stringify(result, null, 2)}
                                </pre>



                                <div className="mt-4 text-center text-gray-900 text-base">
                                    {(() => {
                                        const remaining = caloriesRemaining();
                                        if (remaining === null) return null;
                                        return (
                                            <>
                                                {remaining > 0 ? (
                                                    <div>
                                                        <p>✅ You have <strong>{remaining} cal</strong> remaining.</p>
                                                        <MacroPieChart
                                                            data={{
                                                                protein: result.total.protein,
                                                                carbs: result.total.carbs,
                                                                fat: result.total.fat,
                                                            }}
                                                        />
                                                    </div>
                                                ) : remaining < 0 ? (
                                                    <p>⚠️ Youve gone <strong>{Math.abs(remaining)} cal</strong> over your goal.</p>
                                                ) : (
                                                    <p>🎉 Youve hit your calorie goal exactly!</p>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}



export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const cookieHeader = req.headers.cookie;
    const token = cookieHeader?.match(/token=([^;]+)/)?.[1];

    if (!token) {
        return { redirect: { destination: '/', permanent: false } };
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
        const user = db.prepare('SELECT name, email, calorie_goal FROM users WHERE email = ?').get(decoded.email) as User;
        console.log('user found:', user);


        if (!user) throw new Error('User not found');

        return { props: { user } };
    } catch {
        return { redirect: { destination: '/', permanent: false } };
    }
};
