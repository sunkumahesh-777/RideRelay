const SEAT_HOLDING_STATUSES = ['accepted', 'present-at-pickup', 'ride-started'];
const RIDE_STATUS_TRANSITIONS = {
  'present-at-pickup': ['accepted', 'location-alert'],
  'not-at-pickup': ['accepted', 'location-alert'],
  'ride-started': ['present-at-pickup'],
  'ride-completed': ['ride-started']
};

function getRequestedSeats(request) {
  return Math.max(1, Number(request?.requestedSeats) || 1);
}

module.exports = {
  SEAT_HOLDING_STATUSES,
  RIDE_STATUS_TRANSITIONS,
  getRequestedSeats
};
