/**
 * Migration Runner
 * Reads SQL files from src/db/migrations/ and executes them in order.
 * Tracks applied migrations in the _migrations table.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool, { query } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(255) UNIQUE NOT NULL,
      applied_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations() {
  const result = await query('SELECT name FROM _migrations ORDER BY id');
  return result.rows.map((row) => row.name);
}

async function runMigrations() {
  console.log('🚀 Running migrations...\n');

  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let ranCount = 0;

  for (const file of files) {
    if (applied.includes(file)) {
      console.log(`  ⏭  ${file} (already applied)`);
      continue;
    }

    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
      await query('BEGIN');
      await query(sql);
      await query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await query('COMMIT');
      console.log(`  ✅ ${file}`);
      ranCount++;
    } catch (err) {
      await query('ROLLBACK');
      console.error(`  ❌ ${file} failed:`, err.message);
      process.exit(1);
    }
  }

  console.log(`\n📋 ${ranCount} migration(s) applied, ${applied.length} already up to date.`);
}

async function runSeed() {
  console.log('\n🌱 Running seed data...\n');

  const seedPath = path.join(__dirname, 'seed.sql');
  if (!fs.existsSync(seedPath)) {
    console.log('  ⚠️  No seed.sql found, skipping.');
    return;
  }

  const sql = fs.readFileSync(seedPath, 'utf-8');

  try {
    await query(sql);
    console.log('  ✅ Seed data inserted successfully.');
  } catch (err) {
    console.error('  ❌ Seed failed:', err.message);
  }
}

// Main
const command = process.argv[2];

try {
  if (command === 'seed') {
    await runSeed();
  } else if (command === 'fresh') {
    // Drop all tables and re-run
    console.log('🗑️  Dropping all tables...\n');
    await query(`
      DROP TABLE IF EXISTS session CASCADE;
      DROP TABLE IF EXISTS oauth_accounts CASCADE;
      DROP TABLE IF EXISTS posts CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS _migrations CASCADE;
    `);
    console.log('  ✅ All tables dropped.\n');
    await runMigrations();
    await runSeed();
  } else {
    await runMigrations();
  }
} catch (err) {
  console.error('Fatal error:', err);
  process.exit(1);
} finally {
  await pool.end();
  console.log('\n✨ Done.');
}
