'use client';

import Navbar from '@/components/Navbar';
import { FoodLog } from '@/types/db/FoodLog';
import { User } from '@/types/db/User';
import { formatPSTDate, getPSTDateString, upperCaseFirstLetter } from '@/utils/utils';
import jwt from 'jsonwebtoken';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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
    user: User;
    dailyTotals: {
        calories: number | null;
        protein: number | null;
        carbs: number | null;
        fat: number | null;
    };
};

function getItemKey(item: FoodItem & { timestamp?: number }) {
    return `${item.name}|${item.calories}|${item.timestamp}`;
}

export default function Home({ user, dailyTotals }: Props) {
    const [calorieGoal, setCalorieGoal] = useState(user?.calorie_goal || 0);
    const [goalSubmitted, setGoalSubmitted] = useState(calorieGoal > 0);
    const [updatingGoal, setUpdatingGoal] = useState(false);
    const [items, setItems] = useState<FoodItem[]>([]);
    const [name, setName] = useState('');
    const [calories, setCalories] = useState('');
    const [result, setResult] = useState<Result | null>(null);
    const [loading, setLoading] = useState(false);
    const [alreadySavedToday, setAlreadySavedToday] = useState<FoodItem[]>([]);
    const localStorageDateKey = `macro-tracker-saved-date-${user?.email}`;
    const localStorageItemsKey = `macro-tracker-items-${user?.email}`;
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [foodInputFocused, setFoodInputFocused] = useState(false);

    useEffect(() => {
        const fetchFoodNames = async () => {
            const res = await fetch('/api/get-food-names');
            const data = await res.json();
            setSuggestions(data.names || []);
        };

        fetchFoodNames();
    }, []);

    useEffect(() => {
        const today = getPSTDateString(new Date());
        const lastSavedDate = localStorage.getItem(localStorageDateKey);
        const lastSavedItems = localStorage.getItem(localStorageItemsKey);

        const hydrateFromDB = async () => {
            const res = await fetch(`/api/get-food-logs?date=${today}`);
            const data = await res.json() as { logs: FoodLog[] };

            if (data?.logs?.length > 0) {
                const logsWithTimestamps = data.logs.map((item) => ({
                    ...item,
                    timestamp: item.created_at ?? Date.now(), // fallback if DB didn’t return one
                })) as FoodLog[];
                localStorage.setItem(localStorageDateKey, today);
                localStorage.setItem(localStorageItemsKey, JSON.stringify(logsWithTimestamps));
                setItems(logsWithTimestamps); // React state for visible input
                setAlreadySavedToday(logsWithTimestamps); // Track what’s been saved to DB
            }
        };

        if (lastSavedDate !== today) {
            // New day — clear saved items
            localStorage.removeItem(localStorageItemsKey);
            localStorage.setItem(localStorageDateKey, today);
            hydrateFromDB();
        } else if (!lastSavedItems || lastSavedItems.length === 0) {
            hydrateFromDB();
        } else {
            setItems(JSON.parse(lastSavedItems));
            setAlreadySavedToday(JSON.parse(lastSavedItems)); // Also hydrate saved state
        }
    }, [localStorageDateKey, localStorageItemsKey, user?.email]);

    useEffect(() => {
        localStorage.setItem(localStorageItemsKey, JSON.stringify(items));
    }, [items, localStorageItemsKey]);

    const saveGoal = async () => {
        const res = await fetch('/api/update-calorie-goal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ calorieGoal }),
        });

        const data = await res.json();
        if (!res.ok) console.log(data.error || 'Failed to update goal');
        else console.log('Goal saved!');

        setGoalSubmitted(true);
        setUpdatingGoal(false);
    };

    const addItem = () => {
        if (!name) return;

        const parsed = parseInt(calories, 10);
        const value: number | 'unknown' = isNaN(parsed) ? 'unknown' : parsed;

        const newItem = {
            name,
            calories: value,
            timestamp: formatPSTDate(), // ensures uniqueness for same name on same day, using current PST time
        };
        setItems([newItem, ...items]);

        setName('');
        setCalories('');
    };

    const analyzeItems = async () => {
        setLoading(true);
        setResult(null);

        // 1. Load saved items from localStorage
        const savedItems = alreadySavedToday;

        // 2. Filter out items that are already saved
        const newItems = items.filter(
            (item) => !savedItems.some(
                (saved) => getItemKey(saved) === getItemKey(item)
            )
        );

        // 3. Analyze all items regardless
        const res = await fetch('/api/analyze-calories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items }),
        });

        const data = await res.json();
        setResult(data);
        setLoading(false);

        // 4. Only send new items to DB
        if (newItems.length > 0) {
            await fetch('/api/save-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: newItems, result: data }),
            });

            // 5. Update local saved items
            const updatedSaved = [...savedItems, ...newItems];
            localStorage.setItem(localStorageItemsKey, JSON.stringify(updatedSaved));
        }
    };

    const caloriesRemaining = () => {
        if (!result?.total?.calories) return null;
        return calorieGoal - result.total.calories;
    };

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
            <Navbar />
            <div className="max-w-2xl mx-auto p-6 rounded-xl shadow-xl mt-6" style={{ backgroundColor: '#2c2c2c' }}>
                <h1 className="text-2xl font-bold mb-2 text-center">🧠 Simple AI Macro Tracker</h1>
                <div className="text-center mb-2">
                    <p>Welcome, {upperCaseFirstLetter(user?.name) || user?.email}!</p>
                </div>

                {!goalSubmitted ? (
                    <div className="flex flex-col items-center gap-4">
                        <p>What is your daily calorie goal?</p>
                        <input
                            type="number"
                            placeholder="e.g. 2200"
                            className="w-48 border px-4 py-2 rounded text-center bg-black text-white"
                            value={calorieGoal}
                            onChange={(e) => setCalorieGoal(parseInt(e.target.value))}
                        />
                        <button
                            className="px-6 py-2 rounded text-white"
                            style={{ backgroundColor: '#f97316' }}
                            onClick={saveGoal}
                        >
                            Continue
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <span className="text-md">🎯 Daily Goal:</span>
                                <strong className="text-md">{calorieGoal} cal</strong>
                                <button
                                    onClick={() => setUpdatingGoal(true)}
                                    className="text-orange-400 hover:text-orange-300"
                                >
                                    <FaPencilAlt size={14} />
                                </button>
                            </div>

                            <div className='text-sm'>
                                <span>Calories eaten today: </span>
                                <strong className={
                                    dailyTotals.calories && dailyTotals.calories < calorieGoal
                                        ? 'text-green-600'
                                        : 'text-red-400'
                                }>
                                    {dailyTotals.calories ?? 0} cal
                                </strong>
                            </div>

                            <div className="text-xs">
                                <span>Protein: <strong>{dailyTotals.protein ?? 0}g</strong></span>{' '}
                                <span className="mx-2">|</span>
                                <span>Carbs: <strong>{dailyTotals.carbs ?? 0}g</strong></span>{' '}
                                <span className="mx-2">|</span>
                                <span>Fat: <strong>{dailyTotals.fat ?? 0}g</strong></span>
                            </div>

                            <div className="text-sm">
                                <span>Calories remaining: </span>
                                <strong>{dailyTotals.calories ? calorieGoal - dailyTotals.calories : calorieGoal} cal</strong>
                            </div>
                        </div>

                        {updatingGoal && (
                            <div className="mb-4 flex gap-2 items-center justify-center">
                                <input
                                    type="number"
                                    className="border px-4 py-2 rounded text-center w-32 bg-black text-white"
                                    value={calorieGoal}
                                    onChange={(e) => setCalorieGoal(parseInt(e.target.value))}
                                />
                                <button
                                    onClick={saveGoal}
                                    className="px-4 py-2 rounded text-white"
                                    style={{ backgroundColor: '#f97316' }}
                                >
                                    Save
                                </button>
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2 mb-4">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Food name"
                                    className="w-full border px-4 py-2 rounded bg-black text-white"
                                    value={name}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setName(val);
                                        setFilteredSuggestions(
                                            suggestions
                                                .filter((s) => s.toLowerCase().includes(val.toLowerCase()))
                                                .slice(0, 5)
                                        );
                                    }}
                                    onFocus={() => setFoodInputFocused(true)}
                                    onBlur={() => setTimeout(() => setFoodInputFocused(false), 100)}
                                />
                                {Boolean(user?.isPremium) && foodInputFocused && filteredSuggestions.length > 0 && (
                                    <ul className="absolute z-10 left-0 right-0 mt-1 border border-gray-700 bg-[#1a1a1a] text-gray-300 rounded-lg shadow-lg overflow-hidden max-h-60 divide-y divide-gray-700">
                                        {filteredSuggestions.map((sugg, idx) => (
                                            <li
                                                key={idx}
                                                className="px-4 py-2 hover:bg-[#2a2a2a] hover:text-white cursor-pointer transition-colors text-sm"
                                                onClick={() => {
                                                    setName(sugg);
                                                    setFilteredSuggestions([]);
                                                }}
                                            >
                                                {sugg}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Calories input */}
                            <input
                                type="text"
                                placeholder="Calories"
                                className="w-32 border px-4 py-2 rounded bg-black text-white"
                                value={calories}
                                onChange={(e) => setCalories(e.target.value)}
                            />

                            {/* Add button */}
                            <button
                                className="px-4 py-2 rounded text-white"
                                style={{ backgroundColor: '#f97316' }}
                                onClick={addItem}
                            >
                                Add
                            </button>
                        </div>

                        <ul className="mb-4">
                            {items.map((item, idx) => (
                                <li key={idx} className="flex justify-between border-b border-gray-700 py-1 text-sm">
                                    <span>{item.name}</span>
                                    <span>
                                        {typeof item.calories === 'number' && !isNaN(item.calories)
                                            ? `${item.calories} cal`
                                            : 'unknown'}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <div className="flex justify-center">
                            <button
                                className="w-1/4 min-w-[180px] py-2 rounded text-white disabled:opacity-50"
                                style={{ backgroundColor: 'var(--color-green-600)' }}
                                onClick={analyzeItems}
                                disabled={items.length === 0 || loading}
                            >
                                {loading ? 'Analyzing...🤖' : 'Analyze Food with AI'}
                            </button>
                        </div>

                        {result && (
                            <div className="mt-6">
                                <h2 className="text-lg font-semibold mb-2">Result
                                    <Link href="/logs" className="ml-2 text-sm text-blue-400 hover:text-blue-300">
                                        View Full Breakdown
                                    </Link>

                                </h2>
                                {/* <h3 className="text-lg font-semibold text-green-600 mb-2">Daily Totals</h3> */}
                                <ul className="space-y-1">
                                    <li>🔥 Calories: <span className="font-bold">{result.total.calories}</span></li>
                                    <li>🍗 Protein: <span className="font-bold">{result.total.protein}g</span></li>
                                    <li>🍞 Carbs: <span className="font-bold">{result.total.carbs}g</span></li>
                                    <li>🥑 Fat: <span className="font-bold">{result.total.fat}g</span></li>
                                </ul>

                                <div className="mt-4 text-center text-base">
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
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const token = req.cookies?.macroAIToken;
    if (!token) {
        return { redirect: { destination: '/', permanent: false } };
    }

    try {
        const user = jwt.verify(token, JWT_SECRET) as User;
        if (!user) throw new Error('User not found');

        // Get today's date in PST (America/Los_Angeles)
        const dailyTotals = db
            .prepare('SELECT SUM(calories) as calories, SUM(protein) as protein, SUM(carbs) as carbs, SUM(fat) as fat FROM food_logs WHERE user_id = ? AND date = ?')
            .get(user.id, getPSTDateString(new Date())) as { calories: number | null, protein: number | null, carbs: number | null, fat: number | null };

        return { props: { user, dailyTotals } };
    } catch {
        return { redirect: { destination: '/', permanent: false } };
    }
};
