"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionManager = exports.SessionManager = void 0;
const db_1 = require("../database/db");
const taskRepository_1 = require("../database/repositories/taskRepository"); // We need to update task status
const crypto_1 = require("crypto");
const analytics_1 = require("./analytics");
class SessionManager {
    get db() {
        return db_1.dbManager.getInstance();
    }
    getActiveSession() {
        return this.db.prepare('SELECT * FROM sessions WHERE end_time IS NULL').get();
    }
    startSession(taskId) {
        // Enforce One-Task-Active Rule
        const activeSession = this.getActiveSession();
        if (activeSession) {
            if (activeSession.task_id === taskId) {
                // Already active on this task, ignore or throw?
                return activeSession;
            }
            this.stopSession(activeSession.task_id);
        }
        const id = (0, crypto_1.randomUUID)();
        const startTime = new Date().toISOString();
        this.db.prepare(`
            INSERT INTO sessions (id, task_id, start_time)
            VALUES (?, ?, ?)
        `).run(id, taskId, startTime);
        // Update task status to IN_PROGRESS
        taskRepository_1.taskRepository.updateTask(taskId, { status: 'IN_PROGRESS' });
        return this.getActiveSession();
    }
    stopSession(taskId) {
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
        const task = taskRepository_1.taskRepository.getTaskById(taskId);
        if (task) {
            const addedMinutes = Math.floor(durationSeconds / 60);
            taskRepository_1.taskRepository.updateTask(taskId, {
                actual_duration: (task.actual_duration || 0) + addedMinutes
            });
            // Update Analytics
            analytics_1.analyticsService.addFocusTime(addedMinutes);
        }
        return activeSession;
    }
    getTaskSessions(taskId) {
        return this.db.prepare('SELECT * FROM sessions WHERE task_id = ? ORDER BY start_time DESC').all(taskId);
    }
}
exports.SessionManager = SessionManager;
exports.sessionManager = new SessionManager();
//# sourceMappingURL=sessionManager.js.map