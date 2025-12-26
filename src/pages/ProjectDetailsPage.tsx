import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks'; // We might need direct actions or just use context
import { ArrowLeft, Clock, Calendar, CheckCircle, Circle, Plus, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Task } from '../types';
import { CreateTaskModal } from '../components/CreateTaskModal';

interface TasksContext {
    tasks: Task[];
    onLockIn: (taskId: string) => void;
}

export const ProjectDetailsPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { projects, loading: projectsLoading } = useProjects();
    // Use context tasks for consistency with global state
    const { tasks, onLockIn } = useOutletContext<TasksContext>();
    // We also need actions: specifically generic update/delete
    const { completeTask, deleteTask } = useTasks();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const project = projects.find(p => p.id === projectId);

    // Filter tasks for this project
    const projectTasks = useMemo(() => {
        return tasks.filter(t => t.project_id === projectId).sort((a, b) => {
            // Sort by done status then position
            if (a.status === 'DONE' && b.status !== 'DONE') return 1;
            if (a.status !== 'DONE' && b.status === 'DONE') return -1;
            return a.position - b.position;
        });
    }, [tasks, projectId]);

    const completedCount = projectTasks.filter(t => t.status === 'DONE').length;
    const totalCount = projectTasks.length;
    const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    if (projectsLoading) return <div className="p-8">Loading project...</div>;
    if (!project) return (
        <div className="p-8 text-center">
            <h2 className="text-xl font-bold mb-4">Project not found</h2>
            <button onClick={() => navigate('/projects')} className="text-blue-400 hover:underline">Back to Projects</button>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="mb-8 p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <button
                    onClick={() => navigate('/projects')}
                    className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4 text-sm"
                >
                    <ArrowLeft size={16} /> Back to Projects
                </button>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
                        <p className="text-zinc-400 max-w-2xl">{project.description || 'No description provided.'}</p>
                    </div>
                    {/* Progress Ring or Stat? */}
                    <div className="text-right">
                        <div className="text-3xl font-bold text-blue-400">{progress}%</div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider">Complete</div>
                    </div>
                </div>

                <div className="flex items-center gap-6 mt-6 text-sm text-zinc-500">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className={project.status === 'ACTIVE' ? 'text-green-500' : 'text-zinc-600'} />
                        <span className={project.status === 'ACTIVE' ? 'text-green-400' : ''}>{project.status}</span>
                    </div>
                    {project.deadline && (
                        <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <CheckCircle size={16} />
                        <span>{completedCount}/{totalCount} tasks</span>
                    </div>
                </div>
            </div>

            {/* Task List Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Tasks</h2>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors"
                >
                    <Plus size={16} /> Add Task
                </button>
            </div>

            {/* Tasks Section */}
            <div className="flex-1 overflow-auto space-y-3 pb-8">
                {projectTasks.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-600">
                        <p>No tasks in this project yet.</p>
                        <button onClick={() => setIsCreateModalOpen(true)} className="text-blue-400 hover:underline mt-2 text-sm">Create your first task</button>
                    </div>
                ) : (
                    projectTasks.map(task => (
                        <div key={task.id} className="relative group">
                            {/* Reusing TaskCard is tricky if it assumes 'drag' or specific layout contexts.
                                Let's see if TaskCard is robust. It uses 'useSortable'.
                                We probably don't want DND here initially or we need a SortableContext.
                                For now, let's render a simplified view or wrap it.
                                Using TaskCard WITHOUT DndContext parent might crash or just not work.
                                Layout has DndContext but it wraps Outlet. So useSortable *inside* Outlet should work IF inside SortableContext.
                                But we are not in a column.
                                Let's build a simpler 'ProjectTaskRow' for now to avoid DnD complexity unless requested.
                            */}
                            <div className={`
                                flex items-center justify-between p-4 rounded-lg border transition-all
                                ${task.status === 'DONE' ? 'bg-zinc-900/30 border-zinc-800/50 opacity-60' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}
                            `}>
                                <div className="flex items-start gap-3 flex-1">
                                    <button
                                        onClick={() => completeTask(task.id)}
                                        className={`mt-1 flex-shrink-0 ${task.status === 'DONE' ? 'text-green-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                                    >
                                        {task.status === 'DONE' ? <CheckCircle size={20} /> : <Circle size={20} />}
                                    </button>
                                    <div>
                                        <h4 className={`font-medium ${task.status === 'DONE' ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                                            {task.title}
                                        </h4>
                                        {task.description && <p className="text-sm text-zinc-500 mt-0.5 line-clamp-1">{task.description}</p>}
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${task.priority === 'P1' ? 'border-red-900/50 text-red-400 bg-red-900/20' :
                                                task.priority === 'P2' ? 'border-orange-900/50 text-orange-400 bg-orange-900/20' :
                                                    task.priority === 'P3' ? 'border-blue-900/50 text-blue-400 bg-blue-900/20' :
                                                        'border-zinc-700 text-zinc-500'
                                                }`}>
                                                {task.priority}
                                            </span>
                                            {task.due_date && (
                                                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                                    <Calendar size={10} /> {new Date(task.due_date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {task.status !== 'DONE' && (
                                        <button
                                            onClick={() => onLockIn(task.id)}
                                            className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                                            title="Lock In"
                                        >
                                            <Clock size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isCreateModalOpen && (
                <CreateTaskModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onTaskCreated={() => {
                        // Context updates automatically via event
                    }}
                    defaultProjectId={projectId} // We need to support this prop in CreateTaskModal
                />
            )}
        </div>
    );
};
