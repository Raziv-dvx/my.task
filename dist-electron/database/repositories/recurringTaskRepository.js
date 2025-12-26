"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recurringTaskRepository = exports.RecurringTaskRepository = void 0;
const db_1 = require("../db");
const crypto_1 = require("crypto");
class RecurringTaskRepository {
    db;
    constructor() {
        this.db = db_1.dbManager.getInstance();
    }
    getAll() {
        return this.db.prepare('SELECT * FROM recurring_tasks ORDER BY created_at DESC').all();
    }
    create(task) {
        const id = (0, crypto_1.randomUUID)();
        const created_at = new Date().toISOString();
        this.db.prepare(`
            INSERT INTO recurring_tasks (id, title, description, priority, created_at)
            VALUES (@id, @title, @description, @priority, @created_at)
        `).run({ ...task, id, created_at });
        return { ...task, id, created_at };
    }
    delete(id) {
        this.db.prepare('DELETE FROM recurring_tasks WHERE id = ?').run(id);
    }
}
exports.RecurringTaskRepository = RecurringTaskRepository;
exports.recurringTaskRepository = new RecurringTaskRepository();
//# sourceMappingURL=recurringTaskRepository.js.map