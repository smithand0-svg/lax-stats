const { Pool } = require('pg');

// Reads connection details from environment variables so the same code
// works against cPanel's PostgreSQL, a local test database, or anything
// else — nothing environment-specific is hardcoded.
//
// Expected env vars: DATABASE_URL (e.g. postgres://user:pass@host:5432/dbname)
// or the individual PGHOST/PGUSER/PGPASSWORD/PGDATABASE/PGPORT vars that
// the pg library reads automatically.
//
// max/idleTimeoutMillis are deliberately conservative: this app runs on a
// shared hosting account with a hard, low ceiling on total OS processes
// (40), and each Postgres connection consumes one on that account. The
// default pg Pool max (10) per Node worker process was almost certainly
// contributing to real process-limit exhaustion from ordinary browsing —
// a single page (like the leaderboard) fires off close to a dozen
// queries in parallel, and if Passenger runs more than one worker
// process, each gets its own pool. Capping max low means queries queue
// briefly for a free connection under heavy concurrent load instead of
// opening more connections — a negligible latency cost for a low-traffic
// site, in exchange for a hard, predictable ceiling on how many
// processes this app can ever consume at once. idleTimeoutMillis closes
// unused connections quickly so they don't sit open (and counted)
// between requests.
const pool = new Pool({
  ...(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {}),
  max: 4,
  idleTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  // Idle-client errors (e.g. the DB briefly dropping a connection) must
  // be handled here — an unhandled 'error' event on the pool crashes the
  // whole Node process, which would look exactly like the mysterious
  // "everything just stopped working" episodes seen on this host.
  console.error('Unexpected error on idle database client', err);
});

module.exports = { pool };
