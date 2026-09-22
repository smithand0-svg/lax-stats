const { pool } = require('./db');
const { splitName } = require('./hudlParser');
const { getPlayerLookup, makePlayerResolver } = require('./playerLookup');

// Same pattern as import/preview's getDefaultTeamId -- exactly one team
// (SJJ) for MVP.
async function getDefaultTeamId() {
  const { rows } = await pool.query("SELECT id FROM teams WHERE slug = 'sjj'");
  if (!rows[0]) throw new Error('Default team not found — did you run the schema migration?');
  return rows[0].id;
}

// Resolves a typed player_name (+ optional graduationYear, for
// collision disambiguation) to a real players.id, using the same
// split-name + fuzzy-prefix resolver as everywhere else in the app
// (playerLookup.js / backfillHistorical.js). Returns null for a
// genuinely unknown player -- the caller still stores player_name as
// typed either way (same convention as player_honors).
async function resolvePlayerId(playerName, graduationYear) {
  const players = await getPlayerLookup();
  const resolve = makePlayerResolver(players);
  const { firstName, lastName } = splitName(playerName);
  const match = resolve(firstName, lastName, graduationYear || null);
  return match ? match.id : null;
}

module.exports = { getDefaultTeamId, resolvePlayerId };
