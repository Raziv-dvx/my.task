import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task } from '../types';
import { clsx } from 'clsx';
import { TaskList } from './TaskList';

interface TaskColumnProps {
    id: string;
    title: string;
    tasks: Task[];
    onComplete: (id: string) => void;
    onStartSession: (id: string) => void;
    onDelete?: (id: string) => void;
    onLockIn?: (id: string) => void;
}
// ... props

export const TaskColumn = ({ id, title, tasks, onComplete, onStartSession, onDelete, onLockIn }: TaskColumnProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id,
        data: {
            type: 'container',
            id
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={clsx(
                "flex-1 min-w-[300px] bg-[#1f1f1f] rounded-xl flex flex-col h-full border border-zinc-800 transition-colors",
                isOver && "border-blue-500 bg-blue-500/5 text-blue-500"
            )}
        >
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-zinc-200">{title}</h3>
                <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400 font-mono">
                    {tasks.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
                <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <TaskList
                        tasks={tasks}
                        onComplete={onComplete}
                        onStartSession={onStartSession}
                        onDelete={onDelete}
                        onLockIn={onLockIn}
                    />
                </SortableContext>
            </div>
        </div>
    );
};
