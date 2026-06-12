const { findById } = require('../models/User');

function updateCaptainProfile(db, captain, body) {
  Object.assign(captain, {
    fullName: body.fullName ?? captain.fullName,
    gender: body.gender ?? captain.gender,
    vehicleType: body.vehicleType ?? captain.vehicleType,
    vehicleNumber: body.vehicleNumber ?? captain.vehicleNumber,
    licenseNumber: body.licenseNumber ?? captain.licenseNumber
  });

  const user = findById(db.users, captain.userId);
  if (user) {
    user.fullName = body.fullName ?? user.fullName;
    user.phone = body.phone ?? user.phone;
  }

  return captain;
}

function updateRiderProfile(db, rider, body) {
  Object.assign(rider, {
    fullName: body.fullName ?? rider.fullName,
    homeStop: body.homeStop ?? rider.homeStop,
    gender: body.gender ?? rider.gender,
    emergencyContact: body.emergencyContact ?? rider.emergencyContact
  });

  const user = findById(db.users, rider.userId);
  if (user) {
    user.fullName = body.fullName ?? user.fullName;
    user.phone = body.phone ?? user.phone;
  }

  return rider;
}

module.exports = {
  updateCaptainProfile,
  updateRiderProfile
};
