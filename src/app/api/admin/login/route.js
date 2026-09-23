import { NextResponse } from 'next/server';
import { createSessionToken, timingSafeEqual } from '@/lib/auth';

// In-memory brute-force throttle -- resets on restart, and doesn't
// share state across multiple server processes if this app is ever
// run clustered, but this is a single-process cPanel deployment with
// exactly one admin account, so that's an acceptable tradeoff for
// something this cheap and dependency-free. Keyed by IP: after 5 wrong
// attempts, that IP is locked out for 15 minutes. A real attacker can
// still rotate IPs, but this stops the cheap case -- a script hammering
// the endpoint from one address -- outright, which is the actual
// threat (an opportunistic script, not a nation-state).
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const attempts = new Map(); // ip -> { count, lockedUntil }

function getClientIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}

export async function POST(request) {
  const ip = getClientIp(request);
  const record = attempts.get(ip);
  if (record?.lockedUntil && Date.now() < record.lockedUntil) {
    const waitMin = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Too many incorrect attempts. Try again in about ${waitMin} minute${waitMin === 1 ? '' : 's'}.` },
      { status: 429 }
    );
  }

  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!adminPassword || !secret) {
    return NextResponse.json(
      { error: 'Admin login is not configured yet (ADMIN_PASSWORD / SESSION_SECRET missing on the server).' },
      { status: 500 }
    );
  }
  // Timing-safe comparison -- a plain !== short-circuits on the first
  // mismatched character, which in principle leaks how many leading
  // characters of a guess are correct via response-time differences.
  // Real-world network jitter makes this hard to exploit, but it's a
  // free fix given the primitive already exists for session tokens.
  if (typeof password !== 'string' || !timingSafeEqual(password, adminPassword)) {
    const next = { count: (record?.count || 0) + 1, lockedUntil: null };
    if (next.count >= MAX_ATTEMPTS) next.lockedUntil = Date.now() + LOCKOUT_MS;
    attempts.set(ip, next);
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  attempts.delete(ip);
  const token = await createSessionToken(secret);
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_session', token, {
    httpOnly: true,
    // Only require HTTPS for the cookie in actual production (real
    // deployment is always https); this keeps local http testing working.
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return response;
}
