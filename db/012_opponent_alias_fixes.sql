-- TM-16 follow-on: two opponent-name variants were never linked in
-- opponents/opponent_aliases, so the canonicalization added in commit
-- 6e26002 couldn't recognize them as the same team and both spellings
-- kept showing up as separate Team Stats top-10 entries.
--
-- games.opponent is a free-text column (no FK to opponents.id) -- these
-- tables exist purely as a lookup for admin-import matching and the
-- Team Stats canonicalizer. So this migration only touches
-- opponents/opponent_aliases; no historical `games` or
-- `team_game_stats` rows need to change.
--
-- 1) "Northview" (live Hudl imports, 2021/2022/2024/2026) and
--    "Sylvania Northview" (LaxPower historical backfill, 2010-2019)
--    are the same real opponent, registered as two separate `opponents`
--    rows. "Sylvania Northview" is kept as canonical (it's the fuller
--    name already used across the historical record and already has
--    an alias row); "Northview" becomes an alias of it.
INSERT INTO opponent_aliases (opponent_id, alias_name, source)
SELECT id, 'Northview', 'TM-16 dedup fix 2026-09-19 -- merged with live "Northview" imports'
FROM opponents WHERE team_id = 1 AND name = 'Sylvania Northview';

-- The standalone "Northview" opponent row is now redundant -- matchOpponent
-- checks aliases before exact-name matches, so the alias above already
-- makes any future "Northview" entry resolve to "Sylvania Northview".
-- Removing the row also keeps it from appearing as a second, separately
-- pickable option in the admin import autocomplete. Safe to delete:
-- games.opponent has no FK to this table, and no opponent_aliases rows
-- reference this opponent_id.
DELETE FROM opponents WHERE team_id = 1 AND name = 'Northview';

-- 2) "Central Catholic" (used in the hand-curated static Team Stats
--    records for 2015/2016) and "Toledo Central Catholic" (the
--    registered opponent, already aliased for case variants and
--    "Toledo Cath Central") are the same team -- "Central Catholic" was
--    never linked at all, so it fell back to itself and never merged.
--    No separate "Central Catholic" opponents row exists, so nothing to
--    delete here -- just add the missing alias.
INSERT INTO opponent_aliases (opponent_id, alias_name, source)
SELECT id, 'Central Catholic', 'TM-16 dedup fix 2026-09-19 -- merged with static 2015/2016 records'
FROM opponents WHERE team_id = 1 AND name = 'Toledo Central Catholic';
