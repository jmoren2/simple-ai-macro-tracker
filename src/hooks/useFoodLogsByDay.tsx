import { FoodLog } from "@/types/db/FoodLog";
import { apiFetch } from "@/utils/api";
import { useEffect, useState } from "react";

export function useFoodLogsByDay(apiUrl: string) {
    const [logsByDate, setLogsByDate] = useState<Record<string, FoodLog[]>>({});
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchLogs = async (cursor?: string) => {
        setLoading(true);
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        params.set("limit", "7"); // 7 days at a time

        const res = await apiFetch(`${apiUrl}/food/logsByDay?${params}`);
        const json = (await res.json()) as {
            logsByDate: Record<string, FoodLog[]>;
            nextCursor: string | null;
        };

        setLogsByDate((prev) => ({ ...prev, ...json.logsByDate }));
        setNextCursor(json.nextCursor);
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
    }, [apiUrl]);

    return { logsByDate, loading, fetchMore: () => nextCursor && fetchLogs(nextCursor), hasMore: !!nextCursor };
}
