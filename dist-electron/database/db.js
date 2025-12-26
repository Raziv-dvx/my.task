"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbManager = exports.DatabaseManager = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const electron_1 = require("electron");
const dbPath = process.env.VITE_DEV_SERVER_URL
    ? path_1.default.join(__dirname, '../../task-manager.db')
    : path_1.default.join(electron_1.app.getPath('userData'), 'task-manager.db');
class DatabaseManager {
    db;
    constructor() {
        this.db = new better_sqlite3_1.default(dbPath);
        this.init();
    }
    init() {
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        this.runMigrations();
    }
    runMigrations() {
        const schemaPath = path_1.default.join(__dirname, 'schema.sql');
        if (fs_1.default.existsSync(schemaPath)) {
            const schema = fs_1.default.readFileSync(schemaPath, 'utf-8');
            const statements = schema.split(';').filter((stmt) => stmt.trim() !== '');
            this.db.transaction(() => {
                for (const stmt of statements) {
                    this.db.exec(stmt);
                }
            })();
            // Manual migrations for new columns
            try {
                this.db.exec("ALTER TABLE tasks ADD COLUMN category TEXT CHECK(category IN ('inbox', 'today', 'week', 'month')) DEFAULT 'inbox'");
            }
            catch (e) { }
            try {
                this.db.exec("ALTER TABLE tasks ADD COLUMN is_locked INTEGER DEFAULT 0");
            }
            catch (e) { }
            try {
                this.db.exec("ALTER TABLE tasks ADD COLUMN timer_elapsed INTEGER DEFAULT 0");
            }
            catch (e) { }
            try {
                this.db.exec("ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0");
            }
            catch (e) { }
        }
        else {
            console.error('Schema file not found at:', schemaPath);
        }
    }
    getInstance() {
        return this.db;
    }
}
exports.DatabaseManager = DatabaseManager;
exports.dbManager = new DatabaseManager();
//# sourceMappingURL=db.js.map