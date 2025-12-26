import { useState, useEffect } from 'react';
import type { Task } from '../types';
import { Circle, CheckCircle, Clock, Calendar as CalendarIcon, Trash2, Play, Target, Square, CheckSquare, Plus, X, StopCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '../hooks/useTasks';
import { useSession } from '../hooks/useSession';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PriorityBadge = ({ priority }: { priority: string }) => {
    const colors = {
        P1: 'text-red-400 bg-red-400/10',
        P2: 'text-yellow-400 bg-yellow-400/10',
        P3: 'text-green-400 bg-green-400/10',
        P4: 'text-zinc-400 bg-zinc-400/10'
    };

    return (
        <span className={cn("text-xs font-mono px-1.5 py-0.5 rounded", colors[priority as keyof typeof colors])}>
            {priority}
        </span>
    );
};

const SessionTimer = ({ startTime, initialSeconds = 0, onTick }: { startTime?: string, initialSeconds?: number, onTick?: (elapsed: number) => void }) => {
    const [elapsed, setElapsed] = useState(initialSeconds);

    useEffect(() => {
        if (!startTime) return;
        const start = new Date(startTime).getTime();

        const update = () => {
            const now = new Date().getTime();
            const currentSessionDuration = Math.floor((now - start) / 1000);
            const totalElapsed = initialSeconds + currentSessionDuration;
            setElapsed(totalElapsed);
            onTick?.(totalElapsed);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [startTime, initialSeconds, onTick]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-xs font-mono">
            <Clock size={12} />
            <span>Active : {formatTime(elapsed)}</span>
        </div>
    );
};

// Export Inner component for DragOverlay
// Export Inner component for DragOverlay
// Export Inner component for DragOverlay
export const TaskCardInner = ({
    task,
    onComplete,
    onStartSession,
    onDelete,
    onLockIn,
    isReadOnly = false,
    style,
    listeners,
    attributes,
    isDragging,
    innerRef
}: {
    task: Task,
    onComplete: (id: string) => void,
    onStartSession?: (id: string) => void,
    onDelete?: (id: string) => void,
    onLockIn?: (id: string, initialElapsed?: number) => void,
    isCollapsible?: boolean, // Keep in type definition for compatibility with parent usage
    isReadOnly?: boolean,
    style?: React.CSSProperties,
    listeners?: any,
    attributes?: any,
    isDragging?: boolean,
    innerRef?: (node: HTMLElement | null) => void
}) => {
    const { addSubtask, toggleSubtask, deleteSubtask, updateTask } = useTasks();
    const { activeSession, stopSession } = useSession();
    const { playPop, playSuccess, playStart, playStop } = useSoundEffects();

    // Inline Timer State
    const isSessionActive = activeSession?.task_id === task.id;
    const [isPaused, setIsPaused] = useState(false);
    const [sessionElapsed, setSessionElapsed] = useState(task.timer_elapsed || 0);

    // Expansion State
    const [isExpanded, setIsExpanded] = useState(false);

    // Failed State (Incomplete in Archive)
    const isFailed = isReadOnly && task.status !== 'DONE';

    // If session becomes inactive externally (e.g. stopped elsewhere), reset pause
    useEffect(() => {
        if (!isSessionActive && !isPaused) {
            // Normal reset
        }
    }, [isSessionActive, isPaused]);

    // Subtask Input State
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const [subtaskTitle, setSubtaskTitle] = useState('');

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subtaskTitle.trim()) return;
        playPop();
        await addSubtask(task.id, subtaskTitle);
        setSubtaskTitle('');
        setIsAddingSubtask(false);
    };

    const handlePauseSession = (id: string) => {
        playStop();
        stopSession(id);
        updateTask(id, { timer_elapsed: sessionElapsed });
        setIsPaused(true);
    };

    const handleStartSession = async (id: string) => {
        playStart();
        setIsPaused(false);
        await onStartSession?.(id);
    };

    const handleResumeSession = async (id: string) => {
        playStart();
        setIsResuming(true);
        await onStartSession?.(id);
        setIsPaused(false);
        setIsResuming(false);
    };

    const [isResuming, setIsResuming] = useState(false);

    const handleToggleExpand = () => {
        if (!isReadOnly) {
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <motion.div
            ref={innerRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={handleToggleExpand}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
                "group flex flex-col gap-2 p-3 rounded-lg bg-[#1f1f1f] hover:bg-zinc-800/50 transition-colors border border-zinc-800 hover:border-zinc-700 touch-none select-none relative",
                isDragging && "ring-2 ring-blue-500/20 shadow-xl bg-zinc-800 z-50 opacity-100",
                task.status === 'DONE' && !isFailed && "opacity-60 bg-zinc-900/50",
                isFailed && "border-red-500/30 bg-red-900/10 hover:bg-red-900/20 hover:border-red-500/50",
                !isReadOnly && "cursor-pointer"
            )}
        >
            {/* Header / Main Content */}
            <div className="flex items-start gap-3 w-full">
                <button
                    onClick={(e) => {
                        if (isReadOnly) return;
                        e.stopPropagation();
                        playSuccess();
                        onComplete(task.id);
                    }}
                    className={cn(
                        "mt-1 text-zinc-500 transition-colors shrink-0",
                        !isReadOnly && "hover:text-green-500 cursor-pointer",
                        isReadOnly && "cursor-default opacity-50",
                        isFailed && "text-red-500/50"
                    )}
                    title={isReadOnly ? (isFailed ? "Incomplete" : "Completed") : "Complete Task"}
                    onPointerDown={(e) => e.stopPropagation()}
                    disabled={isReadOnly}
                >
                    {task.status === 'DONE' ? <CheckCircle size={20} /> : isFailed ? <X size={20} /> : <Circle size={20} />}
                </button>

                <div className="flex-1 min-w-0">
                    <div className={cn("flex items-center gap-2 mb-1", !isExpanded && "pr-20")}>
                        <span className={cn(
                            "font-medium text-sm text-zinc-200",
                            !isExpanded && "truncate",
                            task.status === 'DONE' && "line-through text-zinc-500",
                            isFailed && "text-red-400"
                        )}>
                            {task.title}
                        </span>
                        <PriorityBadge priority={task.priority} />

                        {/* Inline Timer Display - Only if collapsed or always? Keep always for visibility */}
                        {(isSessionActive || isPaused) && (
                            <SessionTimer
                                startTime={activeSession?.start_time}
                                initialSeconds={sessionElapsed}
                                onTick={(total) => {
                                    if (total !== sessionElapsed) setSessionElapsed(total);
                                }}
                            />
                        )}
                    </div>

                    {/* Expandable Content */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                {/* Description */}
                                {task.description && (
                                    <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                                        {task.description}
                                    </p>
                                )}

                                <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                                    {task.project_id && <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Project Name</span>}
                                    {task.due_date && <span className="flex items-center gap-1"><CalendarIcon size={12} /> {task.due_date}</span>}
                                    {task.estimated_duration && <span className="flex items-center gap-1"><Clock size={12} /> {task.estimated_duration}m</span>}
                                </div>

                                {/* Subtasks List */}
                                <div className="mt-3 space-y-1.5" onPointerDown={(e) => e.stopPropagation()}>
                                    {task.subtasks?.map(sub => (
                                        <div key={sub.id} className="flex items-center gap-2 group/sub">
                                            <button
                                                onClick={() => {
                                                    if (isReadOnly) return;
                                                    if (!sub.is_completed) playPop();
                                                    toggleSubtask(sub.id, !sub.is_completed);
                                                }}
                                                className={cn(
                                                    "text-zinc-600",
                                                    !isReadOnly && "hover:text-zinc-400",
                                                    sub.is_completed && "text-green-500",
                                                    isReadOnly && "cursor-default"
                                                )}
                                                disabled={isReadOnly}
                                            >
                                                {sub.is_completed ? <CheckSquare size={14} /> : <Square size={14} />}
                                            </button>
                                            <span className={cn("text-xs text-zinc-400 flex-1 truncate", sub.is_completed && "line-through text-zinc-600")}>
                                                {sub.title}
                                            </span>
                                            {!isReadOnly && (
                                                <button
                                                    onClick={() => deleteSubtask(sub.id)}
                                                    className="opacity-0 group-hover/sub:opacity-100 text-zinc-600 hover:text-red-400 transition-opacity"
                                                    title="Delete Subtask"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Add Subtask Input */}
                                {!isReadOnly && (
                                    <div className="mt-2" onPointerDown={(e) => e.stopPropagation()}>
                                        {isAddingSubtask ? (
                                            <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={subtaskTitle}
                                                    onChange={(e) => setSubtaskTitle(e.target.value)}
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                    placeholder="Subtask name..."
                                                    autoFocus
                                                    className="bg-zinc-800/50 text-xs text-zinc-300 rounded px-2 py-1 flex-1 border border-zinc-700 focus:outline-none focus:border-zinc-600"
                                                />
                                                <button type="submit" disabled={!subtaskTitle.trim()} className="text-zinc-400 hover:text-blue-400 disabled:opacity-50" title="Add">
                                                    <Plus size={14} />
                                                </button>
                                                <button type="button" onClick={() => setIsAddingSubtask(false)} className="text-zinc-500 hover:text-zinc-300" title="Cancel">
                                                    <X size={14} />
                                                </button>
                                            </form>
                                        ) : (
                                            <button
                                                onClick={() => setIsAddingSubtask(true)}
                                                className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400 transition-colors opacity-70 hover:opacity-100"
                                                title="Add Subtask"
                                            >
                                                <Plus size={12} /> Add Subtask
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Expanded Action Buttons Footer */}
                                {!isReadOnly && task.status !== 'DONE' && (
                                    <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-end gap-2" onPointerDown={(e) => e.stopPropagation()}>
                                        {onLockIn && !isSessionActive && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    playStart();
                                                    onLockIn(task.id, sessionElapsed);
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-md text-xs font-medium transition-colors"
                                            >
                                                <Target size={14} /> Lock In
                                            </button>
                                        )}

                                        {onStartSession && (
                                            (isSessionActive || isResuming) ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePauseSession(task.id);
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-md text-xs font-medium transition-colors animate-pulse"
                                                >
                                                    <StopCircle size={14} /> Pause
                                                </button>
                                            ) : isPaused ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleResumeSession(task.id);
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-md text-xs font-medium transition-colors"
                                                >
                                                    <Play size={14} /> Resume
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStartSession(task.id);
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-md text-xs font-medium transition-colors"
                                                >
                                                    <Play size={14} /> Focus
                                                </button>
                                            )
                                        )}

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete?.(task.id);
                                            }}
                                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Collapsed Absolute Hover Actions - Hide if Expanded or ReadOnly */}
            {!isExpanded && !isReadOnly && (
                <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onPointerDown={(e) => e.stopPropagation()}>
                    {onLockIn && task.status !== 'DONE' && !isSessionActive && (
                        <button
                            onClick={() => {
                                playStart();
                                onLockIn(task.id, sessionElapsed);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-orange-400 hover:bg-orange-400/10 rounded"
                            title="Lock In"
                        >
                            <Target size={16} />
                        </button>
                    )}

                    {onStartSession && task.status !== 'DONE' && (
                        (isSessionActive || isResuming) ? (
                            <button
                                onClick={() => handlePauseSession(task.id)}
                                className={cn(
                                    "p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded",
                                    isSessionActive && "animate-pulse"
                                )}
                                title="Pause Session"
                            >
                                <StopCircle size={16} />
                            </button>
                        ) : isPaused ? (
                            <button
                                onClick={() => handleResumeSession(task.id)}
                                className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded"
                                title="Resume Session"
                            >
                                <Play size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={() => handleStartSession(task.id)}
                                className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 rounded"
                                title="Start Focus Session"
                            >
                                <Play size={16} />
                            </button>
                        )
                    )}

                    {!isSessionActive && (
                        <button
                            onClick={() => onDelete?.(task.id)}
                            className="text-zinc-500 hover:text-red-400 transition-colors p-1.5"
                            title="Delete Task"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export const TaskCard = ({ task, onComplete, onStartSession, onDelete, onLockIn, isCollapsible = true, isReadOnly = false }: { task: Task, onComplete: (id: string) => void, onStartSession?: (id: string) => void, onDelete?: (id: string) => void, onLockIn?: (id: string, initialElapsed?: number) => void, isCollapsible?: boolean, isReadOnly?: boolean }) => {
    // dnd-kit hook
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id, data: { task }, disabled: isReadOnly }); // Disable DnD if read only

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1, // Only opacity change for source item
        zIndex: isDragging ? 999 : 'auto',
    };

    return (
        <TaskCardInner
            task={task}
            onComplete={onComplete}
            onStartSession={onStartSession}
            onDelete={onDelete}
            onLockIn={onLockIn}
            isCollapsible={isCollapsible}
            isReadOnly={isReadOnly}
            style={style}
            listeners={listeners}
            attributes={attributes}
            isDragging={isDragging}
            innerRef={setNodeRef}
        />
    );
};
