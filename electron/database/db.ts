import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

const dbPath = process.env.VITE_DEV_SERVER_URL
    ? path.join(__dirname, '../../task-manager.db')
    : path.join(app.getPath('userData'), 'task-manager.db');

export class DatabaseManager {
    private db: Database.Database;

    constructor() {
        this.db = new Database(dbPath);
        this.init();
    }

    private init() {
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');

        this.runMigrations();
    }

    private runMigrations() {
        const schemaPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf-8');
            const statements = schema.split(';').filter((stmt) => stmt.trim() !== '');

            this.db.transaction(() => {
                for (const stmt of statements) {
                    this.db.exec(stmt);
                }
            })();

            // Manual migrations for new columns
            try {
                this.db.exec("ALTER TABLE tasks ADD COLUMN category TEXT CHECK(category IN ('inbox', 'today', 'week', 'month')) DEFAULT 'inbox'");
            } catch (e) { }
            try {
                this.db.exec("ALTER TABLE tasks ADD COLUMN is_locked INTEGER DEFAULT 0");
            } catch (e) { }
            try {
                this.db.exec("ALTER TABLE tasks ADD COLUMN timer_elapsed INTEGER DEFAULT 0");
            } catch (e) { }
            try {
                this.db.exec("ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0");
            } catch (e) { }

        } else {
            console.error('Schema file not found at:', schemaPath);
        }
    }

    public getInstance() {
        return this.db;
    }
}

export const dbManager = new DatabaseManager();
