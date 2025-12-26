import { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useSession } from '../hooks/useSession';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { Plus } from 'lucide-react';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { TaskColumn } from '../components/TaskColumn';
import { useOutletContext } from 'react-router-dom';
import { RecurringTasksDropdown } from '../components/RecurringTasksDropdown';
import type { Task } from '../types';

interface TasksContext {
    onLockIn: (taskId: string) => void;
    tasks: Task[];
}

export const TasksPage = () => {
    // Destructure refresh from useTasks
    const { tasks, loading, completeTask, deleteTask } = useTasks();
    const { startSession } = useSession();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Get context from Layout for Lock In
    const { onLockIn } = useOutletContext<TasksContext>();

    // Keyboard shortcut to open modal
    useKeyboardShortcut({
        'ctrl+n': () => setIsCreateModalOpen(true)
    });

    // Filter Logic (Keep simple for now)
    const getTasksByColumn = (columnId: string) => {
        if (columnId === 'today') return tasks.filter(t => t.category === 'today' || (!t.category && t.status !== 'DONE')).sort((a, b) => a.position - b.position);
        if (columnId === 'week') return tasks.filter(t => t.category === 'week').sort((a, b) => a.position - b.position);
        if (columnId === 'month') return tasks.filter(t => t.category === 'month').sort((a, b) => a.position - b.position);
        return [];
    };

    if (loading) return <div>Loading...</div>;

    const todayTasks = getTasksByColumn('today');
    const weekTasks = getTasksByColumn('week');
    const monthTasks = getTasksByColumn('month');

    return (
        <div className="h-full flex flex-col">
            <header className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-bold">My Tasks</h1>
                    <span className="text-zinc-500 text-sm">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <RecurringTasksDropdown />
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors"
                    >
                        <Plus size={16} /> New Task <span className="text-blue-200 text-xs font-normal opacity-70 ml-1">Ctrl+N</span>
                    </button>
                </div>
            </header>

            {isCreateModalOpen && (
                <CreateTaskModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onTaskCreated={() => { }}
                />
            )}

            <div className="flex-1 flex gap-4 overflow-x-auto pb-2">
                <TaskColumn
                    id="today"
                    title="Today"
                    tasks={todayTasks}
                    onComplete={completeTask}
                    onStartSession={startSession}
                    onDelete={deleteTask}
                    onLockIn={onLockIn}
                />

                <TaskColumn
                    id="week"
                    title="This Week"
                    tasks={weekTasks}
                    onComplete={completeTask}
                    onStartSession={startSession}
                    onDelete={deleteTask}
                />

                <TaskColumn
                    id="month"
                    title="This Month"
                    tasks={monthTasks}
                    onComplete={completeTask}
                    onStartSession={startSession}
                    onDelete={deleteTask}
                />
            </div>
        </div>
    );
};
