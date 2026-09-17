/**
 * Player identity matcher.
 *
 * Goal: given a Hudl "Athlete" full name, decide whether it's an existing
 * player, a known alias of an existing player, or a genuinely new player —
 * WITHOUT guessing when it's ambiguous. Ambiguous cases (like a middle name
 * throwing off a naive first/last split) get surfaced to the admin
 * match-review screen instead of being silently resolved either way.
 *
 * This module is pure logic — it takes an in-memory list of existing
 * players/aliases (as loaded from the DB) and returns match decisions.
 * The caller is responsible for the actual DB read/write.
 */

const MATCH = {
  EXACT: 'exact',                 // confident auto-match, no review needed
  ALIAS: 'alias',                 // matched a known alias, no review needed
  POSSIBLE: 'possible_match',     // needs human confirmation
  NEW: 'new_player',              // no match found, needs human confirmation to create
};

/**
 * @param {string} fullName - raw "Athlete" field from Hudl, e.g. "Keegan James Short"
 * @param {Array<{id, firstName, lastName, graduationYear}>} existingPlayers
 * @param {Array<{playerId, aliasFirstName, aliasLastName}>} existingAliases
 * @returns {{ status: string, playerId: string|null, candidates: Array, reason: string }}
 */
function matchPlayer(fullName, existingPlayers, existingAliases) {
  const normalized = normalize(fullName);

  // 1. Exact alias match — someone already confirmed this exact name before.
  const aliasHit = existingAliases.find(
    (a) => normalize(`${a.aliasFirstName} ${a.aliasLastName}`) === normalized
  );
  if (aliasHit) {
    return { status: MATCH.ALIAS, playerId: aliasHit.playerId, candidates: [], reason: 'Matched known alias' };
  }

  // 2. Exact match against canonical first+last name.
  const exactHit = existingPlayers.find(
    (p) => normalize(`${p.firstName} ${p.lastName}`) === normalized
  );
  if (exactHit) {
    return { status: MATCH.EXACT, playerId: exactHit.id, candidates: [], reason: 'Exact name match' };
  }

  // 3. No exact hit — try every plausible first/last split (handles middle
  // names/suffixes) and see if any split's last name + first-word-of-first-name
  // matches an existing player. Collect ALL plausible matches rather than
  // picking one — if there's more than one, or exactly one but the split
  // was non-trivial, this is a POSSIBLE match for human review, never an
  // auto-resolve.
  const words = fullName.trim().split(/\s+/);
  const candidateSplits = generateSplits(words);

  const candidates = [];
  for (const split of candidateSplits) {
    const hit = existingPlayers.find(
      (p) =>
        normalize(p.lastName) === normalize(split.lastName) &&
        normalize(p.firstName).startsWith(normalize(split.firstName).slice(0, 3))
    );
    if (hit && !candidates.some((c) => c.id === hit.id)) {
      candidates.push(hit);
    }
  }

  if (candidates.length > 0) {
    return {
      status: MATCH.POSSIBLE,
      playerId: null,
      candidates,
      reason: `No exact match, but ${candidates.length} plausible existing player(s) found — likely a name variant (middle name, nickname, etc.)`,
    };
  }

  return {
    status: MATCH.NEW,
    playerId: null,
    candidates: [],
    reason: 'No existing player or alias resembles this name — likely a new player',
  };
}

/**
 * Generates plausible (firstName, lastName) splits for a multi-word name,
 * since we can't know where a middle name starts. E.g. "Keegan James Short"
 * yields: {first: "Keegan James", last: "Short"} AND {first: "Keegan", last: "Short"}
 * (dropping middle words), so a match against the canonical "Keegan Short"
 * is still found even though the naive split guessed wrong.
 */
function generateSplits(words) {
  if (words.length <= 2) {
    return [{ firstName: words[0] || '', lastName: words[words.length - 1] || '' }];
  }
  const splits = [];
  // Naive: everything but last word is first name.
  splits.push({ firstName: words.slice(0, -1).join(' '), lastName: words[words.length - 1] });
  // First word only + last word (drops any middle words entirely).
  splits.push({ firstName: words[0], lastName: words[words.length - 1] });
  return splits;
}

function normalize(str) {
  return str.trim().toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ');
}

module.exports = { matchPlayer, MATCH, generateSplits };
