import { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProjectsPage = () => {
    const navigate = useNavigate();
    const { projects, loading, createProject, deleteProject } = useProjects();
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDeadline, setNewProjectDeadline] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        await createProject({
            name: newProjectName,
            description: '',
            deadline: newProjectDeadline || undefined,
            status: 'ACTIVE'
        });
        setNewProjectName('');
        setNewProjectDeadline('');
        setIsCreating(false);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Projects</h1>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                    <Plus size={16} /> New Project
                </button>
            </header>

            {isCreating && (
                <div className="mb-8 p-4 bg-zinc-900 border border-zinc-800 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <form onSubmit={handleCreate} className="flex flex-col gap-3">
                        <div className="flex gap-2">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Project Name..."
                                className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                            />
                            <input
                                type="date"
                                className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-zinc-400"
                                value={newProjectDeadline}
                                onChange={(e) => setNewProjectDeadline(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-zinc-400 hover:text-white text-sm"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-500">
                                Create Project
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                    {projects.map(project => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="group p-5 bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900 rounded-xl transition-all cursor-pointer"
                            onClick={() => navigate(`/projects/${project.id}`)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-blue-400 group-hover:bg-blue-400/10 transition-colors">
                                    <Folder size={20} />
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                                    className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Project"
                                >
                                    <MoreHorizontal size={16} />
                                </button>
                            </div>

                            <h3 className="text-lg font-semibold mb-1 text-zinc-200 group-hover:text-white">{project.name}</h3>
                            <p className="text-sm text-zinc-500 line-clamp-2">
                                {project.description || "No description"}
                            </p>

                            <div className="mt-4 pt-4 border-t border-zinc-800/50 flex items-center justify-between text-xs text-zinc-500">
                                <span>0 tasks</span>
                                <span>Active</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {projects.length === 0 && !isCreating && (
                <div className="text-center py-20 text-zinc-500">
                    <Folder size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No projects yet. Create one to get organized.</p>
                </div>
            )}
        </div>
    );
};
