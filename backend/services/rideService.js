const { SEAT_HOLDING_STATUSES, getRequestedSeats } = require('../models/Ride');

const RATE_PER_KM = 9;

function normalize(value = '') {
  return String(value).trim().toLowerCase();
}

function calculateFare(distanceKm, vacantSeats) {
  const safeDistance = Math.max(0, Number(distanceKm) || 0);
  const safeSeats = Math.max(1, Number(vacantSeats) || 1);
  return Math.max(10, Math.ceil((safeDistance * RATE_PER_KM) / safeSeats));
}

function normalizeRouteStop(value = '') {
  return normalize(value).replace(/\s+/g, ' ');
}

function routeFitsRider(route, pickup, destination) {
  const from = normalizeRouteStop(route.fromLocation);
  const to = normalizeRouteStop(route.toLocation);
  const riderPickup = normalizeRouteStop(pickup);
  const riderDestination = normalizeRouteStop(destination);

  return (
    from === riderPickup
    || to === riderDestination
    || from.includes(riderPickup)
    || to.includes(riderDestination)
    || riderPickup.includes(from)
    || riderDestination.includes(to)
  );
}

function getRouteOccupiedSeats(db, routeId, excludedRequestId = '') {
  return db.rideRequests
    .filter((request) => (
      request.routeId === routeId
      && request.id !== excludedRequestId
      && SEAT_HOLDING_STATUSES.includes(request.status)
    ))
    .reduce((total, request) => total + getRequestedSeats(request), 0);
}

function syncRouteVacantSeats(db, route) {
  if (!route) return;

  const availableSeats = Math.max(1, Number(route.availableSeats ?? route.vacantSeats) || 1);
  route.availableSeats = availableSeats;
  route.vacantSeats = Math.max(0, availableSeats - getRouteOccupiedSeats(db, route.id));
}

module.exports = {
  RATE_PER_KM,
  normalize,
  calculateFare,
  getRequestedSeats,
  SEAT_HOLDING_STATUSES,
  routeFitsRider,
  syncRouteVacantSeats
};
