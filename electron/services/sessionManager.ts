import { dbManager } from '../database/db';
import { taskRepository } from '../database/repositories/taskRepository'; // We need to update task status
import { Session } from '../types';
import { randomUUID } from 'crypto';
import { analyticsService } from './analytics';

export class SessionManager {
    get db() {
        return dbManager.getInstance();
    }

    getActiveSession(): Session | undefined {
        return this.db.prepare('SELECT * FROM sessions WHERE end_time IS NULL').get() as Session;
    }

    startSession(taskId: string) {
        // Enforce One-Task-Active Rule
        const activeSession = this.getActiveSession();
        if (activeSession) {
            if (activeSession.task_id === taskId) {
                // Already active on this task, ignore or throw?
                return activeSession;
            }
            this.stopSession(activeSession.task_id);
        }

        const id = randomUUID();
        const startTime = new Date().toISOString();

        this.db.prepare(`
            INSERT INTO sessions (id, task_id, start_time)
            VALUES (?, ?, ?)
        `).run(id, taskId, startTime);

        // Update task status to IN_PROGRESS
        taskRepository.updateTask(taskId, { status: 'IN_PROGRESS' });

        return this.getActiveSession();
    }

    stopSession(taskId: string) {
        const activeSession = this.getActiveSession();
        if (!activeSession || activeSession.task_id !== taskId) {
            return null; // No active session for this task
        }

        const endTime = new Date().toISOString();
        const start = new Date(activeSession.start_time);
        const end = new Date(endTime);
        const durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);

        this.db.prepare(`
            UPDATE sessions 
            SET end_time = ?, duration_seconds = ?
            WHERE id = ?
        `).run(endTime, durationSeconds, activeSession.id);

        // Update task actual_duration (accumulate minutes)
        const task = taskRepository.getTaskById(taskId);
        if (task) {
            const addedMinutes = Math.floor(durationSeconds / 60);
            taskRepository.updateTask(taskId, {
                actual_duration: (task.actual_duration || 0) + addedMinutes
            });
            // Update Analytics
            analyticsService.addFocusTime(addedMinutes);
        }

        return activeSession;
    }

    getTaskSessions(taskId: string): Session[] {
        return this.db.prepare('SELECT * FROM sessions WHERE task_id = ? ORDER BY start_time DESC').all(taskId) as Session[];
    }
}

export const sessionManager = new SessionManager();
