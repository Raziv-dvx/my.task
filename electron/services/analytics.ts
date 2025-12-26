import { dbManager } from '../database/db';

export class AnalyticsService {
    get db() {
        return dbManager.getInstance();
    }

    incrementTaskCompletion() {
        const today = new Date().toISOString().split('T')[0];
        this.db.prepare(`
            INSERT INTO analytics_daily (date, tasks_completed, total_focus_time)
            VALUES (?, 1, 0)
            ON CONFLICT(date) DO UPDATE SET tasks_completed = tasks_completed + 1
        `).run(today);
    }

    addFocusTime(minutes: number) {
        const today = new Date().toISOString().split('T')[0];
        this.db.prepare(`
            INSERT INTO analytics_daily (date, tasks_completed, total_focus_time)
            VALUES (?, 0, ?)
            ON CONFLICT(date) DO UPDATE SET total_focus_time = total_focus_time + ?
        `).run(today, minutes, minutes);
    }

    getDailyStats(days = 7) {
        return this.db.prepare(`
            SELECT * FROM analytics_daily 
            ORDER BY date DESC 
            LIMIT ?
        `).all(days);
    }
}

export const analyticsService = new AnalyticsService();
