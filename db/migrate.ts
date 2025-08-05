import type { Database } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export function runMigrations(db: Database) {
    console.log('🔍 Checking migrations...');

    const migrationDir = path.join(process.cwd(), 'db', 'migrations');
    if (!fs.existsSync(migrationDir)) {
        console.log('⚠️ Migrations directory does not exist:', migrationDir);
        return;
    }

    const files = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql'));
    let ranAny = false;

    for (const file of files) {
        const alreadyRan = db.prepare(`SELECT 1 FROM migrations WHERE name = ?`).get(file);
        if (alreadyRan) continue;

        console.log(`🚀 Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
        db.exec(sql);
        db.prepare(`INSERT INTO migrations (name) VALUES (?)`).run(file);
        ranAny = true;
    }

    if (!ranAny) {
        console.log('✅ No migrations to run!');
    }
}
