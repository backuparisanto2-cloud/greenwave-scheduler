const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const DATA_DIR = path.join(__dirname, "..", "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const SESSION_DIR = path.join(DATA_DIR, "wa-session");

for (const dir of [DATA_DIR, UPLOAD_DIR, SESSION_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(path.join(DATA_DIR, "scheduler.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  repeat_mode TEXT NOT NULL DEFAULT 'once',      -- once | daily | weekly | monthly
  weekdays TEXT NOT NULL DEFAULT '',             -- "1,3,5" for weekly (0=Sun)
  month_day INTEGER,                             -- 1..31 for monthly
  run_at TEXT NOT NULL,                          -- next run, local time "YYYY-MM-DD HH:mm"
  end_date TEXT,                                 -- optional "YYYY-MM-DD"
  status TEXT NOT NULL DEFAULT 'pending',        -- pending | sent | failed | done | paused
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS schedule_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL DEFAULT 'number',    -- number | group
  target_value TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS send_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id INTEGER,
  target TEXT NOT NULL,
  status TEXT NOT NULL,                          -- sent | failed
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_schedules_runat ON schedules(status, run_at);
`);

const DEFAULT_EMAIL = process.env.ADMIN_EMAIL || "arisanto@mentarisatria.net.id";
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || "Backmeup2023";

function seedAdmin() {
  const count = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
  if (count === 0) {
    db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(
      DEFAULT_EMAIL.toLowerCase(),
      bcrypt.hashSync(DEFAULT_PASSWORD, 10),
    );
    console.log(`[db] admin user dibuat: ${DEFAULT_EMAIL}`);
  }
}
seedAdmin();

module.exports = { db, DATA_DIR, UPLOAD_DIR, SESSION_DIR };
