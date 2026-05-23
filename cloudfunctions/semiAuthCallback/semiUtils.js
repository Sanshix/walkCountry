const crypto = require('crypto');
const config = require('./semiConfig');

function randomUrlSafe(size = 32) {
  return crypto.randomBytes(size).toString('base64url');
}

function sha256Base64Url(input) {
  return crypto.createHash('sha256').update(input).digest('base64url');
}

function signAppToken(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() }), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', config.APP_SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyAppToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', config.APP_SESSION_SECRET).update(body).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
}

function ok(data) {
  return { success: true, data };
}

function fail(errorCode, message) {
  return { success: false, errorCode, message };
}

function nowIso() {
  return new Date().toISOString();
}

function addSeconds(seconds) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function encryptForDemo(value) {
  if (!value) return '';
  return Buffer.from(String(value), 'utf8').toString('base64');
}

function decryptForDemo(value) {
  if (!value) return '';
  return Buffer.from(String(value), 'base64').toString('utf8');
}

function isExpired(iso) {
  if (!iso) return true;
  return new Date(iso).getTime() < Date.now();
}

module.exports = {
  config,
  randomUrlSafe,
  sha256Base64Url,
  signAppToken,
  verifyAppToken,
  ok,
  fail,
  nowIso,
  addSeconds,
  encryptForDemo,
  decryptForDemo,
  isExpired
};
