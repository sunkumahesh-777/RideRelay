const fs = require('fs');
const path = require('path');
const {
  readDb,
  writeDb,
  createId,
  now,
  audit
} = require('./db');

const appPath = path.join(__dirname, '..', 'src', 'App.jsx');

function normalize(value = '') {
  return String(value).trim().toLowerCase();
}

function getSearchText(location) {
  return normalize(`${location.name} ${location.area} ${location.type} ${location.pickupHint} ${location.city || ''}`);
}

function enrichLocationRecord(location, index) {
  return {
    id: location.id || createId('LOC'),
    name: location.name,
    area: location.area,
    type: location.type,
    pickupHint: location.pickupHint,
    lat: Number(location.lat),
    lng: Number(location.lng),
    city: location.city || 'Hyderabad',
    status: location.status || 'active',
    safetyRadiusMeters: Number(location.safetyRadiusMeters) || 500,
    source: location.source || 'RideRelay seed library',
    priority: Number(location.priority) || index + 1,
    createdAt: location.createdAt || now(),
    updatedAt: now()
  };
}

function extractSeedLocationsFromFrontend() {
  const appSource = fs.readFileSync(appPath, 'utf8');
  const match = appSource.match(/(?:const|let)\s+locationLibrary\s*=\s*(\[[\s\S]*?\n\]);/);

  if (!match) {
    return [];
  }

  return Function(`"use strict"; return ${match[1]};`)();
}

function getMetroExitPins(location, startPriority) {
  const exitDefinitions = [
    {
      suffix: 'Entry Exit 1',
      hint: 'Exit 1 - left side footpath pickup',
      latOffset: 0.00018,
      lngOffset: -0.00018
    },
    {
      suffix: 'Entry Exit 2',
      hint: 'Exit 2 - right side footpath pickup',
      latOffset: 0.00018,
      lngOffset: 0.00018
    },
    {
      suffix: 'Entry Exit 3',
      hint: 'Exit 3 - opposite road left pickup',
      latOffset: -0.00018,
      lngOffset: -0.00018
    },
    {
      suffix: 'Entry Exit 4',
      hint: 'Exit 4 - opposite road right pickup',
      latOffset: -0.00018,
      lngOffset: 0.00018
    }
  ];

  return exitDefinitions.map((exit, index) => enrichLocationRecord({
    id: createId('LOC'),
    name: `${location.name} ${exit.suffix}`,
    area: location.area,
    type: 'Metro Exit',
    pickupHint: exit.hint,
    lat: Number((Number(location.lat) + exit.latOffset).toFixed(6)),
    lng: Number((Number(location.lng) + exit.lngOffset).toFixed(6)),
    city: location.city || 'Hyderabad',
    status: 'active',
    safetyRadiusMeters: 250,
    source: `RideRelay generated metro exit pins from ${location.name}`,
    priority: startPriority + index
  }, startPriority + index));
}

function ensureMetroExitPins(db) {
  db.locations = Array.isArray(db.locations) ? db.locations : [];

  const existingKeys = new Set(db.locations.map((location) => (
    normalize(`${location.name}|${location.area}|${location.pickupHint}`)
  )));
  const metroStations = db.locations.filter((location) => normalize(location.type) === 'metro');
  const nextPins = [];

  metroStations.forEach((station) => {
    getMetroExitPins(station, db.locations.length + nextPins.length + 1).forEach((pin) => {
      const key = normalize(`${pin.name}|${pin.area}|${pin.pickupHint}`);

      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        nextPins.push(pin);
      }
    });
  });

  if (!nextPins.length) {
    return false;
  }

  db.locations.push(...nextPins);
  audit(db, 'locations.metro_exits_seeded', {
    metroStations: metroStations.length,
    addedPins: nextPins.length
  });
  return true;
}

function ensureLocationRecords() {
  const db = readDb();

  if (Array.isArray(db.locations) && db.locations.length) {
    if (ensureMetroExitPins(db)) {
      writeDb(db);
    }

    return db.locations;
  }

  const seedLocations = extractSeedLocationsFromFrontend()
    .map((location, index) => enrichLocationRecord(location, index));

  db.locations = seedLocations;
  ensureMetroExitPins(db);
  audit(db, 'locations.seeded', { count: seedLocations.length });
  writeDb(db);

  return seedLocations;
}

function loadLocations() {
  return ensureLocationRecords()
    .filter((location) => location.status !== 'inactive')
    .map((location) => ({
      ...location,
      searchText: getSearchText(location)
    }));
}

function getDistanceKm(from, to) {
  if (!from || !to) {
    return null;
  }

  const earthRadiusKm = 6371;
  const latDistance = ((to.lat - from.lat) * Math.PI) / 180;
  const lngDistance = ((to.lng - from.lng) * Math.PI) / 180;
  const startLat = (from.lat * Math.PI) / 180;
  const endLat = (to.lat * Math.PI) / 180;
  const a = Math.sin(latDistance / 2) ** 2
    + Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDistance / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function filterLocations({ search = '', category = 'All', nearLat, nearLng, radiusMeters, limit } = {}) {
  const searchText = normalize(search);
  const categoryText = normalize(category);
  const hasNearPoint = nearLat !== undefined
    && nearLat !== null
    && nearLat !== ''
    && nearLng !== undefined
    && nearLng !== null
    && nearLng !== ''
    && Number.isFinite(Number(nearLat))
    && Number.isFinite(Number(nearLng));
  const nearPoint = hasNearPoint ? { lat: Number(nearLat), lng: Number(nearLng) } : null;
  const maxMeters = Number(radiusMeters) || 0;

  let locations = loadLocations()
    .filter((location) => {
      const matchesSearch = !searchText || location.searchText.includes(searchText);
      const matchesCategory = categoryText === 'all' || normalize(location.type) === categoryText;

      return matchesSearch && matchesCategory;
    })
    .map((location) => {
      if (!nearPoint) {
        return location;
      }

      return {
        ...location,
        distanceMeters: Math.round((getDistanceKm(nearPoint, location) ?? 0) * 1000)
      };
    });

  if (nearPoint && maxMeters) {
    locations = locations.filter((location) => location.distanceMeters <= maxMeters);
  }

  if (nearPoint) {
    locations = locations.sort((a, b) => a.distanceMeters - b.distanceMeters);
  } else {
    locations = locations.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  }

  return locations
    .slice(0, Number(limit) || locations.length)
    .map(({ searchText: _searchText, ...location }) => location);
}

function createLocation(body) {
  const missing = ['name', 'area', 'type', 'pickupHint', 'lat', 'lng']
    .filter((field) => !String(body[field] ?? '').trim());

  if (missing.length) {
    return { error: 'Missing required location fields', missing };
  }

  const db = readDb();
  db.locations = Array.isArray(db.locations) ? db.locations : [];

  const location = enrichLocationRecord({
    ...body,
    id: createId('LOC'),
    source: body.source || 'RideRelay admin entry'
  }, db.locations.length);

  db.locations.push(location);
  audit(db, 'locations.created', { locationId: location.id, name: location.name });
  writeDb(db);

  return { location };
}

function updateLocation(locationId, body) {
  const db = readDb();
  const locations = Array.isArray(db.locations) ? db.locations : [];
  const index = locations.findIndex((location) => String(location.id) === String(locationId));

  if (index === -1) {
    return { error: 'Location not found' };
  }

  const nextLocation = {
    ...locations[index],
    ...body,
    id: locations[index].id,
    lat: body.lat === undefined ? locations[index].lat : Number(body.lat),
    lng: body.lng === undefined ? locations[index].lng : Number(body.lng),
    updatedAt: now()
  };

  locations[index] = nextLocation;
  db.locations = locations;
  audit(db, 'locations.updated', { locationId: nextLocation.id, name: nextLocation.name });
  writeDb(db);

  return { location: nextLocation };
}

module.exports = {
  loadLocations,
  filterLocations,
  getDistanceKm,
  createLocation,
  updateLocation
};
