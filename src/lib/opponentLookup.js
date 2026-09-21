const { pool } = require('./db');
const { matchOpponent } = require('./opponentMatcher');

async function getOpponentLookup() {
  const { rows: opponents } = await pool.query(
    `SELECT o.id, o.name FROM opponents o JOIN teams t ON t.id = o.team_id WHERE t.slug = 'sjj'`
  );
  const { rows: aliases } = await pool.query(
    `SELECT oa.opponent_id AS "opponentId", oa.alias_name AS "aliasName"
     FROM opponent_aliases oa
     JOIN opponents o ON o.id = oa.opponent_id
     JOIN teams t ON t.id = o.team_id
     WHERE t.slug = 'sjj'`
  );
  return { opponents, aliases };
}

function makeCanonicalizer({ opponents, aliases }) {
  const cache = new Map();
  return (name) => {
    if (!name) return name;
    if (cache.has(name)) return cache.get(name);
    // No match (a genuinely one-off historical opponent never run
    // through the picker) falls back to the name as given -- safe,
    // just means it won't dedupe against anything, same as today.
    const canonical = matchOpponent(name, opponents, aliases).canonicalName;
    cache.set(name, canonical);
    return canonical;
  };
}

module.exports = { getOpponentLookup, makeCanonicalizer };
