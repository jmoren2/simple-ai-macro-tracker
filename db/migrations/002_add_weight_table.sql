CREATE TABLE IF NOT EXISTS weight_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    weight REAL NOT NULL
  );
CREATE UNIQUE INDEX IF NOT EXISTS idx_weight_logs_user_date
ON weight_logs (user_id, date);
