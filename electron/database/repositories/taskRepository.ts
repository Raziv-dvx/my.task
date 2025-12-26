import { dbManager } from '../db';
import { Task, Subtask } from '../../types';
import { randomUUID } from 'crypto';
import { analyticsService } from '../../services/analytics';

export class TaskRepository {
    get db() {
        return dbManager.getInstance();
    }

    createTask(task: Omit<Task, 'id' | 'created_at' | 'actual_duration'>) {
        const id = randomUUID();
        const stmt = this.db.prepare(`
            INSERT INTO tasks (id, title, description, status, priority, due_date, project_id, estimated_duration, category, is_locked, timer_elapsed)
            VALUES (@id, @title, @description, @status, @priority, @due_date, @project_id, @estimated_duration, @category, @is_locked, @timer_elapsed)
        `);

        stmt.run({
            id,
            title: task.title,
            description: task.description || null,
            status: task.status || 'TODO',
            priority: task.priority || 'P4',
            due_date: task.due_date || null,
            project_id: task.project_id || null,
            estimated_duration: task.estimated_duration || null,
            category: task.category || 'inbox',
            is_locked: task.is_locked || 0,
            timer_elapsed: task.timer_elapsed || 0
        });

        return this.getTaskById(id);
    }

    getTaskById(id: string): Task | undefined {
        return this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task;
    }

    getAllTasks(filter: { status?: string, projectId?: string, date?: string } = {}): Task[] {
        let query = 'SELECT * FROM tasks WHERE 1=1';
        const params: any[] = [];

        if (filter.status) {
            query += ' AND status = ?';
            params.push(filter.status);
        }

        if (filter.projectId) {
            query += ' AND project_id = ?';
            params.push(filter.projectId);
        }

        query += ' ORDER BY position ASC, created_at DESC';

        const tasks = this.db.prepare(query).all(...params) as Task[];

        // Hydrate with subtasks
        // N+1 problem, but fine for local SQLite and small dataset
        for (const task of tasks) {
            task.subtasks = this.getSubtasks(task.id);
        }

        return tasks;
    }

    updateTask(id: string, updates: Partial<Task>) {
        // Exclude subtasks from updates if passed accidentally
        // @ts-ignore
        const { subtasks, ...cleanUpdates } = updates;

        const keys = Object.keys(cleanUpdates).filter(k => k !== 'id');
        if (keys.length === 0) return this.getTaskById(id);

        const setClause = keys.map(k => `${k} = @${k}`).join(', ');
        const stmt = this.db.prepare(`UPDATE tasks SET ${setClause} WHERE id = @id`);

        stmt.run({ ...cleanUpdates, id });
        return this.getTaskById(id);
    }

    completeTask(id: string) {
        const stmt = this.db.prepare(`
            UPDATE tasks 
            SET status = 'DONE', completed_at = datetime('now') 
            WHERE id = ?
        `);
        stmt.run(id);

        // Update Analytics
        analyticsService.incrementTaskCompletion();

        return this.getTaskById(id);
    }

    // Subtasks
    addSubtask(taskId: string, title: string) {
        const id = randomUUID();
        this.db.prepare(`
            INSERT INTO subtasks (id, task_id, title, is_completed)
            VALUES (?, ?, ?, 0)
        `).run(id, taskId, title);
        return this.getSubtasks(taskId);
    }

    getSubtasks(taskId: string): Subtask[] {
        return this.db.prepare('SELECT * FROM subtasks WHERE task_id = ?').all(taskId) as Subtask[];
    }

    toggleSubtask(subtaskId: string, isCompleted: boolean) {
        this.db.prepare('UPDATE subtasks SET is_completed = ? WHERE id = ?')
            .run(isCompleted ? 1 : 0, subtaskId);
    }

    deleteSubtask(id: string) {
        this.db.prepare('DELETE FROM subtasks WHERE id = ?').run(id);
    }

    deleteTask(id: string) {
        // Manually cascade delete dependencies
        const deleteSubtasks = this.db.prepare('DELETE FROM subtasks WHERE task_id = ?');
        const deleteSessions = this.db.prepare('DELETE FROM sessions WHERE task_id = ?');
        const deleteTask = this.db.prepare('DELETE FROM tasks WHERE id = ?');

        this.db.transaction(() => {
            deleteSubtasks.run(id);
            deleteSessions.run(id);
            deleteTask.run(id);
        })();
    }

    reorderTasks(orderedIds: string[]) {
        const updateStmt = this.db.prepare('UPDATE tasks SET position = ? WHERE id = ?');
        const transaction = this.db.transaction((ids: string[]) => {
            for (let i = 0; i < ids.length; i++) {
                updateStmt.run(i, ids[i]);
            }
        });
        transaction(orderedIds);
    }
}

export const taskRepository = new TaskRepository();
