/**
 * Opponent identity matcher.
 *
 * Goal: given a free-typed opponent name for a game, decide whether it's an
 * existing canonical opponent, a known alias of one, or a genuinely new
 * opponent — and in the first two cases, resolve to the CANONICAL spelling
 * so `games.opponent` never fragments program history across spelling
 * variants (e.g. "St Francis DeSales" vs "St. Francis Toledo" vs
 * "ST FRANCIS DESALES" all resolving to the one canonical name).
 *
 * Pure logic, same shape as playerMatcher.js — takes in-memory
 * opponents/aliases lists (as loaded from the DB) and returns a decision.
 * The caller is responsible for the actual DB read/write, including
 * inserting a new `opponents` row when the result is NEW.
 */

const MATCH = {
  EXACT: 'exact',           // typed name matches a canonical opponent name
  ALIAS: 'alias',           // typed name matches a known alias
  NEW: 'new_opponent',      // no existing opponent or alias matches
};

/**
 * @param {string} inputName - free-typed opponent name
 * @param {Array<{id, name}>} existingOpponents
 * @param {Array<{opponentId, aliasName}>} existingAliases
 * @returns {{ status: string, opponentId: string|null, canonicalName: string, reason: string }}
 */
function matchOpponent(inputName, existingOpponents, existingAliases) {
  const trimmed = (inputName || '').trim();
  const normalized = normalize(trimmed);

  if (!normalized) {
    return { status: MATCH.NEW, opponentId: null, canonicalName: trimmed, reason: 'No opponent entered' };
  }

  const aliasHit = existingAliases.find((a) => normalize(a.aliasName) === normalized);
  if (aliasHit) {
    const opponent = existingOpponents.find((o) => o.id === aliasHit.opponentId);
    if (opponent) {
      return {
        status: MATCH.ALIAS,
        opponentId: opponent.id,
        canonicalName: opponent.name,
        reason: `Matched known alias "${aliasHit.aliasName}"`,
      };
    }
  }

  const exactHit = existingOpponents.find((o) => normalize(o.name) === normalized);
  if (exactHit) {
    return { status: MATCH.EXACT, opponentId: exactHit.id, canonicalName: exactHit.name, reason: 'Exact name match' };
  }

  return {
    status: MATCH.NEW,
    opponentId: null,
    canonicalName: trimmed,
    reason: 'No existing opponent or alias matches — will be added as a new opponent',
  };
}

/**
 * Typeahead search for the admin-import picker: substring match against
 * canonical names AND aliases, deduped by opponent (one row per opponent
 * even if both its canonical name and an alias match), canonical matches
 * ranked above alias-only matches, and exact/prefix matches ranked above
 * plain substring matches.
 *
 * @returns {Array<{id, name, matchedOn, isAlias}>}
 */
function searchOpponents(query, existingOpponents, existingAliases, limit = 8) {
  const q = normalize(query);
  if (!q) return [];

  const results = new Map(); // opponentId -> { id, name, matchedOn, isAlias, rank }

  existingOpponents.forEach((o) => {
    const n = normalize(o.name);
    if (n.includes(q)) {
      const rank = n === q ? 0 : n.startsWith(q) ? 1 : 2;
      results.set(o.id, { id: o.id, name: o.name, matchedOn: o.name, isAlias: false, rank });
    }
  });

  existingAliases.forEach((a) => {
    if (results.has(a.opponentId)) return; // canonical match already covers this opponent
    const n = normalize(a.aliasName);
    if (!n.includes(q)) return;
    const opponent = existingOpponents.find((o) => o.id === a.opponentId);
    if (!opponent) return;
    const rank = n === q ? 3 : n.startsWith(q) ? 4 : 5;
    results.set(opponent.id, { id: opponent.id, name: opponent.name, matchedOn: a.aliasName, isAlias: true, rank });
  });

  return Array.from(results.values())
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function normalize(str) {
  return (str || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

module.exports = { matchOpponent, searchOpponents, MATCH };
