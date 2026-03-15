const fs = require("fs");
const path = require("path");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

/**
 * Run all pending migrations in order.
 * Each migration file exports { up(db) }.
 */
function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(
    db
      .prepare("SELECT version FROM schema_migrations ORDER BY version")
      .all()
      .map((row) => row.version)
  );

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return;
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{3}_.*\.js$/.test(f))
    .sort();

  for (const file of files) {
    const version = parseInt(file.slice(0, 3), 10);
    if (applied.has(version)) continue;

    const migration = require(path.join(MIGRATIONS_DIR, file));
    const name = file.replace(/\.js$/, "");

    console.log(`[migrate] Applying ${name}...`);
    db.transaction(() => {
      migration.up(db);
      db.prepare(
        "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)"
      ).run(version, name, new Date().toISOString());
    })();
    console.log(`[migrate] Applied ${name}`);
  }
}

module.exports = { runMigrations };
