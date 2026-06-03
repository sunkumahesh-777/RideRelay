const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'riderelay-db.json');

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
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
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
      password: 'demo123',
      status: 'verified',
      createdAt: now()
    },
    {
      id: captainUserId,
      role: 'captain',
      fullName: 'Rahul Captain',
      email: 'rahul.captain@riderelay.in',
      phone: '+91 90000 12345',
      password: 'captain123',
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
  readDb,
  writeDb,
  createId,
  now,
  audit,
  seedDb
};
