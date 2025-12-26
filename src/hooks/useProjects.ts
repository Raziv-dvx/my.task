import { useState, useEffect, useCallback } from 'react';
import type { Project } from '../types';

export const useProjects = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const data = await window.api.invoke('projects:get-all');
            setProjects(data);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const createProject = async (project: Partial<Project>) => {
        const newProject = await window.api.invoke('projects:create', project);
        setProjects(prev => [newProject, ...prev]);
        return newProject;
    };

    const updateProject = async (id: string, updates: Partial<Project>) => {
        const updated = await window.api.invoke('projects:update', { id, updates });
        setProjects(prev => prev.map(p => p.id === id ? updated : p));
    };

    const deleteProject = async (id: string) => {
        await window.api.invoke('projects:delete', id);
        setProjects(prev => prev.filter(p => p.id !== id));
    };

    return { projects, loading, refresh: fetchProjects, createProject, updateProject, deleteProject };
};
