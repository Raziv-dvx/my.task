import { useState, useEffect } from 'react';
import { useArchive } from '../hooks/useArchive';
import { Archive, RefreshCw, ChevronLeft, Calendar } from 'lucide-react';
import type { Task } from '../types';
import { TaskCard } from '../components/TaskCard';

export const ArchivePage = () => {
    const [archiveType, setArchiveType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const { archiveDates, loading, runArchival, getTasksForDate } = useArchive(archiveType);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [dateTasks, setDateTasks] = useState<Task[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);

    useEffect(() => {
        if (selectedDate) {
            setLoadingTasks(true);
            getTasksForDate(selectedDate).then(tasks => {
                setDateTasks(tasks);
                setLoadingTasks(false);
            });
        }
    }, [selectedDate, archiveType]);

    // Reset selection when tab changes
    useEffect(() => {
        setSelectedDate(null);
    }, [archiveType]);

    if (loading) return <div>Loading...</div>;

    if (selectedDate) {
        return (
            <div className="max-w-4xl mx-auto h-full flex flex-col">
                <header className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => setSelectedDate(null)}
                        className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                        title="Back to archives"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Calendar size={24} className="text-zinc-500" />
                            {selectedDate}
                        </h1>
                        <span className="text-sm text-zinc-500">{dateTasks.length} tasks archived</span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto space-y-3 pb-8">
                    {loadingTasks ? (
                        <div className="text-center py-10 text-zinc-500">Loading tasks...</div>
                    ) : (
                        dateTasks.map(task => (
                            <div key={task.id} className="opacity-75 hover:opacity-100 transition-opacity">
                                <TaskCard
                                    task={task}
                                    onComplete={() => { }}
                                    onStartSession={() => { }}
                                    isReadOnly={true}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">Archive</h1>
                </div>
                <button
                    onClick={runArchival}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                    <RefreshCw size={16} /> Run Archival Now
                </button>
            </header>

            <div className="flex gap-4 mb-6 border-b border-zinc-800 pb-2">
                {(['daily', 'weekly', 'monthly'] as const).map(type => (
                    <button
                        key={type}
                        onClick={() => setArchiveType(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${archiveType === type
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                            }`}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)} ({type === archiveType ? archiveDates.length : ''})
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {archiveDates.map(date => (
                    <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 hover:bg-zinc-800 transition-all text-left group"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar size={20} className="text-zinc-500 group-hover:text-blue-400 transition-colors" />
                            <h3 className="font-bold text-lg">{date}</h3>
                        </div>
                        <p className="text-sm text-zinc-500 group-hover:text-zinc-400">View {archiveType} tasks</p>
                    </button>
                ))}

                {archiveDates.length === 0 && (
                    <div className="col-span-full text-center py-20 text-zinc-500">
                        <Archive size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No {archiveType} archives found.</p>
                        <p className="text-xs mt-2">Completed tasks in '{archiveType === 'daily' ? 'today' : archiveType === 'weekly' ? 'week' : 'month'}' category will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
