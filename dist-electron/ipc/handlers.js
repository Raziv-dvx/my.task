"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHandlers = registerHandlers;
const electron_1 = require("electron");
const taskRepository_1 = require("../database/repositories/taskRepository");
const projectRepository_1 = require("../database/repositories/projectRepository");
const sessionManager_1 = require("../services/sessionManager");
const archive_1 = require("../services/archive");
const analytics_1 = require("../services/analytics");
const recurringTaskRepository_1 = require("../database/repositories/recurringTaskRepository");
function registerHandlers() {
    // Run auto-archival on startup
    try {
        archive_1.archiveService.autoArchiveTasks();
    }
    catch (e) {
        console.error('Auto-archival failed on startup:', e);
    }
    // Tasks
    electron_1.ipcMain.handle('tasks:create', (_, task) => taskRepository_1.taskRepository.createTask(task));
    electron_1.ipcMain.handle('tasks:get-all', (_, filter) => taskRepository_1.taskRepository.getAllTasks(filter));
    electron_1.ipcMain.handle('tasks:update', (_, { id, updates }) => taskRepository_1.taskRepository.updateTask(id, updates));
    electron_1.ipcMain.handle('tasks:complete', (_, id) => taskRepository_1.taskRepository.completeTask(id));
    electron_1.ipcMain.handle('tasks:delete', (_, id) => taskRepository_1.taskRepository.deleteTask(id));
    electron_1.ipcMain.handle('tasks:reorder', (_, ids) => taskRepository_1.taskRepository.reorderTasks(ids));
    // Subtasks
    electron_1.ipcMain.handle('subtasks:add', (_, { taskId, title }) => taskRepository_1.taskRepository.addSubtask(taskId, title));
    electron_1.ipcMain.handle('subtasks:toggle', (_, { id, isCompleted }) => taskRepository_1.taskRepository.toggleSubtask(id, isCompleted));
    electron_1.ipcMain.handle('subtasks:delete', (_, id) => taskRepository_1.taskRepository.deleteSubtask(id));
    // Projects
    electron_1.ipcMain.handle('projects:create', (_, project) => projectRepository_1.projectRepository.createProject(project));
    electron_1.ipcMain.handle('projects:get-all', (_, status) => projectRepository_1.projectRepository.getAllProjects(status));
    electron_1.ipcMain.handle('projects:update', (_, { id, updates }) => projectRepository_1.projectRepository.updateProject(id, updates));
    electron_1.ipcMain.handle('projects:delete', (_, id) => projectRepository_1.projectRepository.deleteProject(id));
    // Sessions
    electron_1.ipcMain.handle('session:start', (_, taskId) => sessionManager_1.sessionManager.startSession(taskId));
    electron_1.ipcMain.handle('session:stop', (_, taskId) => sessionManager_1.sessionManager.stopSession(taskId));
    electron_1.ipcMain.handle('session:get-active', () => sessionManager_1.sessionManager.getActiveSession());
    // Analytics & Archive
    electron_1.ipcMain.handle('analytics:get-daily', (_, days) => analytics_1.analyticsService.getDailyStats(days));
    electron_1.ipcMain.handle('archive:get-all', (_, { type, date }) => archive_1.archiveService.getArchivedTasks(type, date));
    electron_1.ipcMain.handle('archive:run', () => archive_1.archiveService.archiveTasks());
    // Recurring Tasks
    electron_1.ipcMain.handle('recurring:get-all', () => recurringTaskRepository_1.recurringTaskRepository.getAll());
    electron_1.ipcMain.handle('recurring:create', (_, task) => recurringTaskRepository_1.recurringTaskRepository.create(task));
    electron_1.ipcMain.handle('recurring:delete', (_, id) => recurringTaskRepository_1.recurringTaskRepository.delete(id));
    // Window Management
    electron_1.ipcMain.handle('window:set-mode', (event, mode) => {
        const win = electron_1.BrowserWindow.fromWebContents(event.sender);
        if (!win)
            return;
        const bounds = win.getBounds();
        // Force transparency
        win.setBackgroundColor('#00000000');
        if (mode === 'mini') {
            // Target size: 220x220 to allow space for "pop out" buttons (toggle) and shadows
            const width = 220;
            const height = 220;
            // If coming from Flash (larger), anchor bottom-center
            // If coming from Normal (huge), just go to top-right or keep relative?
            // Let's assume user wants it in a convenient spot if switching from Normal.
            // But if switching from Flash, we MUST anchor bottom.
            // Simple heuristic based on current size
            if (bounds.width === 300 && bounds.height === 500) {
                // From Flash -> Mini: Anchor Bottom Center
                const newX = Math.round(bounds.x + (bounds.width - width) / 2);
                const newY = bounds.y + bounds.height - height;
                win.setBounds({ x: newX, y: newY, width, height });
            }
            else {
                // From Normal -> Mini: Just resize, let user move it. Or set top-right.
                win.setSize(width, height);
            }
            win.setAlwaysOnTop(true, 'screen-saver');
        }
        else if (mode === 'flash') {
            // Target size: 300x500
            const width = 300;
            const height = 500;
            // From Mini -> Flash: Anchor Bottom Center (Grow Up)
            const newX = Math.round(bounds.x + (bounds.width - width) / 2);
            const newY = bounds.y + bounds.height - height;
            win.setBounds({ x: newX, y: newY, width, height });
            win.setAlwaysOnTop(true, 'screen-saver');
        }
        else {
            // Normal
            win.setSize(1200, 800);
            win.setAlwaysOnTop(false);
            win.center();
        }
    });
    // Window Resize
    electron_1.ipcMain.handle('window:resize', (event, { width, height }) => {
        const win = electron_1.BrowserWindow.fromWebContents(event.sender);
        win?.setSize(Math.round(width), Math.round(height));
    });
    // Window Controls
    electron_1.ipcMain.handle('window:minimize', (event) => {
        const win = electron_1.BrowserWindow.fromWebContents(event.sender);
        win?.minimize();
    });
    electron_1.ipcMain.handle('window:maximize', (event) => {
        const win = electron_1.BrowserWindow.fromWebContents(event.sender);
        if (win?.isMaximized()) {
            win.unmaximize();
        }
        else {
            win?.maximize();
        }
    });
    electron_1.ipcMain.handle('window:close', (event) => {
        const win = electron_1.BrowserWindow.fromWebContents(event.sender);
        win?.close();
    });
}
//# sourceMappingURL=handlers.js.map