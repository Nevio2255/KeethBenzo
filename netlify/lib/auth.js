const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const SECRET = process.env.TOKEN_SECRET || 'keethbenzo-change-this-secret';

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

// Einfaches signiertes Token: base64(payload).signature
function signToken(payload, expiresInSeconds = 60 * 60 * 24 * 7) {
  const data = { ...payload, exp: Date.now() + expiresInSeconds * 1000 };
  const json = JSON.stringify(data);
  const base64 = Buffer.from(json).toString('base64');
  const sig = crypto.createHmac('sha256', SECRET).update(base64).digest('hex');
  return `${base64}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  const [base64, sig] = token.split('.');
  if (!base64 || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', SECRET).update(base64).digest('hex');
  if (sig !== expectedSig) return null;
  try {
    const data = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

function getAuthUser(event) {
  const header = event.headers.authorization || event.headers.Authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return verifyToken(header.slice(7));
}

function generateShortCode(length = 6) {
  return crypto.randomBytes(length).toString('hex').toUpperCase().slice(0, length);
}

module.exports = { hashPassword, comparePassword, signToken, verifyToken, getAuthUser, generateShortCode };
