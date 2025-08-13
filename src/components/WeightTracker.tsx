import { WeightLog } from "@/types/db/WeightLog";
import { LineChart as LineChartIcon, Pencil, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

export type WeightTrackerProps = {
    data: WeightLog[];
    addDailyWeight: (weight: number, date?: string) => Promise<void> | void;
    updateDailyWeight: (date: string, weight: number) => Promise<void> | void;
    initialRange?: "7d" | "30d" | "365d" | "all";
    /** Optional: label to show next to the weight unit, e.g. "lb" or "kg" */
    unitLabel?: string;
    /** Optional: Tailwind className passthrough */
    className?: string;
};

const RANGE_TO_DAYS: Record<NonNullable<WeightTrackerProps["initialRange"]>, number> = {
    "7d": 7,
    "30d": 30,
    "365d": 365,
    all: Number.POSITIVE_INFINITY,
};

function toDateKey(d: string | Date) {
    const dt = typeof d === "string" ? new Date(d) : d;
    // Use local timezone for consistency with user's browser
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseLocalDate(ymd: string) {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d); // local midnight
}

function shortDateLabel(d: string) {
    const dt = parseLocalDate(d);
    return `${dt.getMonth() + 1}/${dt.getDate()}`; // M/D
}

export default function WeightTracker({
    data,
    addDailyWeight,
    updateDailyWeight,
    initialRange = "30d",
    unitLabel = "lb",
    className,
}: WeightTrackerProps) {
    const [localData, setLocalData] = useState<WeightLog[]>(() => data ?? []);
    useEffect(() => {
        setLocalData(data ?? []);
    }, [data]);

    const [range, setRange] = useState<NonNullable<WeightTrackerProps["initialRange"]>>(initialRange);
    const [showModal, setShowModal] = useState(false);
    const [inputValue, setInputValue] = useState<string>("");
    const [isEditingToday, setIsEditingToday] = useState(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const promptedRef = useRef(false);

    const todayKey = toDateKey(new Date());
    const todayEntry = localData.find((e) => e.date === todayKey);

    // First click handler -> if no today's entry, prompt once
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onFirstClick = () => {
            if (!promptedRef.current && !todayEntry) {
                promptedRef.current = true;
                setIsEditingToday(false);
                setInputValue("");
                setShowModal(true);
            } else {
                promptedRef.current = true;
            }
        };
        el.addEventListener("click", onFirstClick, { once: true });
        return () => el.removeEventListener("click", onFirstClick);
    }, [todayEntry]);

    // Range filtering
    const filtered = useMemo(() => {
        const days = RANGE_TO_DAYS[range];
        if (!Number.isFinite(days)) return localData;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (days - 1)); // include today as day 1
        const cutoffKey = toDateKey(cutoff);
        return localData.filter((e) => e.date >= cutoffKey);
    }, [localData, range]);

    // Derived stats
    const latestLabel = todayEntry ? `${todayEntry.weight} ${unitLabel}` : "--";

    async function handleSubmit() {
        const numeric = Number(inputValue);
        if (!Number.isFinite(numeric) || numeric <= 0) return;

        if (isEditingToday && todayEntry) {
            // Update existing
            try {
                await Promise.resolve(updateDailyWeight(todayEntry.date as string, numeric));
                setLocalData((prev) =>
                    prev.map((e) => (e.date === todayKey ? { ...e, weight: numeric, date: todayKey } : e))
                );
            } finally {
                setShowModal(false);
            }
        } else {
            // Add new for today
            try {
                await Promise.resolve(addDailyWeight(numeric, todayKey));
                setLocalData((prev) => {
                    const others = prev.filter((e) => toDateKey(e.date) !== todayKey);
                    return [...others, { date: todayKey, weight: numeric }];
                });
            } finally {
                setShowModal(false);
            }
        }
    }

    function openEditToday() {
        setIsEditingToday(true);
        setInputValue(todayEntry ? String(todayEntry.weight) : "");
        setShowModal(true);
    }

    function openAddToday() {
        setIsEditingToday(false);
        setInputValue("");
        setShowModal(true);
    }

    return (
        <div ref={containerRef} className={"w-full max-w-3xl mx-auto " + (className ?? "")}>
            {/* Header */}
            <div className="flex items-center justify-between bg-white/60 dark:bg-zinc-900/60 backdrop-blur rounded-2xl p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800"><LineChartIcon className="w-5 h-5" /></div>
                    <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500">Today&apos;s Weight</div>
                        <div className="text-2xl font-semibold">{latestLabel}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!todayEntry && (
                        <button onClick={openAddToday} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90">
                            <Plus className="w-4 h-4" /> Add today
                        </button>
                    )}
                    {todayEntry && (
                        <button onClick={openEditToday} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                            <Pencil className="w-4 h-4" /> Edit
                        </button>
                    )}
                </div>
            </div>

            {/* Range selector */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
                {(["7d", "30d", "365d", "all"] as const).map((key) => (
                    <button
                        key={key}
                        onClick={() => setRange(key)}
                        className={`px-3 py-1.5 rounded-xl text-sm border ${range === key
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent"
                            : "border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                            }`}
                    >
                        {key === "7d" && "Last 7 days"}
                        {key === "30d" && "Last 30 days"}
                        {key === "365d" && "Last year"}
                        {key === "all" && "All"}
                    </button>
                ))}
            </div>

            {/* Chart */}
            <div className="mt-4 h-64 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 p-3">
                {filtered.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={filtered} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={shortDateLabel} fontSize={12} tickMargin={8} />
                            <YAxis domain={["auto", "auto"]} fontSize={12} width={40} />
                            <Tooltip
                                labelClassName="text-black"
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                formatter={(value: any) => [`${value} ${unitLabel}`, "Weight"]}
                            />
                            <Line type="monotone" dataKey="weight" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-sm text-zinc-500">
                        No data in this range yet.
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 p-5">
                        <div className="text-lg font-semibold mb-1">{isEditingToday ? "Edit today's weight" : "Add today's weight"}</div>
                        <div className="text-xs text-zinc-500 mb-4">{new Date().toLocaleDateString()} ({unitLabel})</div>

                        <div className="space-y-2">
                            <label className="block text-sm">Weight</label>
                            <input
                                autoFocus
                                type="number"
                                step="0.1"
                                min={0}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={`e.g., 180`}
                                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-400"
                            />
                        </div>

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-3 py-2 text-sm rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-50"
                                disabled={!inputValue || Number(inputValue) <= 0}
                            >
                                {isEditingToday ? "Save" : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
