const { pool } = require('./db');

async function getPlayerLookup() {
  const { rows: players } = await pool.query(
    `SELECT p.id, p.first_name, p.last_name, p.graduation_year
     FROM players p JOIN teams t ON t.id = p.team_id WHERE t.slug = 'sjj'`
  );
  return players;
}

function normalize(str) {
  return (str || '').trim().toLowerCase();
}

// Resolves a static record's player name to a real players.id. A
// graduationYear on the static entry disambiguates a name that collides
// across eras (the same convention used everywhere else in the app).
// Genuinely unknown players (never imported, no legacy row created for
// them yet) return null -- the caller falls back to plain-text display
// rather than guessing or silently creating a row from a page render.
function makePlayerResolver(players) {
  const cache = new Map();
  return (firstName, lastName, graduationYear) => {
    const key = `${normalize(firstName)}|${normalize(lastName)}|${graduationYear || ''}`;
    if (cache.has(key)) return cache.get(key);

    let matches = players.filter(
      (p) => normalize(p.first_name) === normalize(firstName) && normalize(p.last_name) === normalize(lastName)
    );
    if (matches.length > 1 && graduationYear) {
      const narrowed = matches.filter((p) => p.graduation_year === graduationYear);
      if (narrowed.length > 0) matches = narrowed;
    }
    const result = matches[0] || null;
    cache.set(key, result);
    return result;
  };
}

module.exports = { getPlayerLookup, makePlayerResolver };
