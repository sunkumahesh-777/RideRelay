function cleanUser(user) {
  if (!user) {
    return null;
  }

  const {
    password,
    passwordHash,
    passwordSalt,
    ...safeUser
  } = user;

  return safeUser;
}

function findById(items = [], id) {
  return items.find((item) => item.id === id);
}

function getRoleProfile(db, user) {
  if (user?.role === 'captain') {
    return db.captains.find((captain) => captain.userId === user.id);
  }

  return db.riders.find((rider) => rider.userId === user?.id);
}

module.exports = {
  cleanUser,
  findById,
  getRoleProfile
};
