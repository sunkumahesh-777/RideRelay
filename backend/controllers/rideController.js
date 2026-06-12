const { RIDE_STATUS_TRANSITIONS } = require('../models/Ride');

function canTransitionRide(currentStatus, nextStatus) {
  return Boolean(RIDE_STATUS_TRANSITIONS[nextStatus]?.includes(currentStatus));
}

module.exports = {
  canTransitionRide
};
