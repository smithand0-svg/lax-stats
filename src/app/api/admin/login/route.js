import { NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/auth';

export async function POST(request) {
  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!adminPassword || !secret) {
    return NextResponse.json(
      { error: 'Admin login is not configured yet (ADMIN_PASSWORD / SESSION_SECRET missing on the server).' },
      { status: 500 }
    );
  }
  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

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
