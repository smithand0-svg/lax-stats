/**
 * Lightweight signed-session helper for the single-admin login.
 *
 * Uses the Web Crypto API (crypto.subtle) rather than Node's `crypto`
 * module, deliberately — this file is imported by both middleware.js
 * (which runs in Next.js's Edge runtime, where Node's `crypto`/`Buffer`
 * aren't reliably available) and by ordinary Node route handlers. Web
 * Crypto works in both, so one implementation covers everything.
 *
 * A session token is `${expiresAtMs}.${hmacHex}` — no session store or
 * database needed, since there's exactly one admin account. The HMAC
 * proves the token was issued by us (using SESSION_SECRET) and hasn't
 * been tampered with; it's not encrypting anything secret.
 */

const encoder = new TextEncoder();

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

async function getKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

export async function createSessionToken(secret, ttlMs = 1000 * 60 * 60 * 24 * 7) {
  const expires = Date.now() + ttlMs;
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(String(expires)));
  return `${expires}.${bufToHex(sig)}`;
}

export async function verifySessionToken(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.') || !secret) return false;
  const [expiresStr, sigHex] = token.split('.');
  const expires = parseInt(expiresStr, 10);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(expiresStr));
  return timingSafeEqual(bufToHex(sig), sigHex);
}
