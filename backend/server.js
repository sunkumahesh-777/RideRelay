require('dotenv').config({ quiet: true });

const http = require('http');
const { URL } = require('url');
const {
  initializeDb,
  flushDb,
  closeDb,
  readDb,
  writeDb,
  createId,
  now,
  audit,
  seedDb
} = require('./config/db');
const {
  loadLocations,
  filterLocations,
  getDistanceKm,
  createLocation,
  updateLocation
} = require('./locations');
const { cleanUser, findById, getRoleProfile } = require('./models/User');
const {
  hashPassword,
  verifyPassword,
  createAuthToken,
  getAuthenticatedUser,
  canManageProfile,
  getRequestAccess
} = require('./middleware/auth');
const {
  RATE_PER_KM,
  normalize,
  calculateFare,
  getRequestedSeats,
  SEAT_HOLDING_STATUSES,
  routeFitsRider,
  syncRouteVacantSeats
} = require('./services/rideService');
const { isPublicUserRoute } = require('./routes/userRoutes');
const { isPublicRideRoute } = require('./routes/rideRoutes');
const { updateCaptainProfile, updateRiderProfile } = require('./controllers/userController');
const { canTransitionRide } = require('./controllers/rideController');

const PORT = Number(process.env.PORT || 4000);
let storageStatus = { driver: 'starting', connected: false };

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  });
  res.end(JSON.stringify(data, null, 2));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) {
        reject(new Error('Request body is too large'));
      }
    });

    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
  });
}

function isPublicRoute(method, path) {
  return isPublicUserRoute(method, path) || isPublicRideRoute(method, path);
}

function findLocationByText(locations, value = '') {
  const searchText = normalize(value);

  if (!searchText) {
    return null;
  }

  return locations.find((location) => normalize(location.name) === searchText)
    || locations.find((location) => normalize(location.area) === searchText)
    || locations.find((location) => normalize(location.name).includes(searchText))
    || locations.find((location) => normalize(location.area).includes(searchText));
}

function getRouteDistanceDetails(from, to) {
  const locations = loadLocations();
  const fromLocation = findLocationByText(locations, from);
  const toLocation = findLocationByText(locations, to);
  const straightDistanceKm = getDistanceKm(fromLocation, toLocation);
  const distanceKm = straightDistanceKm === null ? null : Number((straightDistanceKm * 1.35).toFixed(1));

  return {
    from,
    to,
    fromHub: fromLocation ? {
      id: fromLocation.id,
      name: fromLocation.name,
      area: fromLocation.area,
      type: fromLocation.type,
      lat: fromLocation.lat,
      lng: fromLocation.lng
    } : null,
    toHub: toLocation ? {
      id: toLocation.id,
      name: toLocation.name,
      area: toLocation.area,
      type: toLocation.type,
      lat: toLocation.lat,
      lng: toLocation.lng
    } : null,
    distanceKm,
    distanceMeters: distanceKm === null ? null : Math.round(distanceKm * 1000),
    baseRatePerKm: RATE_PER_KM,
    estimatedFuelShare: distanceKm === null ? null : Math.max(10, Math.ceil(distanceKm * RATE_PER_KM)),
    source: distanceKm === null ? 'location-not-found' : 'RideRelay hub distance estimate'
  };
}

function enrichRequest(db, request) {
  const rider = findById(db.riders, request.riderId);
  const captain = findById(db.captains, request.captainId);
  const route = findById(db.captainRoutes, request.routeId);

  return {
    ...request,
    riderName: rider?.fullName || 'Rider',
    captainName: captain?.fullName || 'Captain',
    route
  };
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => !String(body[field] ?? '').trim());
  return missing;
}

function routeMatches(path, pattern) {
  const pathParts = path.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);

  if (pathParts.length !== patternParts.length) {
    return null;
  }

  return patternParts.reduce((params, part, index) => {
    if (params === null) {
      return null;
    }

    if (part.startsWith(':')) {
      return {
        ...params,
        [part.slice(1)]: pathParts[index]
      };
    }

    return part === pathParts[index] ? params : null;
  }, {});
}

async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const db = readDb();
  const authUser = isPublicRoute(req.method, path) ? null : getAuthenticatedUser(req, db);

  try {
    if (!isPublicRoute(req.method, path) && !authUser) {
      sendJson(res, 401, { error: 'Valid login token required' });
      return;
    }

    if (req.method === 'GET' && path === '/api/health') {
      sendJson(res, 200, {
        ok: true,
        service: 'RideRelay backend',
        storage: storageStatus,
        time: now()
      });
      return;
    }

    if (req.method === 'GET' && path === '/api/auth/me') {
      sendJson(res, 200, {
        user: cleanUser(authUser),
        profile: getRoleProfile(db, authUser)
      });
      return;
    }

    if (req.method === 'GET' && path === '/api/bootstrap') {
      sendJson(res, 200, {
        riders: db.riders,
        captains: db.captains,
        captainRoutes: db.captainRoutes,
        rideRequests: db.rideRequests,
        locations: loadLocations()
      });
      return;
    }

    if (req.method === 'GET' && path === '/api/locations') {
      sendJson(res, 200, {
        locations: filterLocations({
          search: url.searchParams.get('search') || '',
          category: url.searchParams.get('category') || 'All',
          nearLat: url.searchParams.get('nearLat'),
          nearLng: url.searchParams.get('nearLng'),
          radiusMeters: url.searchParams.get('radiusMeters'),
          limit: url.searchParams.get('limit')
        })
      });
      return;
    }

    if (req.method === 'POST' && path === '/api/locations') {
      if (authUser.role !== 'admin') {
        sendJson(res, 403, { error: 'Admin access required' });
        return;
      }

      const body = await parseBody(req);
      const result = createLocation(body);

      if (result.error) {
        sendJson(res, 400, result);
        return;
      }

      sendJson(res, 201, result);
      return;
    }

    const locationParams = routeMatches(path, '/api/locations/:id');

    if (locationParams && req.method === 'PATCH') {
      if (authUser.role !== 'admin') {
        sendJson(res, 403, { error: 'Admin access required' });
        return;
      }

      const body = await parseBody(req);
      const result = updateLocation(locationParams.id, body);

      if (result.error) {
        sendJson(res, 404, result);
        return;
      }

      sendJson(res, 200, result);
      return;
    }

    if (req.method === 'GET' && path === '/api/captain-routes') {
      const from = url.searchParams.get('from') || '';
      const to = url.searchParams.get('to') || '';
      db.captainRoutes.forEach((route) => syncRouteVacantSeats(db, route));
      const activeRoutes = db.captainRoutes
        .filter((route) => route.status === 'active')
        .filter((route) => !from || !to || routeFitsRider(route, from, to))
        .map((route) => ({
          ...route,
          captain: findById(db.captains, route.captainId),
          matchedFor: {
            pickup: from,
            destination: to
          }
        }));

      sendJson(res, 200, activeRoutes);
      return;
    }

    if (req.method === 'GET' && path === '/api/routes/distance') {
      const from = url.searchParams.get('from') || '';
      const to = url.searchParams.get('to') || '';

      if (!from || !to) {
        sendJson(res, 400, { error: 'from and to are required' });
        return;
      }

      const distanceDetails = getRouteDistanceDetails(from, to);

      if (distanceDetails.distanceKm === null) {
        sendJson(res, 404, {
          error: 'Location not found in RideRelay hubs',
          ...distanceDetails
        });
        return;
      }

      sendJson(res, 200, distanceDetails);
      return;
    }

    if (req.method === 'GET' && path === '/api/rider-routes/search') {
      const pickup = url.searchParams.get('pickup') || '';
      const destination = url.searchParams.get('destination') || '';
      const seats = Math.max(1, Number(url.searchParams.get('seats')) || 1);

      if (!pickup || !destination) {
        sendJson(res, 400, { error: 'pickup and destination are required' });
        return;
      }

      const routeDistance = getRouteDistanceDetails(pickup, destination);
      db.captainRoutes.forEach((route) => syncRouteVacantSeats(db, route));
      const candidateRoutes = db.captainRoutes
        .filter((route) => route.status === 'active')
        .filter((route) => Number(route.vacantSeats) >= seats)
        .filter((route) => routeFitsRider(route, pickup, destination))
        .map((route) => {
          const captain = findById(db.captains, route.captainId);
          const routeDetails = getRouteDistanceDetails(route.fromLocation, route.toLocation);

          return {
            routeId: route.id,
            captainId: route.captainId,
            captainName: captain?.fullName || 'Captain',
            fromLocation: route.fromLocation,
            toLocation: route.toLocation,
            vacantSeats: route.vacantSeats,
            distanceKm: routeDetails.distanceKm ?? route.distanceKm,
            fareEstimate: calculateFare(routeDistance.distanceKm ?? route.distanceKm, route.vacantSeats),
            matchType: normalize(route.fromLocation) === normalize(pickup)
              && normalize(route.toLocation) === normalize(destination)
              ? 'direct'
              : 'passing-through-hub',
            priorityScore: calculateFare(routeDistance.distanceKm ?? route.distanceKm, route.vacantSeats)
              + Math.max(0, Number(routeDetails.distanceKm ?? route.distanceKm) - Number(routeDistance.distanceKm ?? 0))
          };
        })
        .sort((a, b) => a.priorityScore - b.priorityScore);

      sendJson(res, 200, {
        pickup,
        destination,
        seats,
        routeDistance,
        matches: candidateRoutes,
        suggestion: candidateRoutes.length
          ? 'Matching captains found on this RideRelay hub route.'
          : 'No direct captain route found. Use multi-hop hubs or try nearby official pickup points.'
      });
      return;
    }

    if (req.method === 'POST' && path === '/api/auth/signup') {
      const body = await parseBody(req);
      const missing = requireFields(body, ['role', 'fullName', 'email', 'phone', 'password']);

      if (missing.length) {
        sendJson(res, 400, { error: 'Missing required fields', missing });
        return;
      }

      if (!['rider', 'captain'].includes(normalize(body.role))) {
        sendJson(res, 400, { error: 'Role must be rider or captain' });
        return;
      }

      if (db.users.some((user) => normalize(user.email) === normalize(body.email))) {
        sendJson(res, 409, { error: 'Email already exists' });
        return;
      }

      const user = {
        id: createId('USR'),
        role: normalize(body.role),
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        ...hashPassword(body.password),
        status: 'pending-verification',
        createdAt: now()
      };

      db.users.push(user);

      if (user.role === 'captain') {
        db.captains.push({
          id: createId('CAP'),
          userId: user.id,
          fullName: user.fullName,
          gender: body.gender || '',
          vehicleType: body.vehicleType || '',
          vehicleNumber: body.vehicleNumber || '',
          licenseNumber: body.licenseNumber || '',
          verificationStatus: 'kyc-pending',
          bank: {
            accountHolder: user.fullName,
            bankName: '',
            accountNumber: '',
            ifsc: '',
            upiId: body.upiId || '',
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
            rating: 0
          },
          createdAt: now()
        });
      } else {
        db.riders.push({
          id: createId('RID'),
          userId: user.id,
          fullName: user.fullName,
          homeStop: body.homeStop || '',
          gender: body.gender || '',
          emergencyContact: body.emergencyContact || '',
          verificationStatus: 'phone-pending',
          createdAt: now()
        });
      }

      audit(db, 'auth.signup', { userId: user.id, role: user.role });
      await writeDb(db);
      sendJson(res, 201, {
        token: createAuthToken(user),
        user: cleanUser(user),
        profile: getRoleProfile(db, user)
      });
      return;
    }

    if (req.method === 'POST' && path === '/api/auth/login') {
      const body = await parseBody(req);
      const user = db.users.find((item) => (
        normalize(item.email) === normalize(body.email)
      ));

      if (!user || !verifyPassword(body.password, user)) {
        sendJson(res, 401, { error: 'Invalid email or password' });
        return;
      }

      if (!user.passwordHash || !user.passwordSalt) {
        Object.assign(user, hashPassword(body.password));
        delete user.password;
      }

      audit(db, 'auth.login', { userId: user.id });
      await writeDb(db);
      sendJson(res, 200, {
        token: createAuthToken(user),
        user: cleanUser(user),
        profile: getRoleProfile(db, user)
      });
      return;
    }

    const captainProfileParams = routeMatches(path, '/api/captains/:captainId/profile');

    if (captainProfileParams && req.method === 'GET') {
      if (!canManageProfile(db, authUser, 'captain', captainProfileParams.captainId)) {
        sendJson(res, 403, { error: 'Captain profile access denied' });
        return;
      }

      const captain = findById(db.captains, captainProfileParams.captainId);
      sendJson(res, captain ? 200 : 404, captain || { error: 'Captain not found' });
      return;
    }

    if (captainProfileParams && req.method === 'PATCH') {
      if (!canManageProfile(db, authUser, 'captain', captainProfileParams.captainId)) {
        sendJson(res, 403, { error: 'Captain profile access denied' });
        return;
      }

      const body = await parseBody(req);
      const captain = findById(db.captains, captainProfileParams.captainId);

      if (!captain) {
        sendJson(res, 404, { error: 'Captain not found' });
        return;
      }

      updateCaptainProfile(db, captain, body);
      audit(db, 'captain.profile.updated', { captainId: captain.id });
      await writeDb(db);
      sendJson(res, 200, captain);
      return;
    }

    const riderProfileParams = routeMatches(path, '/api/riders/:riderId/profile');

    if (riderProfileParams && req.method === 'GET') {
      if (!canManageProfile(db, authUser, 'rider', riderProfileParams.riderId)) {
        sendJson(res, 403, { error: 'Rider profile access denied' });
        return;
      }

      const rider = findById(db.riders, riderProfileParams.riderId);
      sendJson(res, rider ? 200 : 404, rider || { error: 'Rider not found' });
      return;
    }

    if (riderProfileParams && req.method === 'PATCH') {
      if (!canManageProfile(db, authUser, 'rider', riderProfileParams.riderId)) {
        sendJson(res, 403, { error: 'Rider profile access denied' });
        return;
      }

      const body = await parseBody(req);
      const rider = findById(db.riders, riderProfileParams.riderId);

      if (!rider) {
        sendJson(res, 404, { error: 'Rider not found' });
        return;
      }

      updateRiderProfile(db, rider, body);
      audit(db, 'rider.profile.updated', { riderId: rider.id });
      await writeDb(db);
      sendJson(res, 200, rider);
      return;
    }

    const captainPaymentParams = routeMatches(path, '/api/captains/:captainId/payment');

    if (captainPaymentParams && req.method === 'PATCH') {
      if (!canManageProfile(db, authUser, 'captain', captainPaymentParams.captainId)) {
        sendJson(res, 403, { error: 'Captain payment details access denied' });
        return;
      }

      const body = await parseBody(req);
      const captain = findById(db.captains, captainPaymentParams.captainId);

      if (!captain) {
        sendJson(res, 404, { error: 'Captain not found' });
        return;
      }

      captain.bank = {
        ...captain.bank,
        accountHolder: body.accountHolder ?? captain.bank.accountHolder,
        bankName: body.bankName ?? captain.bank.bankName,
        accountNumber: body.accountNumber ?? captain.bank.accountNumber,
        ifsc: body.ifsc ?? captain.bank.ifsc,
        upiId: body.upiId ?? captain.bank.upiId,
        qrFileName: body.qrFileName ?? captain.bank.qrFileName,
        qrMimeType: body.qrMimeType ?? captain.bank.qrMimeType,
        qrDataUrl: body.qrDataUrl ?? captain.bank.qrDataUrl
      };
      audit(db, 'captain.payment.updated', { captainId: captain.id, qrFileName: captain.bank.qrFileName });
      await writeDb(db);
      sendJson(res, 200, captain.bank);
      return;
    }

    const captainRouteParams = routeMatches(path, '/api/captains/:captainId/routes');

    if (captainRouteParams && req.method === 'GET') {
      if (!canManageProfile(db, authUser, 'captain', captainRouteParams.captainId)) {
        sendJson(res, 403, { error: 'Captain route access denied' });
        return;
      }

      sendJson(res, 200, db.captainRoutes.filter((route) => route.captainId === captainRouteParams.captainId));
      return;
    }

    if (captainRouteParams && req.method === 'POST') {
      if (!canManageProfile(db, authUser, 'captain', captainRouteParams.captainId)) {
        sendJson(res, 403, { error: 'Captain route access denied' });
        return;
      }

      const body = await parseBody(req);
      const captain = findById(db.captains, captainRouteParams.captainId);
      const missing = requireFields(body, ['fromLocation', 'toLocation', 'vacantSeats', 'distanceKm']);

      if (!captain) {
        sendJson(res, 404, { error: 'Captain not found' });
        return;
      }

      if (missing.length) {
        sendJson(res, 400, { error: 'Missing required fields', missing });
        return;
      }

      db.captainRoutes
        .filter((route) => route.captainId === captain.id && route.status === 'active')
        .forEach((route) => {
          route.status = 'closed';
        });

      const route = {
        id: createId('ROUTE'),
        captainId: captain.id,
        fromLocation: body.fromLocation,
        toLocation: body.toLocation,
        availableSeats: Math.max(1, Number(body.vacantSeats) || 1),
        vacantSeats: Math.max(1, Number(body.vacantSeats) || 1),
        vehicleType: body.vehicleType || captain.vehicleType,
        departureTime: body.departureTime || '',
        distanceKm: Number(body.distanceKm) || 0,
        status: 'active',
        currentPin: body.fromLocation,
        createdAt: now()
      };

      db.captainRoutes.push(route);
      audit(db, 'captain.route.created', { captainId: captain.id, routeId: route.id });
      await writeDb(db);
      sendJson(res, 201, route);
      return;
    }

    const captainDashboardParams = routeMatches(path, '/api/captains/:captainId/dashboard');

    if (captainDashboardParams && req.method === 'PATCH') {
      if (!canManageProfile(db, authUser, 'captain', captainDashboardParams.captainId)) {
        sendJson(res, 403, { error: 'Captain dashboard access denied' });
        return;
      }

      const body = await parseBody(req);
      const captain = findById(db.captains, captainDashboardParams.captainId);

      if (!captain) {
        sendJson(res, 404, { error: 'Captain not found' });
        return;
      }

      captain.dashboard = {
        ...captain.dashboard,
        targetPeriod: body.targetPeriod ?? captain.dashboard.targetPeriod,
        targetAmount: Number(body.targetAmount ?? captain.dashboard.targetAmount) || 0
      };
      audit(db, 'captain.dashboard.updated', { captainId: captain.id });
      await writeDb(db);
      sendJson(res, 200, captain.dashboard);
      return;
    }

    const captainRequestsParams = routeMatches(path, '/api/captains/:captainId/requests');

    if (captainRequestsParams && req.method === 'GET') {
      if (!canManageProfile(db, authUser, 'captain', captainRequestsParams.captainId)) {
        sendJson(res, 403, { error: 'Captain request access denied' });
        return;
      }

      sendJson(res, 200, db.rideRequests
        .filter((request) => request.captainId === captainRequestsParams.captainId)
        .map((request) => enrichRequest(db, request)));
      return;
    }

    const riderRequestsParams = routeMatches(path, '/api/riders/:riderId/requests');

    if (riderRequestsParams && req.method === 'GET') {
      if (!canManageProfile(db, authUser, 'rider', riderRequestsParams.riderId)) {
        sendJson(res, 403, { error: 'Rider request access denied' });
        return;
      }

      sendJson(res, 200, db.rideRequests
        .filter((request) => request.riderId === riderRequestsParams.riderId)
        .map((request) => enrichRequest(db, request)));
      return;
    }

    if (req.method === 'POST' && path === '/api/rider-requests') {
      const body = await parseBody(req);
      const missing = requireFields(body, ['riderId', 'captainId', 'routeId', 'pickup', 'destination', 'distanceKm']);

      if (missing.length) {
        sendJson(res, 400, { error: 'Missing required fields', missing });
        return;
      }

      if (!canManageProfile(db, authUser, 'rider', body.riderId)) {
        sendJson(res, 403, { error: 'Rider request creation denied' });
        return;
      }

      const route = findById(db.captainRoutes, body.routeId);

      if (!route || route.status !== 'active') {
        sendJson(res, 404, { error: 'Active captain route not found' });
        return;
      }

      if (route.captainId !== body.captainId || !routeFitsRider(route, body.pickup, body.destination)) {
        sendJson(res, 400, { error: 'Captain route does not match this rider allocation' });
        return;
      }

      syncRouteVacantSeats(db, route);
      const requestedSeats = Math.max(1, Number(body.requestedSeats) || 1);

      if (requestedSeats > route.vacantSeats) {
        sendJson(res, 409, { error: 'Not enough vacant seats on this Captain route', vacantSeats: route.vacantSeats });
        return;
      }

      const duplicateRequest = db.rideRequests.find((request) => (
        request.riderId === body.riderId
        && request.routeId === body.routeId
        && !['declined', 'ride-completed'].includes(request.status)
      ));

      if (duplicateRequest) {
        sendJson(res, 409, { error: 'Rider already has an active request for this route', request: duplicateRequest });
        return;
      }

      const request = {
        id: createId('REQ'),
        riderId: body.riderId,
        captainId: body.captainId,
        routeId: body.routeId,
        pickup: body.pickup,
        destination: body.destination,
        hopPickup: body.hopPickup || body.pickup,
        hopDestination: body.hopDestination || body.destination,
        requestedSeats,
        fare: calculateFare(body.distanceKm, route.availableSeats),
        distanceKm: Number(body.distanceKm) || 0,
        status: 'pending',
        captainMessage: '',
        createdAt: now()
      };

      db.rideRequests.push(request);
      audit(db, 'ride.request.created', { requestId: request.id });
      await writeDb(db);
      sendJson(res, 201, request);
      return;
    }

    const requestDecisionParams = routeMatches(path, '/api/captain/requests/:requestId');

    if (requestDecisionParams && req.method === 'PATCH') {
      const body = await parseBody(req);
      const request = findById(db.rideRequests, requestDecisionParams.requestId);

      if (!request) {
        sendJson(res, 404, { error: 'Ride request not found' });
        return;
      }

      const requestAccess = getRequestAccess(db, authUser, request);
      if (!['captain', 'admin'].includes(requestAccess)) {
        sendJson(res, 403, { error: 'Only the assigned Captain can decide this request' });
        return;
      }

      const allowedStatuses = ['accepted', 'declined', 'location-alert'];
      if (!allowedStatuses.includes(body.status)) {
        sendJson(res, 400, { error: `Status must be one of ${allowedStatuses.join(', ')}` });
        return;
      }

      if (SEAT_HOLDING_STATUSES.includes(request.status) && body.status === 'accepted') {
        sendJson(res, 409, { error: 'Ride request is already accepted' });
        return;
      }

      const route = findById(db.captainRoutes, request.routeId);
      if (body.status === 'accepted') {
        syncRouteVacantSeats(db, route);
        if (!route || route.vacantSeats < getRequestedSeats(request)) {
          sendJson(res, 409, { error: 'No vacant seat is available for this request' });
          return;
        }
      }

      request.status = body.status;
      request.captainMessage = body.captainMessage ?? request.captainMessage;
      request.updatedAt = now();
      syncRouteVacantSeats(db, route);
      audit(db, 'ride.request.decision', { requestId: request.id, status: request.status });
      await writeDb(db);
      sendJson(res, 200, request);
      return;
    }

    const rideStatusParams = routeMatches(path, '/api/rides/:requestId/status');

    if (rideStatusParams && req.method === 'PATCH') {
      const body = await parseBody(req);
      const request = findById(db.rideRequests, rideStatusParams.requestId);

      if (!request) {
        sendJson(res, 404, { error: 'Ride request not found' });
        return;
      }

      const allowedStatuses = ['present-at-pickup', 'not-at-pickup', 'ride-started', 'ride-completed'];
      if (!allowedStatuses.includes(body.status)) {
        sendJson(res, 400, { error: `Status must be one of ${allowedStatuses.join(', ')}` });
        return;
      }

      const requestAccess = getRequestAccess(db, authUser, request);
      const canUpdateStatus = requestAccess === 'admin'
        || (['present-at-pickup', 'not-at-pickup'].includes(body.status) && requestAccess === 'rider')
        || (['ride-started', 'ride-completed'].includes(body.status) && requestAccess === 'captain');

      if (!canUpdateStatus) {
        sendJson(res, 403, { error: 'Ride status update denied for this user' });
        return;
      }

      if (!canTransitionRide(request.status, body.status)) {
        sendJson(res, 409, {
          error: `Cannot move ride from ${request.status} to ${body.status}`,
          currentStatus: request.status
        });
        return;
      }

      request.status = body.status === 'not-at-pickup' ? 'location-alert' : body.status;
      if (body.status === 'not-at-pickup') {
        request.riderAlert = body.note || 'Rider reported that Captain is not at the pickup hub.';
      }
      request.updatedAt = now();

      if (body.status === 'ride-completed') {
        const route = findById(db.captainRoutes, request.routeId);
        const captain = findById(db.captains, request.captainId);

        if (route) {
          route.currentPin = request.hopDestination || request.destination;
          syncRouteVacantSeats(db, route);
        }

        if (captain) {
          captain.dashboard.totalRides += 1;
          captain.dashboard.completedRiders += 1;
        }
      }

      audit(db, 'ride.status.updated', { requestId: request.id, status: request.status });
      await writeDb(db);
      sendJson(res, 200, request);
      return;
    }

    if (req.method === 'POST' && path === '/api/payments') {
      const body = await parseBody(req);
      const missing = requireFields(body, ['requestId', 'amount', 'method']);

      if (missing.length) {
        sendJson(res, 400, { error: 'Missing required fields', missing });
        return;
      }

      const request = findById(db.rideRequests, body.requestId);
      if (!request) {
        sendJson(res, 404, { error: 'Ride request not found' });
        return;
      }

      if (!['rider', 'admin'].includes(getRequestAccess(db, authUser, request))) {
        sendJson(res, 403, { error: 'Only the assigned Rider can complete payment' });
        return;
      }

      if (request.status !== 'ride-completed') {
        sendJson(res, 409, { error: 'Payment is available only after ride completion' });
        return;
      }

      if (db.payments.some((payment) => payment.requestId === request.id && payment.status === 'paid')) {
        sendJson(res, 409, { error: 'This ride is already paid' });
        return;
      }

      const payment = {
        id: createId('PAY'),
        requestId: request.id,
        riderId: request.riderId,
        captainId: request.captainId,
        amount: Number(request.fare) || 0,
        method: body.method,
        status: 'paid',
        createdAt: now()
      };

      db.payments.push(payment);
      const captain = findById(db.captains, request.captainId);
      if (captain) {
        captain.dashboard.earnedAmount += payment.amount;
      }
      audit(db, 'payment.created', { paymentId: payment.id, requestId: request.id });
      await writeDb(db);
      sendJson(res, 201, payment);
      return;
    }

    if (req.method === 'POST' && path === '/api/reviews') {
      const body = await parseBody(req);
      const missing = requireFields(body, ['requestId', 'riderId', 'captainId', 'rating']);

      if (missing.length) {
        sendJson(res, 400, { error: 'Missing required fields', missing });
        return;
      }

      const reviewRequest = findById(db.rideRequests, body.requestId);
      if (
        !reviewRequest
        || reviewRequest.riderId !== body.riderId
        || reviewRequest.captainId !== body.captainId
        || !['rider', 'admin'].includes(getRequestAccess(db, authUser, reviewRequest))
      ) {
        sendJson(res, 403, { error: 'Review submission denied for this ride' });
        return;
      }

      if (reviewRequest.status !== 'ride-completed') {
        sendJson(res, 409, { error: 'Review is available only after ride completion' });
        return;
      }

      if (!db.payments.some((payment) => payment.requestId === reviewRequest.id && payment.status === 'paid')) {
        sendJson(res, 409, { error: 'Complete payment before submitting a review' });
        return;
      }

      if (db.reviews.some((item) => item.requestId === reviewRequest.id)) {
        sendJson(res, 409, { error: 'A review was already submitted for this ride' });
        return;
      }

      const review = {
        id: createId('REV'),
        requestId: body.requestId,
        riderId: body.riderId,
        captainId: body.captainId,
        rating: Number(body.rating) || 0,
        mood: body.mood || 'Moderate',
        comment: body.comment || '',
        createdAt: now()
      };

      db.reviews.push(review);
      const captainReviews = db.reviews.filter((item) => item.captainId === body.captainId);
      const captain = findById(db.captains, body.captainId);

      if (captain && captainReviews.length) {
        captain.dashboard.rating = Number((
          captainReviews.reduce((total, item) => total + item.rating, 0) / captainReviews.length
        ).toFixed(1));
      }

      audit(db, 'review.created', { reviewId: review.id });
      await writeDb(db);
      sendJson(res, 201, review);
      return;
    }

    sendJson(res, 404, { error: 'API route not found', path });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}

async function startServer() {
  storageStatus = await initializeDb();
  seedDb();
  await flushDb();

  const server = http.createServer(handleRequest);
  server.listen(PORT, () => {
    console.log(`RideRelay backend running at http://localhost:${PORT} using ${storageStatus.driver}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await closeDb();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((error) => {
  console.error('RideRelay backend failed to start:', error.message);
  process.exit(1);
});
