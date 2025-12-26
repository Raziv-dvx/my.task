import { useState } from 'react';
import { useRecurringTasks } from '../hooks/useRecurringTasks';
import { Plus, ChevronDown, Trash2, Repeat } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
import type { RecurringTask } from '../hooks/useRecurringTasks';

// Wrapper for draggable items in the dropdown
const RecurringTaskItem = ({ task, onDelete }: { task: RecurringTask, onDelete: (id: string) => void }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `recurring-${task.id}`,
        data: {
            type: 'RECURRING_TEMPLATE',
            task: task
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="relative group touch-none">
            {/* Use TaskCard with isTemplate prop (we need to implement this prop in TaskCard) */}
            {/* For now, just simulating the card look or using TaskCard if we updated it */}
            {/* Let's construct a simplified view consistent with TaskCard but read-only */}

            <div className="bg-[#1f1f1f] border border-zinc-800 p-3 rounded-lg hover:border-zinc-700 cursor-grab active:cursor-grabbing flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-medium text-zinc-200">{task.title}</h4>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">{task.priority}</span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(task.id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
                    className="text-zinc-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Template"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

export const RecurringTasksDropdown = () => {
    const { templates, loading, addTemplate, deleteTemplate } = useRecurringTasks();
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'P1' | 'P2' | 'P3' | 'P4'>('P4');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        await addTemplate({
            title: newTaskTitle,
            priority: newTaskPriority,
            description: '' // Optional description could be added later
        });
        setNewTaskTitle('');
        setIsCreating(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md text-sm font-medium transition-colors border border-zinc-700 hover:border-zinc-600"
            >
                <Repeat size={16} className="text-blue-400" />
                <span>Recurring Tasks</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop to close */}
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full right-0 mt-2 w-80 bg-[#121212] border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[500px]"
                        >
                            <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between sticky top-0">
                                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Templates</h3>
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300"
                                >
                                    <Plus size={12} /> New Template
                                </button>
                            </div>

                            {/* Create Form */}
                            <AnimatePresence>
                                {isCreating && (
                                    <motion.form
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        onSubmit={handleCreate}
                                        className="p-3 bg-zinc-900/30 border-b border-zinc-800 overflow-hidden"
                                    >
                                        <input
                                            autoFocus
                                            type="text"
                                            value={newTaskTitle}
                                            onChange={e => setNewTaskTitle(e.target.value)}
                                            placeholder="Template name..."
                                            className="w-full bg-zinc-800 text-sm text-zinc-200 px-2 py-1.5 rounded border border-zinc-700 mb-2 focus:outline-none focus:border-blue-500"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <select
                                                value={newTaskPriority}
                                                onChange={e => setNewTaskPriority(e.target.value as any)}
                                                className="bg-zinc-800 text-xs text-zinc-400 border border-zinc-700 rounded px-1"
                                                aria-label="Priority"
                                            >
                                                <option value="P1">P1</option>
                                                <option value="P2">P2</option>
                                                <option value="P3">P3</option>
                                                <option value="P4">P4</option>
                                            </select>
                                            <button
                                                type="submit"
                                                disabled={!newTaskTitle.trim()}
                                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2 py-1 rounded disabled:opacity-50"
                                            >
                                                Add
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsCreating(false)}
                                                className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-1"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[100px]">
                                {loading ? (
                                    <div className="text-center text-zinc-600 text-xs py-4">Loading...</div>
                                ) : templates.length === 0 ? (
                                    <div className="text-center text-zinc-600 text-xs py-4 italic">
                                        No templates yet.<br />Drag tasks here to save (todo) or create new.
                                    </div>
                                ) : (
                                    templates.map(task => (
                                        <RecurringTaskItem key={task.id} task={task} onDelete={deleteTemplate} />
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
