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

Promise.all([
  pool.query(`
    SELECT
      current_database() AS database_name,
      NOW() AS checked_at,
      (SELECT COUNT(*)::int FROM information_schema.tables WHERE table_schema = 'public') AS table_count
  `),
  pool.query(`
    SELECT projected_at, record_counts
    FROM projection_status
    WHERE projection_key = 'primary'
  `).catch(() => ({ rows: [] }))
])
  .then(([databaseResult, projectionResult]) => {
    console.log(JSON.stringify({
      connected: true,
      driver: 'postgresql',
      ...databaseResult.rows[0],
      projection: projectionResult.rows[0] || {
        projected: false,
        message: 'No normalized projection found. Run migrations and start the API.'
      }
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
