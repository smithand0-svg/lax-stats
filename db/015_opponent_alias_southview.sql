-- TM-16 follow-on: "Southview" and "Sylvania Southview" confirmed by
-- Andy to be the same real school -- same unlinked-duplicate shape as
-- Northview/Sylvania Northview in 012, and now an ACTIVE collision
-- (not just latent) now that a value of 7 qualifies on a board they
-- both land on.
--
-- "Sylvania Southview" is kept as canonical -- it's the fuller name,
-- already has established alias history (SYLVANIA SOUTHVIEW), and is
-- what the live/historical record already uses more broadly.
INSERT INTO opponent_aliases (opponent_id, alias_name, source)
SELECT id, 'Southview', 'TM-16 dedup fix 2026-09-20 -- confirmed same school as Sylvania Southview'
FROM opponents WHERE team_id = 1 AND name = 'Sylvania Southview';

-- The standalone "Southview" opponent row is now redundant, same
-- reasoning as the Northview cleanup in 012: matchOpponent checks
-- aliases before exact-name matches, so the alias above already makes
-- any future "Southview" entry resolve to "Sylvania Southview".
-- Removing the row keeps it from showing up as a second, separately
-- pickable option in the admin import autocomplete. Safe to delete:
-- games.opponent has no FK to this table, and no opponent_aliases rows
-- reference this opponent_id (confirmed before writing this migration).
DELETE FROM opponents WHERE team_id = 1 AND name = 'Southview';
