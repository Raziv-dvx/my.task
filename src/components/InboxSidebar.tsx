import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import type { Task } from '../types';
import { TaskCard } from './TaskCard';

interface InboxSidebarProps {
    tasks: Task[];
    onComplete: (id: string) => void;
    onStartSession: (id: string) => void;
    onDelete?: (id: string) => void;
    onClose: () => void;
}

export const InboxSidebar = ({ tasks, onComplete, onStartSession, onDelete, onClose }: InboxSidebarProps) => {
    const { setNodeRef } = useDroppable({
        id: 'inbox',
        data: {
            type: 'container',
            id: 'inbox'
        }
    });

    return (
        <aside
            ref={setNodeRef}
            className="w-[300px] border-l border-zinc-800 bg-[#121212] flex flex-col h-full"
        >
            <div className="p-4 pt-14 border-b border-zinc-800 flex items-start justify-between relative">
                <div>
                    <h2 className="text-lg font-bold text-zinc-300">Inbox / Ideas</h2>
                    <p className="text-xs text-zinc-500">Drag tasks here to park them</p>
                </div>
                <button
                    onClick={onClose}
                    className="text-zinc-500 hover:text-white p-1.5 hover:bg-zinc-800 rounded-lg transition-colors absolute top-[52px] right-4"
                    title="Close Inbox"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence mode='popLayout'>
                    {tasks.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-10 text-zinc-600 italic text-sm"
                        >
                            Empty
                        </motion.div>
                    ) : (
                        tasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onComplete={onComplete}
                                onStartSession={onStartSession}
                                onDelete={onDelete}
                            />
                        ))
                    )}
                </AnimatePresence>
            </div>
        </aside>
    );
};
