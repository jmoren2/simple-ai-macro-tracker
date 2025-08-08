import { FoodLog } from "@/types/db/FoodLog";
import Link from "next/link";
import { MdOutlineCancel } from "react-icons/md";
import MacroPieChart from "./MacroPieChart";

type FoodTrackerProps = {
    name: string;
    setName: (name: string) => void;
    calories: string;
    setCalories: (cal: string) => void;
    addItem: () => void;
    items: (FoodLog & { timestamp?: string })[];
    setItems: (items: (FoodLog & { timestamp?: string })[]) => void;
    alreadySavedToday: (FoodLog & { timestamp?: string })[];
    analyzeItems: () => void;
    loading: boolean;
    result: any;
    caloriesRemaining: () => number | null;
    suggestions: string[];
    setFilteredSuggestions: (s: string[]) => void;
    filteredSuggestions: string[];
    user?: { isPremium?: boolean };
    foodInputFocused: boolean;
    setFoodInputFocused: (v: boolean) => void;
};

export default function FoodTracker({
    name,
    setName,
    calories,
    setCalories,
    addItem,
    items,
    setItems,
    alreadySavedToday,
    analyzeItems,
    loading,
    result,
    caloriesRemaining,
    suggestions,
    setFilteredSuggestions,
    filteredSuggestions,
    user,
    foodInputFocused,
    setFoodInputFocused,
}: FoodTrackerProps) {
    return (
        <>
            {/* Food Input Row */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Food name"
                        className="w-full border px-4 py-2 rounded bg-black text-white rounded-xl"
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
                    {Boolean(user?.isPremium) &&
                        foodInputFocused &&
                        filteredSuggestions.length > 0 && (
                            <ul className="absolute z-10 left-0 right-0 mt-1 border border-gray-700 bg-[#1a1a1a] text-gray-300 rounded-lg shadow-lg overflow-hidden max-h-60 divide-y divide-gray-700">
                                {filteredSuggestions.map((sugg, idx) => (
                                    <li
                                        key={idx}
                                        className="px-4 py-2 hover:bg-[#2a2a2a] hover:text-white cursor-pointer transition-colors text-sm"
                                        onMouseDown={() => {
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
                    className="w-32 border px-4 py-2 rounded bg-black text-white rounded-xl"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                />

                {/* Add button */}
                <button
                    className="px-4 py-2 rounded text-white rounded-xl"
                    style={{ backgroundColor: "#f97316" }}
                    onClick={addItem}
                >
                    Add
                </button>
            </div>

            {/* Items list */}
            <ul className="mb-4">
                {items.map((item, idx) => {
                    const isAlreadySaved = alreadySavedToday.some(
                        (saved) =>
                            saved.name === item.name &&
                            saved.calories === item.calories &&
                            saved.timestamp === item.timestamp
                    );

                    return (
                        <li
                            key={idx}
                            className="flex justify-between items-center border-b border-gray-700 py-1 text-sm"
                        >
                            <span>{item.name}</span>
                            <span className="flex items-center gap-2">
                                {typeof item.calories === "number" && !isNaN(item.calories)
                                    ? `${item.calories} cal`
                                    : "unknown"}

                                {!isAlreadySaved && (
                                    <button
                                        hidden={result !== null}
                                        onClick={() => {
                                            setItems(items.filter((_, i) => i !== idx));
                                        }}
                                        className="text-red-400 hover:text-red-300 text-sm justify-center items-center"
                                        title="Remove item"
                                    >
                                        <MdOutlineCancel size={12} />
                                    </button>
                                )}
                            </span>
                        </li>
                    );
                })}
            </ul>

            {/* Analyze button */}
            <div className="flex justify-center">
                <button
                    className="w-1/4 min-w-[180px] py-2 rounded text-white disabled:opacity-50"
                    style={{ backgroundColor: "var(--color-green-600)" }}
                    onClick={analyzeItems}
                    disabled={items.length === 0 || loading || result !== null}
                >
                    {loading ? "Analyzing...🤖" : "Analyze Food with AI"}
                </button>
            </div>

            {/* Analysis results */}
            {result && (
                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">
                        Result
                        <Link
                            href="/logs"
                            className="ml-2 text-sm text-blue-400 hover:text-blue-300"
                        >
                            View Full Breakdown
                        </Link>
                    </h2>
                    <ul className="space-y-1">
                        <li>
                            🔥 Calories: <span className="font-bold">{result.total.calories}</span>
                        </li>
                        <li>
                            🍗 Protein:{" "}
                            <span className="font-bold">{result.total.protein}g</span>
                        </li>
                        <li>
                            🍞 Carbs:{" "}
                            <span className="font-bold">{result.total.carbs}g</span>
                        </li>
                        <li>
                            🥑 Fat: <span className="font-bold">{result.total.fat}g</span>
                        </li>
                    </ul>

                    <div className="mt-4 text-center text-base">
                        {(() => {
                            const remaining = caloriesRemaining();
                            if (remaining === null) return null;
                            return (
                                <>
                                    {remaining > 0 ? (
                                        <div>
                                            <p>
                                                ✅ You have <strong>{remaining} cal</strong> remaining.
                                            </p>
                                            <MacroPieChart
                                                data={{
                                                    protein: result.total.protein,
                                                    carbs: result.total.carbs,
                                                    fat: result.total.fat,
                                                }}
                                            />
                                        </div>
                                    ) : remaining < 0 ? (
                                        <p>
                                            ⚠️ Youve gone{" "}
                                            <strong>{Math.abs(remaining)} cal</strong> over your goal.
                                        </p>
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
    );
}
