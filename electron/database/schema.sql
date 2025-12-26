CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT, -- Markdown
    status TEXT CHECK(status IN ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE')),
    priority TEXT CHECK(priority IN ('P1', 'P2', 'P3', 'P4')),
    due_date TEXT, -- ISO8601
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    project_id TEXT REFERENCES projects(id),
    estimated_duration INTEGER, -- Minutes
    actual_duration INTEGER DEFAULT 0, -- Minutes
    category TEXT CHECK(category IN ('inbox', 'today', 'week', 'month')) DEFAULT 'inbox',
    is_locked INTEGER DEFAULT 0,
    timer_elapsed INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS subtasks (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    deadline TEXT,
    status TEXT CHECK(status IN ('ACTIVE', 'COMPLETED')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT
);

CREATE TABLE IF NOT EXISTS project_milestones (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_date TEXT,
    is_completed INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES tasks(id),
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration_seconds INTEGER -- Calculated on completion
);

-- Read-only Archives
CREATE TABLE IF NOT EXISTS task_archive (
    id TEXT PRIMARY KEY,
    original_data JSON, -- Full snapshot
    archived_date TEXT, -- Grouping key
    project_id TEXT
);

CREATE TABLE IF NOT EXISTS project_archive (
    id TEXT PRIMARY KEY,
    original_data JSON,
    archived_date TEXT
);

CREATE TABLE IF NOT EXISTS analytics_daily (
    date TEXT PRIMARY KEY, -- YYYY-MM-DD
    tasks_completed INTEGER DEFAULT 0,
    total_focus_time INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recurring_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK(priority IN ('P1', 'P2', 'P3', 'P4')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
