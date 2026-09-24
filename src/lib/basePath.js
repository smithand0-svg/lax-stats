// Single source of truth for the app's deployment subpath. Used both by
// next.config.mjs (to configure Next.js's own routing) and by any
// client-side fetch() calls to our own API routes — Next.js automatically
// prefixes <Link>/page navigation with basePath, but does NOT do this for
// raw fetch() calls, so those must be prefixed manually or they'll hit
// the wrong URL (as happened here).
//
// TM-46 (2026-09-23): the site now serves from the root of its own
// domain, www.sjjlax.com, so this is ''. The old /lax-stats build lives
// on the threemarbles-frozen branch until the old address is retired.
// To serve from a subpath again, set it (e.g. '/lax-stats') and rebuild.
export const BASE_PATH = '';
