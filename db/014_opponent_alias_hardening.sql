-- TM-16 follow-on, found via a full audit of every opponent name used in
-- STATIC_GAME_RECORDS against the registered opponents/opponent_aliases
-- (rather than waiting for each one to surface as its own screenshot).
--
-- 1) "U of D Jesuit" (static combined record, 2025) vs "University of
--    Detroit Jesuit" (registered opponent, live 2025-05-01 Hudl import,
--    see 007_team_game_stats_backfill.sql) -- this is an ACTIVE duplicate,
--    already visible on Team Stats today (2025, value 36 shown twice in
--    the first screenshot from this session, alongside the Northview/
--    Central Catholic pairs -- missed at the time since attention was on
--    those two).
INSERT INTO opponent_aliases (opponent_id, alias_name, source)
SELECT id, 'U of D Jesuit', 'TM-16 dedup fix 2026-09-20 -- merged with live "University of Detroit Jesuit" 2025 import'
FROM opponents WHERE team_id = 1 AND name = 'University of Detroit Jesuit';

-- 2) "Stow Monroe" (static combined record, 2015) vs "Stow Monroe Falls"
--    (registered opponent) -- no live game exists for this opponent yet,
--    so this isn't visibly duplicated today, but it's the same unlinked-
--    abbreviation gap and would silently recur the moment a live game
--    against Stow Monroe Falls is ever imported. Fixed now rather than
--    waiting for that to happen.
INSERT INTO opponent_aliases (opponent_id, alias_name, source)
SELECT id, 'Stow Monroe', 'TM-16 dedup fix 2026-09-20 -- preventive, no live collision yet'
FROM opponents WHERE team_id = 1 AND name = 'Stow Monroe Falls';

-- NOT fixed here, flagged instead: "Southview" (combined static record,
-- 2021 assists) and "Sylvania Southview" (playoff static records,
-- 2019/2024) are two SEPARATE registered opponents, same unlinked shape
-- as the bugs above -- but unlike those, it's genuinely unclear whether
-- they're the same real school or two different ones (same ambiguity
-- category as TM-14's Olentangy/Liberty Olentangy question). No games
-- currently collide on this pair, so nothing is visibly broken today --
-- left for Andy to confirm before aliasing either direction.
