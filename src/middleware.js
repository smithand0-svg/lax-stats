import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';
import { BASE_PATH } from '@/lib/basePath';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Never protect the login page or its API — protecting it would create
  // an infinite redirect loop (redirected to login, which redirects to
  // login, ...).
  if (pathname.startsWith('/admin/login') || pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  const isProtectedPage = pathname.startsWith('/admin');
  const isProtectedApi = pathname.startsWith('/api/admin');
  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_session')?.value;
  const valid = await verifySessionToken(token, process.env.SESSION_SECRET);

  if (!valid) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized — please log in again.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL(`${BASE_PATH}/admin/login`, request.url));
  }

  return NextResponse.next();
}

// Note: these paths are relative to the app's own routing — Next.js
// applies basePath (e.g. /lax-stats) automatically, so it must NOT be
// included here.
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
