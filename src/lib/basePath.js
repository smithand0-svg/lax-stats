// Single source of truth for the app's deployment subpath. Used both by
// next.config.mjs (to configure Next.js's own routing) and by any
// client-side fetch() calls to our own API routes — Next.js automatically
// prefixes <Link>/page navigation with basePath, but does NOT do this for
// raw fetch() calls, so those must be prefixed manually or they'll hit
// the wrong URL (as happened here).
//
// If this app ever moves to serve from a domain root instead of a
// subpath (e.g. sjjlax.com instead of threemarbles.com/sjj-stats),
// change this to '' and rebuild.
export const BASE_PATH = '/lax-stats';
