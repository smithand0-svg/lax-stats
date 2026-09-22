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

// Same first-3-letters prefix trick as scripts/backfillHistorical.js's
// resolveOrCreatePlayer -- Zach/Zack/Zachary, Nick/Nicholas, Sam/Samuel
// all share a prefix. That script is what actually populated `players`
// in the first place, using exactly this fuzzy match to fold nickname
// variants from different source files into ONE player row under
// whichever spelling was imported first -- so a static record typed
// with a different variant needs the same fuzzy fallback to recognize
// it as the same person, or it silently fails to match at all and the
// static entry never gets marked "covered" by that player's live data
// (this is what caused a Zack Wester static record to duplicate his
// already-live Zach Wester row).
function prefix3(s) {
  return normalize(s).slice(0, 3);
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
    if (matches.length === 0) {
      matches = players.filter(
        (p) =>
          normalize(p.last_name) === normalize(lastName) &&
          prefix3(p.first_name) === prefix3(firstName) &&
          prefix3(p.first_name).length === 3 // don't fuzzy-match on a 1-2 letter name
      );
    }
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
