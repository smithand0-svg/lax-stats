-- Fix: db/025 and db/026 resolved player_id with an EXACT case-
-- insensitive full-name match only (same as db/005's original pattern)
-- -- unlike the admin form's own resolver (src/lib/playerLookup.js),
-- which falls back to a fuzzy last-name + first-3-letters-of-first-
-- name match for exactly this reason (Zack/Zach, Nick/Nicholas,
-- Sam/Samuel...). The Yearly_Awards spreadsheet wrote "Nick Bowers",
-- but backfillHistorical.js's own fuzzy matching means the live
-- players row was created as "Nicholas Bowers" -- an exact match never
-- had a chance, so that row (and potentially others) got a NULL
-- player_id it shouldn't have.
--
-- This retroactively applies the SAME fuzzy rule (mirroring
-- makePlayerResolver in src/lib/playerLookup.js) to every row that
-- currently has player_id IS NULL, rather than hand-fixing Nick Bowers
-- alone -- there is no reliable way to know from here whether he was
-- the only casualty of this gap without re-running the same logic
-- against everything.
--
-- Safe to run more than once: only touches rows still NULL, and an
-- admin-form-entered row already correctly resolved (or already tried
-- and genuinely failed to match anyone) is left untouched either way.

-- team_awards: no grad_year column exists here, so disambiguate a
-- multi-candidate fuzzy match by season_year (same rough proxy
-- db/025/db/026 already used for their initial exact-match inserts).
UPDATE team_awards ta
SET player_id = pl.id
FROM teams t
CROSS JOIN LATERAL (
  SELECT p2.id, p2.graduation_year
  FROM players p2
  WHERE p2.team_id = t.id
    AND lower(p2.last_name) = lower(regexp_replace(ta.player_name, '^.*\s', ''))
    AND left(lower(p2.first_name), 3) = left(lower(regexp_replace(ta.player_name, '\s+\S+$', '')), 3)
    AND length(left(lower(regexp_replace(ta.player_name, '\s+\S+$', '')), 3)) = 3
  ORDER BY (p2.graduation_year = ta.season_year) DESC NULLS LAST, p2.id
  LIMIT 1
) pl
WHERE ta.team_id = t.id
  AND t.slug = 'sjj'
  AND ta.player_id IS NULL;

-- season_honors: has a real grad_year column -- use it directly rather
-- than the season_year proxy.
UPDATE season_honors sh
SET player_id = pl.id
FROM teams t
CROSS JOIN LATERAL (
  SELECT p2.id
  FROM players p2
  WHERE p2.team_id = t.id
    AND lower(p2.last_name) = lower(regexp_replace(sh.player_name, '^.*\s', ''))
    AND left(lower(p2.first_name), 3) = left(lower(regexp_replace(sh.player_name, '\s+\S+$', '')), 3)
    AND length(left(lower(regexp_replace(sh.player_name, '\s+\S+$', '')), 3)) = 3
  ORDER BY (p2.graduation_year = sh.grad_year) DESC NULLS LAST, p2.id
  LIMIT 1
) pl
WHERE sh.team_id = t.id
  AND t.slug = 'sjj'
  AND sh.player_id IS NULL;

-- Run this to see exactly what changed and spot-check it:
--   SELECT player_name, player_id FROM team_awards WHERE team_id = (SELECT id FROM teams WHERE slug='sjj') ORDER BY player_name;
--   SELECT player_name, player_id FROM season_honors WHERE team_id = (SELECT id FROM teams WHERE slug='sjj') ORDER BY player_name;
-- Any player_name still showing a NULL player_id after this is a
-- genuinely unresolvable name (a real nickname/spelling the fuzzy rule
-- can't bridge, or someone with no players row at all) -- worth a look,
-- but not necessarily a bug.
