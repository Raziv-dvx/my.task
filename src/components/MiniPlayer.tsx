import { useEffect, useState } from 'react';
import { useSession } from '../hooks/useSession';
import { useTasks } from '../hooks/useTasks';
import { Pause, Maximize2, CheckCircle } from 'lucide-react';

export const MiniPlayer = () => {
    const { activeSession, stopSession } = useSession();
    const { tasks, completeTask, updateTask } = useTasks();
    const [elapsed, setElapsed] = useState(0);

    const activeTask = activeSession ? tasks.find(t => t.id === activeSession.task_id) : null;

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (activeSession && activeTask) {
            const start = new Date(activeSession.start_time).getTime();
            const initialElapsed = activeTask.timer_elapsed || 0;

            setElapsed(initialElapsed + Math.floor((Date.now() - start) / 1000));
            interval = setInterval(() => {
                setElapsed(initialElapsed + Math.floor((Date.now() - start) / 1000));
            }, 1000);
        } else if (activeTask) {
            setElapsed(activeTask.timer_elapsed || 0);
        } else {
            setElapsed(0);
        }
        return () => clearInterval(interval);
    }, [activeSession, activeTask]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleExpand = () => {
        window.api.invoke('window:set-mode', 'normal');
    };

    const handleStop = () => {
        if (activeTask) {
            stopSession(activeTask.id);
            updateTask(activeTask.id, { timer_elapsed: elapsed });
        }
    };

    const handleComplete = async () => {
        if (activeTask) {
            await stopSession(activeTask.id);
            await updateTask(activeTask.id, { timer_elapsed: elapsed });
            await completeTask(activeTask.id);
        }
    };

    return (
        <div className="h-screen w-screen bg-zinc-950 flex flex-col p-4 border-2 border-zinc-800/50 overflow-hidden draggable">
            {/* Header / Drag Handle */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 mr-2">
                    <div className="text-[10px] uppercase tracking-wider text-blue-500 font-bold mb-1">
                        {activeSession ? 'Focusing' : 'Ready'}
                    </div>
                    <div className="text-sm font-medium text-white truncate leading-tight">
                        {activeTask?.title || 'No active task'}
                    </div>
                </div>
                <button
                    onClick={handleExpand}
                    className="text-zinc-500 hover:text-white transition-colors p-1 no-drag"
                    title="Expand"
                >
                    <Maximize2 size={14} />
                </button>
            </div>

            {/* Timer */}
            <div className="flex-1 flex items-center justify-center">
                <div className="text-4xl font-mono font-medium text-white tabular-nums tracking-tighter">
                    {formatTime(elapsed)}
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-4 relative z-50 no-drag">
                {activeSession ? (
                    <>
                        <button
                            onClick={handleStop}
                            title="Pause"
                            className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-300 hover:text-white transition-all shadow-lg cursor-pointer"
                        >
                            <Pause size={18} fill="currentColor" />
                        </button>
                        <button
                            onClick={handleComplete}
                            title="Complete"
                            className="p-3 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-all shadow-lg shadow-blue-900/20 cursor-pointer"
                        >
                            <CheckCircle size={18} />
                        </button>
                    </>
                ) : (
                    <div className="text-xs text-zinc-500 text-center">
                        Select a task in full mode
                    </div>
                )}
            </div>

            {/* Draggable region helper style */}
            <style>{`
                .draggable {
                    -webkit-app-region: drag;
                }
                .no-drag {
                    -webkit-app-region: no-drag;
                }
            `}</style>
        </div>
    );
};
