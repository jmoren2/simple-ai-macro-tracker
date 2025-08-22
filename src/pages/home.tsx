'use client';

import DailyGoal from '@/components/DailyGoal';
import FoodTracker from '@/components/FoodTracker';
import Navbar from '@/components/Navbar';
import ThemedTabs from '@/components/ThemedTabs';
import WeightTracker from '@/components/WeightTracker';
import { FoodLog } from '@/types/db/FoodLog';
import { User } from '@/types/db/User';
import { WeightLog } from '@/types/db/WeightLog';
import { apiFetch } from '@/utils/api';
import { clearLocalStorageItems, formatPSTDate, getPSTDateString, upperCaseFirstLetter } from '@/utils/utils';
import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';

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
    weights: WeightLog[];
    apiUrl: string;
};

function getItemKey(item: FoodItem & { timestamp?: string }) {
    return `${item.name}|${item.calories}|${item.timestamp}`;
}

export default function Home({ user, dailyTotals, weights, apiUrl }: Props) {
    const [calorieGoal, setCalorieGoal] = useState(user?.calorie_goal || 0);
    const [goalSubmitted, setGoalSubmitted] = useState(calorieGoal > 0);
    const [updatingGoal, setUpdatingGoal] = useState(false);
    const [items, setItems] = useState<(FoodLog & { timestamp?: string })[]>([]);
    const [name, setName] = useState('');
    const [calories, setCalories] = useState('');
    const [result, setResult] = useState<Result | null>(null);
    const [loading, setLoading] = useState(false);
    const [alreadySavedToday, setAlreadySavedToday] = useState<(FoodLog & { timestamp?: string })[]>([]);
    const localStorageDateKey = `macro-tracker-saved-date-${user?.email}`;
    const localStorageItemsKey = `macro-tracker-items-${user?.email}`;
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [foodInputFocused, setFoodInputFocused] = useState(false);

    useEffect(() => {
        const fetchFoodNames = async () => {
            const res = await apiFetch(`${apiUrl}/food/names`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            setSuggestions(data.names || []);
        };

        fetchFoodNames();
    }, [apiUrl]);

    useEffect(() => {
        const today = getPSTDateString(new Date());
        const lastSavedDate = localStorage.getItem(localStorageDateKey);
        const lastSavedItems = localStorage.getItem(localStorageItemsKey);

        const hydrateFromDB = async () => {
            const res = await apiFetch(`${apiUrl}/food/logs?date=${today}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json() as { logs: FoodLog[] };

            if (data?.logs?.length > 0) {
                const logsWithTimestamps = data.logs.map((item) => ({
                    ...item,
                    timestamp: item.created_at ?? formatPSTDate(), // fallback if DB didn’t return one
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
    }, [localStorageDateKey, localStorageItemsKey, user?.email, apiUrl]);

    useEffect(() => {
        localStorage.setItem(localStorageItemsKey, JSON.stringify(items));
    }, [items, localStorageItemsKey]);

    const saveGoal = async () => {
        const res = await apiFetch(`${apiUrl}/user/me`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ calorie_goal: calorieGoal }),
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
        } as FoodLog & { timestamp?: string };
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
        const res = await apiFetch(`${apiUrl}/analyze/calories`, {
            method: 'POST',
            body: JSON.stringify({ items }),
        });

        const data = await res.json();
        setResult(data);
        setLoading(false);

        // 4. Only send new items to DB
        if (newItems.length > 0) {
            await apiFetch(`${apiUrl}/food/logs`, {
                method: 'POST',
                body: JSON.stringify({ items: newItems, result: data }),
            });

            // 5. Update local saved items
            const updatedSaved = [...savedItems, ...newItems];
            localStorage.setItem(localStorageItemsKey, JSON.stringify(updatedSaved));
        }
        clearLocalStorageItems(user.email);
    };

    const caloriesRemaining = () => {
        if (!result?.total?.calories) return null;
        return calorieGoal - result.total.calories;
    };

    const addDailyWeight = async (weight: number, date?: string) => {
        const res = await fetch(`/api/weights`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ weight, date }),
        });
        if (!res.ok) throw new Error("Failed to add weight");
        return;
    }

    const updateDailyWeight = async (date: string, weight: number) => {
        const res = await fetch(`/api/weights/${date}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ weight }),
        });
        if (!res.ok) throw new Error("Failed to update weight");
        return;
    }

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
            <Navbar />
            <div className="max-w-2xl mx-auto p-6 rounded-xl shadow-xl mt-6" style={{ backgroundColor: '#2c2c2c' }}>
                <h1 className="text-2xl font-bold mb-2 text-center">🧠 Simple AI Macro Tracker</h1>
                <div className="text-center mb-2">
                    <p>Welcome, {upperCaseFirstLetter(user?.name) || user?.email}!</p>
                </div>

                <DailyGoal
                    goalSubmitted={goalSubmitted}
                    calorieGoal={calorieGoal}
                    setCalorieGoal={setCalorieGoal}
                    saveGoal={saveGoal}
                    setUpdatingGoal={setUpdatingGoal}
                    dailyTotals={dailyTotals}
                    updatingGoal={updatingGoal}
                />

                {goalSubmitted && (
                    <ThemedTabs
                        tabs={[
                            {
                                title: "Food Tracker",
                                content: <FoodTracker
                                    name={name}
                                    setName={setName}
                                    calories={calories}
                                    setCalories={setCalories}
                                    addItem={addItem}
                                    items={items}
                                    setItems={setItems}
                                    alreadySavedToday={alreadySavedToday}
                                    analyzeItems={analyzeItems}
                                    loading={loading}
                                    result={result}
                                    caloriesRemaining={caloriesRemaining}
                                    suggestions={suggestions}
                                    setFilteredSuggestions={setFilteredSuggestions}
                                    filteredSuggestions={filteredSuggestions}
                                    user={user}
                                    foodInputFocused={foodInputFocused}
                                    setFoodInputFocused={setFoodInputFocused}
                                />
                            },
                            {
                                title: "Weight Tracker",
                                content: <WeightTracker
                                    data={weights}
                                    addDailyWeight={addDailyWeight}
                                    updateDailyWeight={updateDailyWeight}
                                    initialRange="7d"   // '7d' | '30d' | '365d' | 'all'
                                    unitLabel="lb"       // or "kg"
                                />
                            },
                            // {
                            //     title: "Water",
                            //     content: <WaterTracker />
                            // },
                            // {
                            //     title: "Steps and Activity",
                            //     content: <ActivityTracker />
                            // }
                        ]}
                    />


                )}

            </div>
        </div>
    );
}

function toDateKey(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const apiUrl = process.env.SHTAI_API_URL;
    const meRes = await apiFetch(`${apiUrl}/user/me`, {
        headers: {
            cookie: req.headers.cookie || '',
        },
    });
    if (meRes.status !== 200) {
        return { redirect: { destination: '/', permanent: false } };
    }

    try {
        const user = await meRes.json() as User;
        if (!user) {
            console.error('User not found');
            return { redirect: { destination: '/', permanent: false } };
        }

        // Get today's date in PST (America/Los_Angeles)
        const today = getPSTDateString(new Date());
        const url = process.env.SHTAI_API_URL!;
        const dailyTotals = await (await apiFetch(`${url}/food/dailyTotals?date=${today}`, {
            method: 'GET',
            headers: { cookie: req.headers.cookie ?? '' }
        })).json() as { dailyTotals: { calories: number | null, protein: number | null, carbs: number | null, fat: number | null } };

        const weights = await (await apiFetch(`${url}/weight/logs?range=7d`, {
            method: 'GET',
            headers: { cookie: req.headers.cookie ?? '' }
        })).json() as { data: WeightLog[] };

        return { props: { user, dailyTotals: dailyTotals.dailyTotals, weights: weights.data, apiUrl: process.env.SHTAI_API_URL, } };
    } catch (error) {
        console.error('Failed to fetch user data:', error);
        return { redirect: { destination: '/', permanent: false } };
    }
};
