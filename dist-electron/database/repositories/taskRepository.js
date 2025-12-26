"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskRepository = exports.TaskRepository = void 0;
const db_1 = require("../db");
const crypto_1 = require("crypto");
const analytics_1 = require("../../services/analytics");
class TaskRepository {
    get db() {
        return db_1.dbManager.getInstance();
    }
    createTask(task) {
        const id = (0, crypto_1.randomUUID)();
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
    getTaskById(id) {
        return this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    }
    getAllTasks(filter = {}) {
        let query = 'SELECT * FROM tasks WHERE 1=1';
        const params = [];
        if (filter.status) {
            query += ' AND status = ?';
            params.push(filter.status);
        }
        if (filter.projectId) {
            query += ' AND project_id = ?';
            params.push(filter.projectId);
        }
        query += ' ORDER BY position ASC, created_at DESC';
        const tasks = this.db.prepare(query).all(...params);
        // Hydrate with subtasks
        // N+1 problem, but fine for local SQLite and small dataset
        for (const task of tasks) {
            task.subtasks = this.getSubtasks(task.id);
        }
        return tasks;
    }
    updateTask(id, updates) {
        // Exclude subtasks from updates if passed accidentally
        // @ts-ignore
        const { subtasks, ...cleanUpdates } = updates;
        const keys = Object.keys(cleanUpdates).filter(k => k !== 'id');
        if (keys.length === 0)
            return this.getTaskById(id);
        const setClause = keys.map(k => `${k} = @${k}`).join(', ');
        const stmt = this.db.prepare(`UPDATE tasks SET ${setClause} WHERE id = @id`);
        stmt.run({ ...cleanUpdates, id });
        return this.getTaskById(id);
    }
    completeTask(id) {
        const stmt = this.db.prepare(`
            UPDATE tasks 
            SET status = 'DONE', completed_at = datetime('now') 
            WHERE id = ?
        `);
        stmt.run(id);
        // Update Analytics
        analytics_1.analyticsService.incrementTaskCompletion();
        return this.getTaskById(id);
    }
    // Subtasks
    addSubtask(taskId, title) {
        const id = (0, crypto_1.randomUUID)();
        this.db.prepare(`
            INSERT INTO subtasks (id, task_id, title, is_completed)
            VALUES (?, ?, ?, 0)
        `).run(id, taskId, title);
        return this.getSubtasks(taskId);
    }
    getSubtasks(taskId) {
        return this.db.prepare('SELECT * FROM subtasks WHERE task_id = ?').all(taskId);
    }
    toggleSubtask(subtaskId, isCompleted) {
        this.db.prepare('UPDATE subtasks SET is_completed = ? WHERE id = ?')
            .run(isCompleted ? 1 : 0, subtaskId);
    }
    deleteSubtask(id) {
        this.db.prepare('DELETE FROM subtasks WHERE id = ?').run(id);
    }
    deleteTask(id) {
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
    reorderTasks(orderedIds) {
        const updateStmt = this.db.prepare('UPDATE tasks SET position = ? WHERE id = ?');
        const transaction = this.db.transaction((ids) => {
            for (let i = 0; i < ids.length; i++) {
                updateStmt.run(i, ids[i]);
            }
        });
        transaction(orderedIds);
    }
}
exports.TaskRepository = TaskRepository;
exports.taskRepository = new TaskRepository();
//# sourceMappingURL=taskRepository.js.map