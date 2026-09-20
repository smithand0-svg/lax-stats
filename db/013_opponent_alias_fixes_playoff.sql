-- TM-16 follow-on, same root cause as 012: "Benedictine Cleveland" (used
-- in the hand-curated static PLAYOFF records for 2021/2022/2023) and
-- "Benedictine" (the registered opponent, and what the live Hudl playoff
-- imports for those same games use) were never linked in
-- opponent_aliases -- so the canonicalizer couldn't recognize them as
-- the same game, and both spellings showed up as separate Team Stats
-- (Playoffs) top-10 entries for Points/Goals/Assists/Goals Against.
--
-- No separate "Benedictine Cleveland" opponents row exists (only
-- "Benedictine" is registered), so this is purely additive -- just the
-- missing alias, same shape as 012's "Central Catholic" fix. No
-- historical `games` or `team_game_stats` rows need to change, since
-- games.opponent is free-text with no FK to this lookup.
INSERT INTO opponent_aliases (opponent_id, alias_name, source)
SELECT id, 'Benedictine Cleveland', 'TM-16 dedup fix 2026-09-20 -- merged with live "Benedictine" playoff imports'
FROM opponents WHERE team_id = 1 AND name = 'Benedictine';
