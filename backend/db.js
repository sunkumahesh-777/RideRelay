const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { projectNormalizedState } = require('./postgres-projector');
const { readNormalizedState } = require('./postgres-reader');

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'riderelay-db.json');
const databaseUrl = process.env.DATABASE_URL || '';
const databaseReadMode = process.env.DB_READ_MODE === 'normalized' ? 'normalized' : 'compatibility';
let cachedDb = null;
let postgresPool = null;
let persistenceQueue = Promise.resolve();

const initialDb = {
  users: [],
  riders: [],
  captains: [],
  captainRoutes: [],
  rideRequests: [],
  locations: [],
  payments: [],
  reviews: [],
  auditLogs: []
};

function ensureDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    writeDb(initialDb);
  }
}

function readDb() {
  ensureDb();
  if (!cachedDb) {
    cachedDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }
  return cachedDb;
}

function writeDb(db) {
  cachedDb = db;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

  if (postgresPool) {
    const operation = persistenceQueue.then(async () => {
      await postgresPool.query(
          `INSERT INTO app_state (state_key, payload, updated_at)
           VALUES ('primary', $1::jsonb, NOW())
           ON CONFLICT (state_key)
           DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
          [JSON.stringify(db)]
        );
      return projectNormalizedState(postgresPool, db);
    });
    persistenceQueue = operation.catch((error) => {
      console.error('PostgreSQL persistence failed:', error.message);
    });
    return operation;
  }

  return Promise.resolve();
}

async function initializeDb() {
  ensureDb();

  if (!databaseUrl) {
    cachedDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    return { driver: 'json', connected: true, readMode: 'compatibility' };
  }

  const { Pool } = require('pg');
  postgresPool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.PGSSL === 'require' ? { rejectUnauthorized: false } : false
  });

  await postgresPool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      state_key VARCHAR(80) PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const result = await postgresPool.query(
    `SELECT payload FROM app_state WHERE state_key = 'primary'`
  );

  if (result.rows.length) {
    cachedDb = result.rows[0].payload;
    fs.writeFileSync(dbPath, JSON.stringify(cachedDb, null, 2));
  } else {
    cachedDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    await postgresPool.query(
      `INSERT INTO app_state (state_key, payload) VALUES ('primary', $1::jsonb)`,
      [JSON.stringify(cachedDb)]
    );
  }

  const projection = await projectNormalizedState(postgresPool, cachedDb);
  if (databaseReadMode === 'normalized') {
    cachedDb = await readNormalizedState(postgresPool);
    fs.writeFileSync(dbPath, JSON.stringify(cachedDb, null, 2));
  }

  return {
    driver: 'postgresql',
    connected: true,
    readMode: databaseReadMode,
    projection
  };
}

async function flushDb() {
  await persistenceQueue;
}

async function closeDb() {
  await flushDb();
  if (postgresPool) {
    await postgresPool.end();
    postgresPool = null;
  }
}

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function now() {
  return new Date().toISOString();
}

function audit(db, action, payload = {}) {
  db.auditLogs.unshift({
    id: createId('LOG'),
    action,
    payload,
    createdAt: now()
  });
  db.auditLogs = db.auditLogs.slice(0, 200);
}

function hashSeedPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return {
    passwordHash: crypto
      .pbkdf2Sync(String(password), salt, 120000, 64, 'sha512')
      .toString('hex'),
    passwordSalt: salt
  };
}

function seedDb() {
  const db = readDb();

  if (db.users.length) {
    return db;
  }

  const riderUserId = createId('USR');
  const captainUserId = createId('USR');
  const riderId = createId('RID');
  const captainId = createId('CAP');
  const routeId = createId('ROUTE');

  db.users.push(
    {
      id: riderUserId,
      role: 'rider',
      fullName: 'Ananya Rao',
      email: 'ananya@riderelay.in',
      phone: '+91 98765 43210',
      ...hashSeedPassword('demo123'),
      status: 'verified',
      createdAt: now()
    },
    {
      id: captainUserId,
      role: 'captain',
      fullName: 'Rahul Captain',
      email: 'rahul.captain@riderelay.in',
      phone: '+91 90000 12345',
      ...hashSeedPassword('captain123'),
      status: 'verified',
      createdAt: now()
    }
  );

  db.riders.push({
    id: riderId,
    userId: riderUserId,
    fullName: 'Ananya Rao',
    homeStop: 'Ameerpet',
    gender: 'Female',
    emergencyContact: '+91 91234 56780',
    verificationStatus: 'phone-verified',
    createdAt: now()
  });

  db.captains.push({
    id: captainId,
    userId: captainUserId,
    fullName: 'Rahul Captain',
    gender: 'Male',
    vehicleType: 'Bike',
    vehicleNumber: 'TS09 RR 2045',
    licenseNumber: 'DL-TS-2026-2045',
    verificationStatus: 'kyc-verified',
    bank: {
      accountHolder: 'Rahul Captain',
      bankName: 'RideRelay Partner Bank',
      accountNumber: 'XXXXXX2045',
      ifsc: 'RRLY0002045',
      upiId: 'rahul@upi',
      qrFileName: '',
      qrMimeType: '',
      qrDataUrl: ''
    },
    dashboard: {
      targetPeriod: 'day',
      targetAmount: 600,
      earnedAmount: 0,
      completedRiders: 0,
      totalRides: 0,
      rating: 4.2
    },
    createdAt: now()
  });

  db.captainRoutes.push({
    id: routeId,
    captainId,
    fromLocation: 'Ameerpet',
    toLocation: 'BHEL',
    vacantSeats: 2,
    distanceKm: 17.6,
    status: 'active',
    currentPin: 'Ameerpet',
    createdAt: now()
  });

  db.rideRequests.push({
    id: createId('REQ'),
    riderId,
    captainId,
    routeId,
    pickup: 'Ameerpet',
    destination: 'BHEL',
    hopPickup: 'Ameerpet',
    hopDestination: 'BHEL',
    fare: 88,
    distanceKm: 17.6,
    status: 'pending',
    captainMessage: '',
    createdAt: now()
  });

  audit(db, 'seed.created', { users: db.users.length });
  writeDb(db);
  return db;
}

module.exports = {
  initializeDb,
  flushDb,
  closeDb,
  readDb,
  writeDb,
  createId,
  now,
  audit,
  seedDb
};
