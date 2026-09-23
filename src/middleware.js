import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';
import { BASE_PATH } from '@/lib/basePath';

// Every page in this app is server-rendered per request (force-dynamic)
// -- nothing here should ever be cached by an intermediate layer (a
// CDN, or cPanel's own LiteSpeed Cache/Apache proxy in front of the
// Node app). Explicit Cache-Control: no-store on every response,
// rather than relying on that layer to respect Next's own default --
// observed live: a stale cached copy of the homepage (from before a
// same-day rebuild replaced its content-hashed CSS/JS files) kept
// serving with 404-ing asset references, rendering fully unstyled,
// and outlasting a genuine app restart -- because the cache lives
// outside the Node process a restart doesn't touch it.
function withNoStore(response) {
  response.headers.set('Cache-Control', 'no-store, must-revalidate');
  return response;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isProtectedPage = pathname.startsWith('/admin');
  const isProtectedApi = pathname.startsWith('/api/admin');

  // Kill switch: while ADMIN_ENABLED isn't explicitly set to 'true' in
  // the Node.js app's environment variables, every admin route --
  // including the login page itself -- 404s as if it doesn't exist at
  // all. No env var set (the default) means disabled. Toggle it back
  // on later via the Node.js Selector's environment variables, then
  // restart the app -- no code change or redeploy needed either way.
  if ((isProtectedPage || isProtectedApi) && process.env.ADMIN_ENABLED !== 'true') {
    return withNoStore(new NextResponse('Not Found', { status: 404 }));
  }

  // Never protect the login page or its API — protecting it would create
  // an infinite redirect loop (redirected to login, which redirects to
  // login, ...).
  if (pathname.startsWith('/admin/login') || pathname === '/api/admin/login') {
    return withNoStore(NextResponse.next());
  }

  if (!isProtectedPage && !isProtectedApi) {
    return withNoStore(NextResponse.next());
  }

  const token = request.cookies.get('admin_session')?.value;
  const valid = await verifySessionToken(token, process.env.SESSION_SECRET);

  if (!valid) {
    if (isProtectedApi) {
      return withNoStore(NextResponse.json({ error: 'Unauthorized — please log in again.' }, { status: 401 }));
    }
    return withNoStore(NextResponse.redirect(new URL(`${BASE_PATH}/admin/login`, request.url)));
  }

  return withNoStore(NextResponse.next());
}

// Widened from admin-only to every path, specifically so the no-store
// header above applies site-wide -- not just to admin routes. Static
// framework internals (_next/static, favicon, etc.) are excluded since
// those content-hashed files SHOULD be cached; a new deploy gives them
// new filenames instead of invalidating the old ones.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
