require('dotenv').config({ quiet: true });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. See backend/.env.example.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.PGSSL === 'require' ? { rejectUnauthorized: false } : false
});

async function runSqlFile(key, filePath) {
  const applied = await pool.query(
    'SELECT 1 FROM schema_migrations WHERE migration_key = $1',
    [key]
  );

  if (applied.rows.length) {
    console.log(`Skipped ${key} (already applied)`);
    return;
  }

  const sql = fs.readFileSync(filePath, 'utf8');
  if (sql.trim()) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (migration_key) VALUES ($1)',
        [key]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    console.log(`Applied ${path.relative(process.cwd(), filePath)}`);
  }
}

async function migrate() {
  const databaseDir = path.resolve(__dirname, '..', '..', 'database');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_key VARCHAR(200) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await runSqlFile('000_schema', path.join(databaseDir, 'schema.sql'));

  const migrationsDir = path.join(databaseDir, 'migrations');
  const migrations = fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const migration of migrations) {
    await runSqlFile(`migration:${migration}`, path.join(migrationsDir, migration));
  }

  const seedDir = path.join(databaseDir, 'seed');
  const seeds = fs.readdirSync(seedDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const seed of seeds) {
    await runSqlFile(`seed:${seed}`, path.join(seedDir, seed));
  }
}

migrate()
  .then(() => console.log('RideRelay database migration complete.'))
  .catch((error) => {
    console.error('Database migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
