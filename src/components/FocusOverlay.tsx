import { useState, useEffect } from 'react';
import { useSession } from '../hooks/useSession';
import { useTasks } from '../hooks/useTasks';
import { CheckCircle, PauseCircle, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Task } from '../types';

export const FocusOverlay = () => {
    const { activeSession, stopSession } = useSession();
    const { tasks, completeTask, updateTask } = useTasks();
    const [elapsed, setElapsed] = useState(0);
    const [activeTask, setActiveTask] = useState<Task | undefined>();

    useEffect(() => {
        if (activeSession && tasks.length > 0) {
            setActiveTask(tasks.find(t => t.id === activeSession.task_id));
        } else {
            setActiveTask(undefined);
        }
    }, [activeSession, tasks]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (activeSession && activeTask) {
            const start = new Date(activeSession.start_time).getTime();
            const initialElapsed = activeTask.timer_elapsed || 0;

            // Initial calculation
            setElapsed(initialElapsed + Math.floor((Date.now() - start) / 1000));

            interval = setInterval(() => {
                const now = Date.now();
                setElapsed(initialElapsed + Math.floor((now - start) / 1000));
            }, 1000);
        } else if (activeTask) {
            setElapsed(activeTask.timer_elapsed || 0);
        }
        return () => clearInterval(interval);
    }, [activeSession, activeTask]);

    if (!activeSession || !activeTask) return null;

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleComplete = async () => {
        await stopSession(activeTask.id);
        await updateTask(activeTask.id, { timer_elapsed: elapsed });
        await completeTask(activeTask.id);
    };

    const handleStop = async () => {
        await stopSession(activeTask.id);
        await updateTask(activeTask.id, { timer_elapsed: elapsed });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#1a1a1a] flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8"
            >
                <div className="text-sm font-medium text-blue-500 uppercase tracking-widest mb-2">Focus Mode</div>
                <h1 className="text-4xl font-bold text-white max-w-2xl leading-tight">{activeTask.title}</h1>
            </motion.div>

            <motion.div
                className="text-9xl font-mono font-light text-zinc-100 mb-12 tabular-nums tracking-tighter"
                animate={{ opacity: [1, 0.8, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
                {formatTime(elapsed)}
            </motion.div>

            <div className="flex items-center gap-6">
                {/* ... existing buttons ... */}
                <button
                    onClick={() => window.api.invoke('window:set-mode', 'mini')}
                    className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-xs uppercase tracking-wider font-medium"
                >
                    <Maximize2 size={16} /> Mini Mode
                </button>

                <button
                    onClick={handleStop}
                    className="flex flex-col items-center gap-2 group"
                >
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                        <PauseCircle size={32} className="text-zinc-400 group-hover:text-white" />
                    </div>
                    <span className="text-sm text-zinc-500 group-hover:text-zinc-300">Pause Session</span>
                </button>

                <button
                    onClick={handleComplete}
                    className="flex flex-col items-center gap-2 group"
                >
                    <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center group-hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
                        <CheckCircle size={40} className="text-white" />
                    </div>
                    <span className="text-sm text-zinc-300 group-hover:text-white font-medium">Complete Task</span>
                </button>
            </div>

            {/* Subtasks or notes could go here */}

            <div className="absolute bottom-8 text-zinc-600 text-xs text-center">
                Press <span className="text-zinc-400">Ctrl+O</span> to exit focus mode
            </div>
        </div>
    );
};
