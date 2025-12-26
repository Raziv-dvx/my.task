"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectRepository = exports.ProjectRepository = void 0;
const db_1 = require("../db");
const crypto_1 = require("crypto");
class ProjectRepository {
    get db() {
        return db_1.dbManager.getInstance();
    }
    createProject(project) {
        const id = (0, crypto_1.randomUUID)();
        const stmt = this.db.prepare(`
            INSERT INTO projects (id, name, description, deadline, status)
            VALUES (@id, @name, @description, @deadline, @status)
        `);
        stmt.run({
            ...project,
            description: project.description ?? null,
            deadline: project.deadline ?? null,
            id
        });
        return this.getProjectById(id);
    }
    getProjectById(id) {
        return this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    }
    getAllProjects(status) {
        if (status) {
            return this.db.prepare('SELECT * FROM projects WHERE status = ? ORDER BY created_at DESC').all(status);
        }
        return this.db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
    }
    updateProject(id, updates) {
        const keys = Object.keys(updates).filter(k => k !== 'id');
        if (keys.length === 0)
            return this.getProjectById(id);
        const setClause = keys.map(k => `${k} = @${k}`).join(', ');
        const stmt = this.db.prepare(`UPDATE projects SET ${setClause} WHERE id = @id`);
        stmt.run({ ...updates, id });
        return this.getProjectById(id);
    }
    deleteProject(id) {
        // Cascade delete handled by SQLite schema for milestones
        // But tasks we might want to just nullify project_id or cascade delete depending on requirements.
        // Schema says: tasks -> project_id REFERENCES projects(id). By default restrict?
        // Let's set task project_id to NULL if project is deleted.
        this.db.prepare('UPDATE tasks SET project_id = NULL WHERE project_id = ?').run(id);
        this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    }
}
exports.ProjectRepository = ProjectRepository;
exports.projectRepository = new ProjectRepository();
//# sourceMappingURL=projectRepository.js.map