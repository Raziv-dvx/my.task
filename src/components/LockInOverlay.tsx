import { useState, useEffect } from 'react';

import { useSoundEffects } from '../hooks/useSoundEffects';
import { cn } from '../lib/utils';
import type { Task } from '../types';
import { Play, Pause, CheckCircle, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';

interface LockInOverlayProps {
    task: Task;
    initialElapsed?: number;
    onComplete: (id: string) => void;
    onUpdateTimer: (id: string, elapsed: number) => void;
    onExit: () => void;
}

export const LockInOverlay = ({ task, initialElapsed, onComplete, onUpdateTimer, onExit }: LockInOverlayProps) => {
    const { playSuccess, playStart, playStop } = useSoundEffects();

    // Re-fetch task to get latest subtasks if needed
    // But relying on parent prop update via Layout/useTasks is fine for now

    // Use initialElapsed (current session time) if provided, effectively starting "from that session"
    // However, if we want to add to total, we should start with task.timer_elapsed.
    // User requirement: "start lock in from the elapsed time from that session"
    // This implies if I did 5 mins in session, LockIn starts at 5 mins?
    // Or does it mean "add this session time to total"?
    // "elapsed time from that session" -> Likely the transient session time.
    // If I start LockIn, usually it's a new "focus block".
    // If I pass initialElapsed, I should probably respect it.
    const [elapsed, setElapsed] = useState(initialElapsed || task.timer_elapsed || 0);
    const [isRunning, setIsRunning] = useState(true);

    // Resizing Logic
    const [size, setSize] = useState(160);
    const minSize = 140;
    const maxSize = 300;

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // prevent drag
        const startY = e.clientY;
        const startSize = size;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = moveEvent.clientY - startY;
            const newSize = Math.max(minSize, Math.min(maxSize, startSize + delta));
            setSize(newSize);
            // @ts-ignore
            window.api.invoke('window:resize', { width: newSize + 40, height: newSize + 40 });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    useEffect(() => {
        // Enter Mini Mode on Mount
        document.body.classList.add('transparent-window');
        document.documentElement.classList.add('transparent-window');
        // @ts-ignore
        window.api.invoke('window:set-mode', 'mini');

        // Sound on start
        playStart();

        return () => {
            // Exit Mini Mode on Unmount
            document.body.classList.remove('transparent-window');
            document.documentElement.classList.remove('transparent-window');
            // @ts-ignore
            window.api.invoke('window:set-mode', 'normal');
        };
    }, []);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isRunning) {
            interval = setInterval(() => {
                setElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleTogglePause = () => {
        if (isRunning) {
            onUpdateTimer(task.id, elapsed);
            playStop();
        } else {
            playStart();
        }
        setIsRunning(!isRunning);
    };

    const handleComplete = () => {
        onUpdateTimer(task.id, elapsed);
        playSuccess();
        new Notification("Task Completed!", { body: `You finished: ${task.title}` });
        onComplete(task.id);
        onExit();
    };





    const handleRestore = () => {
        onExit(); // This closes the overlay and restores normal view
    };

    return (
        <div className="w-full h-full flex flex-col justify-end items-center relative overflow-visible">
            {/* Main Circle */}
            <motion.div
                layout
                className="w-[160px] h-[160px] rounded-full bg-black/80 backdrop-blur-xl border border-zinc-700/50 shadow-2xl flex flex-col items-center justify-center relative z-50 mb-1 app-region-drag group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                {/* Main Menu / Restore Button - Top Left */}
                <button
                    onClick={handleRestore}
                    className="absolute -left-2 top-0 bg-zinc-800 text-zinc-400 hover:text-white p-2 rounded-full border border-zinc-700 shadow-md transition-colors app-no-drag hover:bg-zinc-700"
                    title="Main Menu"
                >
                    <LayoutGrid size={14} />
                </button>



                {/* Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none opacity-20">
                    <circle cx="80" cy="80" r="78" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500" />
                </svg>

                {/* Priority Badge */}
                <div className={cn(
                    "absolute top-8 px-1.5 py-0.5 rounded text-[9px] font-bold border app-no-drag",
                    task.priority === 'P1' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                        task.priority === 'P2' ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                            task.priority === 'P3' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                                "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                )}>
                    {task.priority || 'P4'}
                </div>

                {/* Timer Display */}
                <div className="text-3xl font-mono font-bold text-white tracking-widest mb-0.5 select-none mt-4">
                    {formatTime(elapsed)}
                </div>

                {/* Task Title */}
                <div className="max-w-[120px] px-2 mb-3">
                    <p className="text-[10px] text-zinc-400 truncate text-center select-none font-medium text-ellipsis overflow-hidden whitespace-nowrap">
                        {task.title}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 app-no-drag">
                    <button
                        onClick={handleTogglePause}
                        className="text-zinc-400 hover:text-white transition-colors p-1.5 hover:bg-zinc-800 rounded-full"
                        title={isRunning ? "Pause Timer" : "Resume Timer"}
                    >
                        {isRunning ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button
                        onClick={handleComplete}
                        className="text-zinc-400 hover:text-green-400 transition-colors p-1.5 hover:bg-zinc-800 rounded-full"
                        title="Complete Task"
                    >
                        <CheckCircle size={18} />
                    </button>
                </div>

                {/* Resize Handle - Bottom Edge */}
                <div
                    className="absolute bottom-2 w-12 h-1 bg-zinc-700/50 rounded-full cursor-ns-resize hover:bg-blue-500/50 transition-colors app-no-drag"
                    onMouseDown={handleResizeStart}
                />
            </motion.div>
        </div>
    );
};
