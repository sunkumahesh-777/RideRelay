const crypto = require('crypto');
const { findById } = require('../models/User');

const AUTH_SECRET = process.env.JWT_SECRET || 'riderelay-local-demo-secret';
const PASSWORD_ITERATIONS = 120000;

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const passwordHash = crypto
    .pbkdf2Sync(String(password), salt, PASSWORD_ITERATIONS, 64, 'sha512')
    .toString('hex');

  return { passwordHash, passwordSalt: salt };
}

function verifyPassword(password, user) {
  if (user.passwordHash && user.passwordSalt) {
    const { passwordHash } = hashPassword(password, user.passwordSalt);
    return crypto.timingSafeEqual(Buffer.from(passwordHash, 'hex'), Buffer.from(user.passwordHash, 'hex'));
  }

  return user.password === password;
}

function createAuthToken(user) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    role: user.role,
    email: user.email,
    iat: issuedAt,
    exp: issuedAt + (24 * 60 * 60)
  })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

function verifyAuthToken(token) {
  try {
    const [header, payload, signature] = String(token || '').split('.');
    if (!header || !payload || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    const receivedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      receivedBuffer.length !== expectedBuffer.length
      || !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      return null;
    }

    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return claims.sub && claims.exp > Math.floor(Date.now() / 1000) ? claims : null;
  } catch {
    return null;
  }
}

function getAuthenticatedUser(req, db) {
  const [scheme, token] = String(req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  const claims = verifyAuthToken(token);
  return claims ? findById(db.users, claims.sub) : null;
}

function canManageProfile(db, authUser, role, profileId) {
  if (authUser?.role === 'admin') return true;

  const profiles = role === 'captain' ? db.captains : db.riders;
  return profiles.some((profile) => profile.id === profileId && profile.userId === authUser?.id);
}

function getRequestAccess(db, authUser, request) {
  if (!authUser || !request) return null;
  if (authUser.role === 'admin') return 'admin';

  const rider = findById(db.riders, request.riderId);
  const captain = findById(db.captains, request.captainId);

  if (rider?.userId === authUser.id) return 'rider';
  if (captain?.userId === authUser.id) return 'captain';
  return null;
}

module.exports = {
  hashPassword,
  verifyPassword,
  createAuthToken,
  getAuthenticatedUser,
  canManageProfile,
  getRequestAccess
};
