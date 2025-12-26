// ... imports ...
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './CommandPalette';
import { FocusOverlay } from './FocusOverlay';
import { InboxSidebar } from './InboxSidebar';
import { LockInOverlay } from './LockInOverlay';
import { TrashBin } from './TrashBin';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, KeyboardSensor, closestCorners, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useState, useEffect } from 'react';
import { useTasks } from '../hooks/useTasks';
import { TaskCard } from './TaskCard';
import { MiniPlayer } from './MiniPlayer';
import type { RecurringTask } from '../hooks/useRecurringTasks';

export const Layout = () => {
    const { tasks, updateTask, deleteTask, completeTask, reorderTasks, createTask } = useTasks();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeDragData, setActiveDragData] = useState<any>(null); // Store full drag data
    const activeTask = tasks.find(t => t.id === activeId);

    const inboxTasks = [...tasks]
        .filter(t => t.category === 'inbox')
        .sort((a, b) => {
            if (a.status === 'DONE' && b.status !== 'DONE') return 1;
            if (a.status !== 'DONE' && b.status === 'DONE') return -1;
            return 0;
        });
    const [isInboxOpen, setIsInboxOpen] = useState(false);

    // Auto-archive on mount (debounced or just once per app load)
    useEffect(() => {
        // Run once on mount to archive old tasks
        window.api.invoke('archive:run').catch(console.error);
    }, []);

    // Lock In Logic
    const [lockedTaskId, setLockedTaskId] = useState<string | null>(null);
    const [lockedInitialElapsed, setLockedInitialElapsed] = useState<number | undefined>(undefined);
    const lockedTask = tasks.find(t => t.id === lockedTaskId);

    const handleLockIn = (taskId: string, initialElapsed?: number) => {
        setLockedTaskId(taskId);
        setLockedInitialElapsed(initialElapsed);
    };

    const handleExitLockIn = () => {
        setLockedTaskId(null);
        setLockedInitialElapsed(undefined);
    };

    const handleUpdateTimer = (id: string, elapsed: number) => {
        updateTask(id, { timer_elapsed: elapsed });
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const getTasksByColumn = (columnId: string) => {
        if (columnId === 'today') return tasks.filter(t => t.category === 'today' || (!t.category && t.status !== 'DONE')).sort((a, b) => a.position - b.position);
        if (columnId === 'week') return tasks.filter(t => t.category === 'week').sort((a, b) => a.position - b.position);
        if (columnId === 'month') return tasks.filter(t => t.category === 'month').sort((a, b) => a.position - b.position);
        // Inbox tasks are handled separately in UI but logic should be similar if sorting is enabled there.
        // For now let's just handle main columns for explicit reordering.
        if (columnId === 'inbox') return tasks.filter(t => t.category === 'inbox').sort((a, b) => a.position - b.position);

        return [];
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        setActiveDragData(event.active.data.current);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveDragData(null);

        if (!over) return;

        const activeIdString = active.id as string;
        const overId = over.id as string;
        const isRecurringTemplate = active.data.current?.type === 'RECURRING_TEMPLATE';

        if (overId === 'trash-bin') {
            if (!isRecurringTemplate) {
                deleteTask(activeIdString);
            }
            return;
        }

        // Determine destination column
        let destColumn: 'today' | 'week' | 'month' | 'inbox' = 'today'; // Default
        const isOverColumn = ['today', 'week', 'month', 'inbox'].includes(overId);

        if (isOverColumn) {
            destColumn = overId as any;
        } else {
            // Dropped over a task, find its column
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                destColumn = overTask.category || 'today';
            } else {
                // If dropping recurring template onto empty space or invalid target? Default to today?
                // If overTask not found (maybe generic drop area), stick to default 'today' or return
                if (!isRecurringTemplate) return;
            }
        }

        // Handle Recurring Template Drop
        if (isRecurringTemplate) {
            const template = active.data.current?.task as RecurringTask;
            if (template) {
                await createTask({
                    title: template.title,
                    description: template.description,
                    priority: template.priority,
                    category: destColumn,
                    status: 'TODO'
                });
            }
            return;
        }

        // Handle Normal Task Drag
        const activeNormalTask = tasks.find(t => t.id === activeIdString);
        if (!activeNormalTask) return;

        const sourceColumn = activeNormalTask.category || 'today';

        if (isOverColumn) {
            // Cross-Column Move to empty column
            if (activeNormalTask.category !== destColumn && !(!activeNormalTask.category && destColumn === 'today')) {
                await updateTask(activeIdString, { category: destColumn });
            }
        } else {
            // Dropped over a task
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                const destTasks = getTasksByColumn(destColumn);
                const overIndex = destTasks.findIndex(t => t.id === overId);

                // 1. Same Column Reorder
                if (activeNormalTask.id !== overTask.id && sourceColumn === destColumn) {
                    const oldIndex = destTasks.findIndex(t => t.id === activeIdString);
                    const reordered = arrayMove(destTasks, oldIndex, overIndex);
                    await reorderTasks(reordered);
                    return;
                }

                // 2. Cross Column Drop on Task
                if (activeNormalTask.category !== destColumn && !(!activeNormalTask.category && destColumn === 'today')) {
                    // Update category
                    await updateTask(activeIdString, { category: destColumn });
                }
            }
        }
    };

    // Mini Mode Logic
    const [isMiniMode, setIsMiniMode] = useState(window.innerWidth < 350);
    useEffect(() => {
        const handleResize = () => setIsMiniMode(window.innerWidth < 350);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 1. Lock In (Takes precedence)
    if (lockedTask) {
        return (
            <LockInOverlay
                task={lockedTask}
                initialElapsed={lockedInitialElapsed}
                onComplete={(id) => {
                    completeTask(id);
                    handleExitLockIn();
                }}
                onUpdateTimer={handleUpdateTimer}
                onExit={handleExitLockIn}
            />
        );
    }

    // 2. Mini Mode (Generic)
    if (isMiniMode) {
        return <MiniPlayer />;
    }

    // 3. Normal Layout
    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-screen bg-[#1a1a1a] text-white overflow-hidden">
                <FocusOverlay />
                {lockedTask && (
                    <div className="fixed inset-0 z-[100]">
                        <LockInOverlay
                            task={lockedTask}
                            initialElapsed={lockedInitialElapsed}
                            onComplete={(id) => {
                                completeTask(id); // Use standard completeTask
                                handleExitLockIn();
                            }}
                            onUpdateTimer={handleUpdateTimer}
                            onExit={handleExitLockIn}
                        />
                    </div>
                )}

                <CommandPalette />
                {/* Draggable Titlebar Overlay */}
                <div className="absolute top-0 left-0 right-0 h-8 app-region-drag z-50 pointer-events-none" />

                {/* Window Controls - Z-Index higher than drag region, and MUST NOT be draggable */}
                <div className="absolute top-3 right-3 z-[60] flex items-center gap-1.5 no-drag bg-black/20 backdrop-blur-sm px-2 py-1.5 rounded-full border border-white/5 shadow-sm transition-opacity hover:opacity-100 opacity-60 hover:bg-black/40 [(-webkit-app-region):no-drag]">
                    <button
                        onClick={() => window.api.invoke('window:minimize')}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title="Minimize"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                    <button
                        onClick={() => window.api.invoke('window:maximize')}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title="Maximize"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                    </button>
                    <button
                        onClick={() => window.api.invoke('window:close')}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-red-500 rounded-full transition-colors"
                        title="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <Sidebar />

                <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto p-8 pt-12">
                        <Outlet context={{ tasks, onLockIn: handleLockIn }} />
                    </div>

                    <TrashBin />

                    {!isInboxOpen && (
                        <button
                            onClick={() => setIsInboxOpen(true)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 border-r-0 p-2 rounded-l-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-lg hover:pr-3 z-40 group"
                            title="Open Inbox"
                        >
                            <span className="[writing-mode:vertical-rl] text-[10px] tracking-[0.2em] font-bold uppercase rotate-180 opacity-70 group-hover:opacity-100 transition-opacity">Inbox</span>
                        </button>
                    )}
                </main>

                <AnimatePresence>
                    {isInboxOpen && (
                        <motion.div
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="relative h-full flex z-40 border-l border-zinc-800 shadow-2xl"
                        >
                            <InboxSidebar
                                tasks={inboxTasks}
                                onComplete={completeTask}
                                onStartSession={handleLockIn}
                                onDelete={deleteTask}
                                onClose={() => setIsInboxOpen(false)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <DragOverlay>
                    {activeTask ? (
                        <div className="opacity-80 rotate-2 cursor-grabbing pointer-events-none">
                            <TaskCard
                                task={activeTask}
                                onComplete={() => { }}
                                onStartSession={() => { }}
                                onDelete={() => { }}
                            />
                        </div>
                    ) : activeDragData?.type === 'RECURRING_TEMPLATE' ? (
                        <div className="opacity-80 rotate-2 cursor-grabbing pointer-events-none">
                            <TaskCard
                                task={{
                                    ...activeDragData.task,
                                    id: 'preview',
                                    status: 'TODO',
                                    category: 'today',
                                    created_at: '',
                                    actual_duration: 0,
                                    timer_elapsed: 0,
                                    position: 0,
                                    is_locked: 0
                                }}
                                onComplete={() => { }}
                                onStartSession={() => { }}
                                onDelete={() => { }}
                                isReadOnly={true}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};
