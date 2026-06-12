require('dotenv').config({ quiet: true });

const { spawnSync } = require('child_process');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. Use the Supabase session pooler connection string.');
  process.exit(1);
}

const steps = [
  ['db:migrate', 'Apply schema, migrations, and seed records'],
  ['db:project', 'Project RideRelay working data into normalized tables'],
  ['db:verify', 'Verify PostgreSQL and RideRelay records match'],
  ['db:status', 'Report final Supabase database status']
];

for (const [script, label] of steps) {
  console.log(`\n=== ${label} ===`);
  const npmExecutable = process.env.npm_execpath;
  const command = npmExecutable ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
  const args = npmExecutable ? [npmExecutable, 'run', script] : ['run', script];
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PGSSL: process.env.PGSSL || 'require',
      DB_READ_MODE: process.env.DB_READ_MODE || 'normalized'
    },
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    if (result.error) {
      console.error(result.error.message);
    }
    console.error(`Supabase deployment stopped during ${script}.`);
    process.exit(result.status || 1);
  }
}

console.log('\nRideRelay Supabase database automation completed successfully.');
