require('dotenv').config({ quiet: true });

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.log(JSON.stringify({
    connected: false,
    driver: 'json',
    message: 'DATABASE_URL is not configured; RideRelay is using the local JSON fallback.'
  }, null, 2));
  process.exit(0);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'require' ? { rejectUnauthorized: false } : false
});

pool.query(`
  SELECT
    current_database() AS database_name,
    NOW() AS checked_at,
    (SELECT COUNT(*)::int FROM information_schema.tables WHERE table_schema = 'public') AS table_count
`)
  .then(({ rows }) => {
    console.log(JSON.stringify({
      connected: true,
      driver: 'postgresql',
      ...rows[0]
    }, null, 2));
  })
  .catch((error) => {
    console.error(JSON.stringify({
      connected: false,
      driver: 'postgresql',
      error: error.message
    }, null, 2));
    process.exitCode = 1;
  })
  .finally(() => pool.end());
