import { useState, useEffect, useCallback } from 'react';

export interface DailyStats {
    date: string;
    tasks_completed: number;
    total_focus_time: number;
}

export const useAnalytics = () => {
    const [stats, setStats] = useState<DailyStats[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await window.api.invoke('analytics:get-daily');
            // Ensure data is sorted by date just in case
            setStats(data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, loading, refresh: fetchStats };
};
