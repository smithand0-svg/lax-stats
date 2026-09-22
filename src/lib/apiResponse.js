const { NextResponse } = require('next/server');

// Explicit Cache-Control: no-store on every admin API response, rather
// than relying on Next's own default (no-cache-by-default for Route
// Handlers) being respected by whatever sits between the browser and
// the app. cPanel commonly proxies a Node app through Apache/LiteSpeed,
// and shared hosting often has response caching (LiteSpeed Cache,
// mod_cache) enabled with a short TTL -- observed live as a ~60+
// second delay before a newly added award showed up in the admin list,
// affecting both the Team Awards and External Honors panels equally
// and resolving on its own, which points at exactly this kind of
// intermediate cache rather than a bug in the fetch/re-fetch logic.
function jsonNoStore(data, init) {
  const response = NextResponse.json(data, init);
  response.headers.set('Cache-Control', 'no-store, must-revalidate');
  return response;
}

module.exports = { jsonNoStore };
