import { ipcMain, BrowserWindow } from 'electron';
import { taskRepository } from '../database/repositories/taskRepository';
import { projectRepository } from '../database/repositories/projectRepository';
import { sessionManager } from '../services/sessionManager';
import { archiveService } from '../services/archive';
import { analyticsService } from '../services/analytics';
import { recurringTaskRepository } from '../database/repositories/recurringTaskRepository';

export function registerHandlers() {
    // Run auto-archival on startup
    try {
        archiveService.autoArchiveTasks();
    } catch (e) {
        console.error('Auto-archival failed on startup:', e);
    }

    // Tasks
    ipcMain.handle('tasks:create', (_, task) => taskRepository.createTask(task));
    ipcMain.handle('tasks:get-all', (_, filter) => taskRepository.getAllTasks(filter));
    ipcMain.handle('tasks:update', (_, { id, updates }) => taskRepository.updateTask(id, updates));
    ipcMain.handle('tasks:complete', (_, id) => taskRepository.completeTask(id));
    ipcMain.handle('tasks:delete', (_, id) => taskRepository.deleteTask(id));
    ipcMain.handle('tasks:reorder', (_, ids) => taskRepository.reorderTasks(ids));

    // Subtasks
    ipcMain.handle('subtasks:add', (_, { taskId, title }) => taskRepository.addSubtask(taskId, title));
    ipcMain.handle('subtasks:toggle', (_, { id, isCompleted }) => taskRepository.toggleSubtask(id, isCompleted));
    ipcMain.handle('subtasks:delete', (_, id) => taskRepository.deleteSubtask(id));

    // Projects
    ipcMain.handle('projects:create', (_, project) => projectRepository.createProject(project));
    ipcMain.handle('projects:get-all', (_, status) => projectRepository.getAllProjects(status));
    ipcMain.handle('projects:update', (_, { id, updates }) => projectRepository.updateProject(id, updates));
    ipcMain.handle('projects:delete', (_, id) => projectRepository.deleteProject(id));

    // Sessions
    ipcMain.handle('session:start', (_, taskId) => sessionManager.startSession(taskId));
    ipcMain.handle('session:stop', (_, taskId) => sessionManager.stopSession(taskId));
    ipcMain.handle('session:get-active', () => sessionManager.getActiveSession());

    // Analytics & Archive
    ipcMain.handle('analytics:get-daily', (_, days) => analyticsService.getDailyStats(days));
    ipcMain.handle('archive:get-all', (_, { type, date }) => archiveService.getArchivedTasks(type, date));
    ipcMain.handle('archive:run', () => archiveService.archiveTasks());

    // Recurring Tasks
    ipcMain.handle('recurring:get-all', () => recurringTaskRepository.getAll());
    ipcMain.handle('recurring:create', (_, task) => recurringTaskRepository.create(task));
    ipcMain.handle('recurring:delete', (_, id) => recurringTaskRepository.delete(id));

    // Window Management
    ipcMain.handle('window:set-mode', (event, mode: 'normal' | 'mini' | 'flash') => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) return;

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
            } else {
                // From Normal -> Mini: Just resize, let user move it. Or set top-right.
                win.setSize(width, height);
            }
            win.setAlwaysOnTop(true, 'screen-saver');
        } else if (mode === 'flash') {
            // Target size: 300x500
            const width = 300;
            const height = 500;

            // From Mini -> Flash: Anchor Bottom Center (Grow Up)
            const newX = Math.round(bounds.x + (bounds.width - width) / 2);
            const newY = bounds.y + bounds.height - height;
            win.setBounds({ x: newX, y: newY, width, height });
            win.setAlwaysOnTop(true, 'screen-saver');
        } else {
            // Normal
            win.setSize(1200, 800);
            win.setAlwaysOnTop(false);
            win.center();
        }
    });
    // Window Resize
    ipcMain.handle('window:resize', (event, { width, height }) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        win?.setSize(Math.round(width), Math.round(height));
    });

    // Window Controls
    ipcMain.handle('window:minimize', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        win?.minimize();
    });
    ipcMain.handle('window:maximize', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win?.isMaximized()) {
            win.unmaximize();
        } else {
            win?.maximize();
        }
    });
    ipcMain.handle('window:close', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        win?.close();
    });
}
