import { useState, useEffect, useCallback } from 'react';

export interface RecurringTask {
    id: string;
    title: string;
    description?: string;
    priority: 'P1' | 'P2' | 'P3' | 'P4';
    created_at: string;
}

export const useRecurringTasks = () => {
    const [templates, setTemplates] = useState<RecurringTask[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTemplates = useCallback(async () => {
        try {
            const data = await window.api.invoke('recurring:get-all');
            setTemplates(data);
        } catch (error) {
            console.error('Failed to fetch recurring tasks:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const addTemplate = useCallback(async (task: Omit<RecurringTask, 'id' | 'created_at'>) => {
        try {
            const newTemplate = await window.api.invoke('recurring:create', task);
            setTemplates(prev => [newTemplate, ...prev]);
        } catch (error) {
            console.error('Failed to create recurring task:', error);
        }
    }, []);

    const deleteTemplate = useCallback(async (id: string) => {
        try {
            await window.api.invoke('recurring:delete', id);
            setTemplates(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error('Failed to delete recurring task:', error);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    return {
        templates,
        loading,
        addTemplate,
        deleteTemplate,
        refresh: fetchTemplates
    };
};
