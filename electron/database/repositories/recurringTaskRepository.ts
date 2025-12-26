import type { Database } from 'better-sqlite3';
import { dbManager } from '../db';
import { randomUUID } from 'crypto';

export interface RecurringTask {
    id: string;
    title: string;
    description?: string;
    priority: 'P1' | 'P2' | 'P3' | 'P4';
    created_at: string;
}

export class RecurringTaskRepository {
    private db: Database;

    constructor() {
        this.db = dbManager.getInstance();
    }

    getAll(): RecurringTask[] {
        return this.db.prepare('SELECT * FROM recurring_tasks ORDER BY created_at DESC').all() as RecurringTask[];
    }

    create(task: Omit<RecurringTask, 'id' | 'created_at'>): RecurringTask {
        const id = randomUUID();
        const created_at = new Date().toISOString();

        this.db.prepare(`
            INSERT INTO recurring_tasks (id, title, description, priority, created_at)
            VALUES (@id, @title, @description, @priority, @created_at)
        `).run({ ...task, id, created_at });

        return { ...task, id, created_at };
    }

    delete(id: string): void {
        this.db.prepare('DELETE FROM recurring_tasks WHERE id = ?').run(id);
    }
}

export const recurringTaskRepository = new RecurringTaskRepository();
