// db.ts
import Database from 'better-sqlite3';
import { runMigrations } from './migrate';

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

db.exec(`
  CREATE TABLE IF NOT EXISTS food_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    calories INTEGER,
    protein INTEGER,
    fat INTEGER,
    carbs INTEGER
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

runMigrations(db);

export default db;
