-- Found while seeding TM-19's shutout data: "Walsh" (Andy's shorthand,
-- used in the shutouts sheet) was never linked to the registered
-- "Walsh Jesuit" opponent. Same shape as every other alias fix this
-- session -- purely additive, no games/team_game_stats rows to touch.
INSERT INTO opponent_aliases (opponent_id, alias_name, source)
SELECT id, 'Walsh', 'TM-19 fix 2026-09-21 -- found while seeding shutout data'
FROM opponents WHERE team_id = 1 AND name = 'Walsh Jesuit';
