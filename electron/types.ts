export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
    priority: 'P1' | 'P2' | 'P3' | 'P4';
    due_date?: string;
    created_at: string;
    completed_at?: string;
    project_id?: string;
    estimated_duration?: number;
    actual_duration: number;
    category: 'inbox' | 'today' | 'week' | 'month';
    is_locked: number; // 0 or 1
    timer_elapsed: number;
    subtasks?: Subtask[];
}

export interface Subtask {
    id: string;
    task_id: string;
    title: string;
    is_completed: number; // 0 or 1 for SQLite
}

export interface Project {
    id: string;
    name: string;
    description: string;
    deadline?: string;
    status: 'ACTIVE' | 'COMPLETED';
    created_at: string;
    completed_at?: string;
}

export interface Session {
    id: string;
    task_id: string;
    start_time: string;
    end_time?: string;
    duration_seconds?: number;
}
