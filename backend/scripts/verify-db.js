require('dotenv').config({ quiet: true });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { readNormalizedState } = require('../postgres-reader');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. See backend/.env.example.');
  process.exit(1);
}

const localPath = path.resolve(__dirname, '..', 'data', 'riderelay-db.json');
const local = JSON.parse(fs.readFileSync(localPath, 'utf8'));
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'require' ? { rejectUnauthorized: false } : false
});

const collections = [
  'users',
  'riders',
  'captains',
  'captainRoutes',
  'rideRequests',
  'locations',
  'payments',
  'reviews',
  'auditLogs'
];

function compareCollection(name, localItems, postgresItems) {
  const localIds = new Set(localItems.map((item) => item.id));
  const postgresIds = new Set(postgresItems.map((item) => item.id));
  return {
    name,
    localCount: localItems.length,
    postgresCount: postgresItems.length,
    missingInPostgres: [...localIds].filter((id) => !postgresIds.has(id)),
    missingLocally: [...postgresIds].filter((id) => !localIds.has(id))
  };
}

readNormalizedState(pool)
  .then((postgres) => {
    const results = collections.map((name) => compareCollection(
      name,
      local[name] || [],
      postgres[name] || []
    ));
    const matches = results.every((result) => (
      result.localCount === result.postgresCount
      && !result.missingInPostgres.length
      && !result.missingLocally.length
    ));

    console.log(JSON.stringify({ matches, collections: results }, null, 2));
    if (!matches) process.exitCode = 1;
  })
  .catch((error) => {
    console.error('Database verification failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
