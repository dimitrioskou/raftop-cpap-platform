const crypto = require('crypto');

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromBase64url(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, 'base64').toString('utf8');
}

function getSecret() {
  return process.env.AUTH_SECRET || 'raftop-enterprise-dev-secret';
}

function sign(data) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createToken(payload, expiresInSeconds = 60 * 60 * 12) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);

  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(fullPayload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(unsigned);

  return `${unsigned}.${signature}`;
}

function verifyToken(token) {
  try {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const unsigned = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = sign(unsigned);

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(fromBase64url(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (!payload.exp || payload.exp < now) return null;

    return payload;
  } catch (error) {
    return null;
  }
}

module.exports = {
  createToken,
  verifyToken
};