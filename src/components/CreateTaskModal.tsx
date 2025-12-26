import { useState } from 'react';
import { X, Clock, Flag, Folder, Briefcase } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useProjects } from '../hooks/useProjects';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from '../types';

interface CreateTaskModalProps {
    onClose: () => void;
    onTaskCreated?: () => void;
    defaultProjectId?: string;
}

export const CreateTaskModal = ({ onClose, onTaskCreated, defaultProjectId }: CreateTaskModalProps) => {
    const { createTask } = useTasks();
    const { projects } = useProjects(); // Fetch projects for selector

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Task['priority']>('P4');
    const [estimatedDuration, setEstimatedDuration] = useState('');
    const [category, setCategory] = useState<Task['category']>('inbox');
    const [projectId, setProjectId] = useState<string | undefined>(defaultProjectId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        await createTask({
            title,
            description,
            priority,
            status: 'TODO',
            estimated_duration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
            project_id: projectId || undefined,
            category
        });

        if (onTaskCreated) {
            onTaskCreated();
        }

        onClose();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
                    className="w-full max-w-lg bg-[#18181b] border border-zinc-800/50 rounded-2xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <form onSubmit={handleSubmit}>
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
                            <h2 className="text-lg font-semibold text-zinc-100">New Task</h2>
                            <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white transition-colors" aria-label="Close Modal">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            <div>
                                <input
                                    type="text"
                                    placeholder="What needs to be done?"
                                    className="w-full bg-transparent text-xl font-medium placeholder:text-zinc-600 focus:outline-none text-white"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <textarea
                                    placeholder="Description (Markdown supported)..."
                                    className="w-full bg-transparent text-sm text-zinc-400 placeholder:text-zinc-600 focus:outline-none resize-none min-h-[100px]"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2 flex-wrap">
                                <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-lg text-xs text-zinc-400 border border-zinc-800 hover:border-zinc-700 transition-colors">
                                    <Folder size={14} />
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as any)}
                                        className="bg-transparent focus:outline-none capitalize cursor-pointer max-w-[80px]"
                                        aria-label="Task Category"
                                    >
                                        <option value="inbox">Inbox</option>
                                        <option value="today">Today</option>
                                        <option value="week">Week</option>
                                        <option value="month">Month</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-lg text-xs text-zinc-400 border border-zinc-800 hover:border-zinc-700 transition-colors">
                                    <Briefcase size={14} />
                                    <select
                                        value={projectId || ''}
                                        onChange={(e) => setProjectId(e.target.value || undefined)}
                                        className="bg-transparent focus:outline-none capitalize cursor-pointer max-w-[100px]"
                                        aria-label="Project"
                                    >
                                        <option value="">No Project</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-lg text-xs text-zinc-400 border border-zinc-800 hover:border-zinc-700 transition-colors">
                                    <Flag size={14} />
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as any)}
                                        className="bg-transparent focus:outline-none cursor-pointer"
                                        aria-label="Task Priority"
                                    >
                                        <option value="P1">P1</option>
                                        <option value="P2">P2</option>
                                        <option value="P3">P3</option>
                                        <option value="P4">P4</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-lg text-xs text-zinc-400 border border-zinc-800 hover:border-zinc-700 transition-colors">
                                    <Clock size={14} />
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        className="bg-transparent w-8 focus:outline-none placeholder:text-zinc-600"
                                        value={estimatedDuration}
                                        onChange={(e) => setEstimatedDuration(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-800/50 bg-zinc-900/30">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!title.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                            >
                                Create Task
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
