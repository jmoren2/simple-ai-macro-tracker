import { FaPencilAlt } from 'react-icons/fa';

type DailyGoalProps = {
    goalSubmitted: boolean;
    calorieGoal: number;
    setCalorieGoal: (goal: number) => void;
    saveGoal: () => void;
    setUpdatingGoal: (updating: boolean) => void;
    dailyTotals: {
        calories?: number | null;
        protein?: number | null;
        carbs?: number | null;
        fat?: number | null;
    };
    updatingGoal?: boolean;
};

export default function DailyGoal({
    goalSubmitted,
    calorieGoal,
    setCalorieGoal,
    saveGoal,
    setUpdatingGoal,
    dailyTotals,
    updatingGoal = false,
}: DailyGoalProps) {
    if (!goalSubmitted) {
        return (
            <div className="flex flex-col items-center gap-4">
                <p>What is your daily calorie goal?</p>
                <input
                    type="number"
                    placeholder="e.g. 2200"
                    className="w-48 border px-4 py-2 rounded text-center bg-black text-white"
                    value={calorieGoal || ''}
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
        );
    }

    return (
        <>
            <div className="mb-6 text-center">
                <div className="text-sm">
                    <span>Calories eaten today: </span>
                    <strong
                        className={
                            dailyTotals.calories && dailyTotals.calories < calorieGoal
                                ? 'text-green-600'
                                : 'text-red-400'
                        }
                    >
                        {dailyTotals.calories ?? 0} cal
                    </strong>
                </div>

                <div className="text-xs">
                    <span>
                        Protein:{' '}
                        <strong className="text-sm">{dailyTotals.protein?.toFixed(1) ?? 0}g</strong>
                    </span>{' '}
                    <span className="mx-2">|</span>
                    <span>
                        Carbs:{' '}
                        <strong className="text-sm">{dailyTotals.carbs?.toFixed(1) ?? 0}g</strong>
                    </span>{' '}
                    <span className="mx-2">|</span>
                    <span>
                        Fat:{' '}
                        <strong className="text-sm">{dailyTotals.fat?.toFixed(1) ?? 0}g</strong>
                    </span>
                </div>

                <div className="text-sm">
                    <span>Calories remaining: </span>
                    <strong>
                        {dailyTotals.calories ? calorieGoal - dailyTotals.calories : calorieGoal}{' '}
                        cal
                    </strong>
                </div>
                <div className="flex items-center justify-center space-x-2 text-xs">
                    <span>🎯 Daily Goal:</span>
                    <strong>{calorieGoal} cal</strong>
                    <button
                        onClick={() => setUpdatingGoal(true)}
                        className="text-orange-400 hover:text-orange-300 cursor-pointer"
                    >
                        <FaPencilAlt size={10} />
                    </button>
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
        </>
    );
}
