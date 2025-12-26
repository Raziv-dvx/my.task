import type { Task } from '../types';
import { TaskCard } from './TaskCard';
import { AnimatePresence } from 'framer-motion';

export const TaskList = ({
    tasks,
    onComplete,
    onStartSession,
    onDelete,
    onLockIn
}: {
    tasks: Task[],
    onComplete: (id: string) => void,
    onStartSession: (id: string) => void,
    onDelete?: (id: string) => void,
    onLockIn?: (id: string) => void
}) => {
    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                <p>No tasks found. Press Ctrl+N to create one.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <AnimatePresence initial={false}>
                {tasks.map((task, index) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={onComplete}
                        onStartSession={onStartSession}
                        onDelete={onDelete}
                        onLockIn={index === 0 ? onLockIn : undefined}
                        // First task: Not collapsible (always open). Others: Collapsible (default closed)
                        isCollapsible={index > 0}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};
