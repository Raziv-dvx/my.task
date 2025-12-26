"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveService = exports.ArchiveService = void 0;
const db_1 = require("../database/db");
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ArchiveService {
    get db() {
        return db_1.dbManager.getInstance();
    }
    getArchiveDir(type = 'daily') {
        const userDataPath = electron_1.app.getPath('userData');
        const archiveDir = path_1.default.join(userDataPath, 'archives', type);
        if (!fs_1.default.existsSync(archiveDir)) {
            fs_1.default.mkdirSync(archiveDir, { recursive: true });
        }
        return archiveDir;
    }
    // Auto-archive checks boundaries:
    // Daily: Archive if completed before Today 00:00
    // Weekly: Archive if completed before This Week Start (Sunday 00:00)
    // Monthly: Archive if completed before This Month Start (1st 00:00)
    autoArchiveTasks() {
        const tasksToArchive = this.db.prepare(`
            SELECT * FROM tasks
        `).all();
        if (tasksToArchive.length === 0)
            return 0;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday); // Copy today
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay()); // Adjust to Sunday 00:00
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const tasksToProcess = [];
        tasksToArchive.forEach(task => {
            const refDateStr = task.status === 'DONE' && task.completed_at ? task.completed_at : task.created_at;
            const completedAt = new Date(refDateStr || 0);
            let shouldArchive = false;
            if (task.category === 'month') {
                if (completedAt < startOfMonth)
                    shouldArchive = true;
            }
            else if (task.category === 'week') {
                if (completedAt < startOfWeek)
                    shouldArchive = true;
            }
            else {
                // today, inbox
                if (completedAt < startOfToday)
                    shouldArchive = true;
            }
            if (shouldArchive) {
                tasksToProcess.push(task);
            }
        });
        if (tasksToProcess.length === 0)
            return 0;
        return this.processArchival(tasksToProcess);
    }
    archiveTasks() {
        const tasksToArchive = this.db.prepare(`
            SELECT * FROM tasks 
            WHERE status = 'DONE'
        `).all();
        if (tasksToArchive.length === 0)
            return 0;
        return this.processArchival(tasksToArchive);
    }
    processArchival(tasks) {
        // Group by Type -> Date -> Tasks
        const limitMap = {
            daily: {},
            weekly: {},
            monthly: {}
        };
        tasks.forEach(task => {
            const dateObj = new Date(task.completed_at || new Date().toISOString());
            const dateDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
            // Determine Archive Type based on Category
            // 'today'/'inbox' -> Daily
            // 'week' -> Weekly
            // 'month' -> Monthly
            let type = 'daily';
            let dateKey = dateDate;
            if (task.category === 'week') {
                type = 'weekly';
                // Calculate Year-Week, e.g., 2023-W25
                // Simple week number fallback
                const start = new Date(dateObj.getFullYear(), 0, 1);
                const diff = dateObj.getTime() - start.getTime() + ((start.getTimezoneOffset() - dateObj.getTimezoneOffset()) * 60 * 1000);
                const oneDay = 1000 * 60 * 60 * 24;
                const day = Math.floor(diff / oneDay);
                const week = Math.ceil((day + 1) / 7);
                dateKey = `${dateObj.getFullYear()}-W${week}`;
            }
            else if (task.category === 'month') {
                type = 'monthly';
                dateKey = dateDate.substring(0, 7); // YYYY-MM
            }
            else {
                // today, inbox, etc.
                type = 'daily';
                dateKey = dateDate;
            }
            if (!limitMap[type][dateKey])
                limitMap[type][dateKey] = [];
            limitMap[type][dateKey].push(task);
        });
        let totalArchived = 0;
        const deleteStmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
        const deleteSessionsStmt = this.db.prepare('DELETE FROM sessions WHERE task_id = ?');
        const deleteSubtasksStmt = this.db.prepare('DELETE FROM subtasks WHERE task_id = ?');
        this.db.transaction(() => {
            for (const type of ['daily', 'weekly', 'monthly']) {
                const archiveDir = this.getArchiveDir(type);
                for (const [dateKey, groupedTasks] of Object.entries(limitMap[type])) {
                    const filePath = path_1.default.join(archiveDir, `archive_${dateKey}.json`);
                    let existingTasks = [];
                    if (fs_1.default.existsSync(filePath)) {
                        try {
                            existingTasks = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
                        }
                        catch (e) {
                            console.error('Error reading archive file', e);
                        }
                    }
                    const allTasks = [...existingTasks, ...groupedTasks];
                    fs_1.default.writeFileSync(filePath, JSON.stringify(allTasks, null, 2));
                    // Remove from DB
                    for (const task of groupedTasks) {
                        try {
                            deleteSessionsStmt.run(task.id);
                            deleteSubtasksStmt.run(task.id);
                            deleteStmt.run(task.id);
                            totalArchived++;
                        }
                        catch (e) {
                            console.error('Failed to archive task', task.id, e);
                        }
                    }
                }
            }
        })();
        return totalArchived;
    }
    getArchivedTasks(type = 'daily', date) {
        const archiveDir = this.getArchiveDir(type);
        if (date) {
            const filePath = path_1.default.join(archiveDir, `archive_${date}.json`);
            if (fs_1.default.existsSync(filePath)) {
                return JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
            }
            return [];
        }
        return fs_1.default.readdirSync(archiveDir)
            .filter(f => f.startsWith('archive_') && f.endsWith('.json'))
            .map(f => f.replace('archive_', '').replace('.json', ''))
            .sort()
            .reverse();
    }
}
exports.ArchiveService = ArchiveService;
exports.archiveService = new ArchiveService();
//# sourceMappingURL=archive.js.map