"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const db_1 = require("../database/db");
class AnalyticsService {
    get db() {
        return db_1.dbManager.getInstance();
    }
    incrementTaskCompletion() {
        const today = new Date().toISOString().split('T')[0];
        this.db.prepare(`
            INSERT INTO analytics_daily (date, tasks_completed, total_focus_time)
            VALUES (?, 1, 0)
            ON CONFLICT(date) DO UPDATE SET tasks_completed = tasks_completed + 1
        `).run(today);
    }
    addFocusTime(minutes) {
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
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
//# sourceMappingURL=analytics.js.map