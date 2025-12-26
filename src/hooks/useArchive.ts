import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../types';

export const useArchive = (type: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    const [archiveDates, setArchiveDates] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDates = useCallback(async () => {
        setLoading(true);
        try {
            const data = await window.api.invoke('archive:get-all', { type });
            // data is string[] of dates
            // Sort descending
            setArchiveDates((data as string[]).sort().reverse());
        } catch (error) {
            console.error('Failed to fetch archive dates:', error);
        } finally {
            setLoading(false);
        }
    }, [type]);

    const getTasksForDate = async (date: string): Promise<Task[]> => {
        try {
            return await window.api.invoke('archive:get-all', { type, date });
        } catch (error) {
            console.error(`Failed to load archive for ${date}`, error);
            return [];
        }
    };

    const runArchival = async () => {
        setLoading(true);
        try {
            const count = await window.api.invoke('archive:run');
            if (count > 0) await fetchDates();
            return count;
        } catch (err) {
            console.error(err);
            return 0;
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDates();
    }, [fetchDates]);

    return { archiveDates, loading, refresh: fetchDates, getTasksForDate, runArchival };
};
