import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../types';

export const useTasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = useCallback(async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const data = await window.api.invoke('tasks:get-all');
            setTasks(data);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();

        const handleTasksUpdated = () => {
            fetchTasks(true);
        };

        window.addEventListener('tasks-updated', handleTasksUpdated);
        return () => {
            window.removeEventListener('tasks-updated', handleTasksUpdated);
        };
    }, [fetchTasks]);

    const createTask = async (task: Partial<Task>) => {
        const newTask = await window.api.invoke('tasks:create', task);
        window.dispatchEvent(new Event('tasks-updated')); // Notify others
        setTasks(prev => [newTask, ...prev]);
        return newTask;
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        const updated = await window.api.invoke('tasks:update', { id, updates });
        window.dispatchEvent(new Event('tasks-updated')); // Notify others
        setTasks(prev => prev.map(t => t.id === id ? updated : t));
    };

    const completeTask = async (id: string) => {
        const updated = await window.api.invoke('tasks:complete', id);
        window.dispatchEvent(new Event('tasks-updated')); // Notify others
        setTasks(prev => prev.map(t => t.id === id ? updated : t));
    };

    const deleteTask = async (id: string) => {
        await window.api.invoke('tasks:delete', id);
        window.dispatchEvent(new Event('tasks-updated')); // Notify others
        setTasks(prev => prev.filter(t => t.id !== id));
    }

    const addSubtask = async (taskId: string, title: string) => {
        await window.api.invoke('subtasks:add', { taskId, title });
        window.dispatchEvent(new Event('tasks-updated'));
    };

    const toggleSubtask = async (id: string, isCompleted: boolean) => {
        await window.api.invoke('subtasks:toggle', { id, isCompleted });
        window.dispatchEvent(new Event('tasks-updated'));
    };

    const deleteSubtask = async (id: string) => {
        await window.api.invoke('subtasks:delete', id);
        window.dispatchEvent(new Event('tasks-updated'));
    };

    const reorderTasks = async (reorderedSubset: Task[]) => {
        // Optimistic update mechanism is complex with subsets. 
        // We will send the new order to the backend and force a refresh.
        // This ensures data consistency at the cost of a slight UI delay/refresh.
        const ids = reorderedSubset.map(t => t.id);
        await window.api.invoke('tasks:reorder', ids);
        // Dispatch 'tasks-updated' to trigger fetchTasks in this hook and others
        window.dispatchEvent(new Event('tasks-updated'));
    };

    return { tasks, loading, refresh: fetchTasks, createTask, updateTask, completeTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask, reorderTasks };
};
