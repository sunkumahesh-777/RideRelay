require('dotenv').config({ quiet: true });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { projectNormalizedState } = require('../postgres-projector');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. See backend/.env.example.');
  process.exit(1);
}

const dbPath = path.resolve(__dirname, '..', 'data', 'riderelay-db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'require' ? { rejectUnauthorized: false } : false
});

projectNormalizedState(pool, db)
  .then((result) => console.log(JSON.stringify(result, null, 2)))
  .catch((error) => {
    console.error('Database projection failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
