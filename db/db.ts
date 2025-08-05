// db.ts
import Database from 'better-sqlite3';

const db = new Database('data.db'); // Will create data.db in project root

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    calorie_goal INTEGER DEFAULT 0
  );
`);

export default db;
