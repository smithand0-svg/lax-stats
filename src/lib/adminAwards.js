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

// Same idea as resolvePlayerId, but for staff -- last name + first-3-
// letters fuzzy match against the staff table. No grad-year concept
// for staff, so nothing to disambiguate a same-name collision with
// yet (not expected to come up given how small the coaching staff
// list is, but if it ever does, this returns the first match rather
// than guessing wrong -- worth revisiting if it actually happens).
async function resolveStaffId(staffName) {
  const { firstName, lastName } = splitName(staffName);
  const { rows: matches } = await pool.query(
    `SELECT id FROM staff
     WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
       AND lower(last_name) = lower($1)
       AND left(lower(first_name), 3) = left(lower($2), 3)`,
    [lastName, firstName]
  );
  return matches[0] ? matches[0].id : null;
}

module.exports = { getDefaultTeamId, resolvePlayerId, resolveStaffId };
