-- One-time backfill: set `round` on the specific playoff games that
-- currently appear in a Team Stats top-10 list (Points, Goals, Assists,
-- Goals Against single-game boards), sourced from the original Playoff
-- Team Stats PDF and cross-checked against the already-coded static
-- entries (exact opponent/value match).
--
-- Per Andy (2026-09-19): historic playoff games NOT in a current top-10
-- are intentionally left alone -- round capture starts fresh going
-- forward via the admin import UI (TM-26). This backfill covers only
-- the ~22 specific games behind today's top-10 entries.
--
-- Matched by (team_id, opponent, game_date). If a game_date here
-- doesn't exactly match what's actually in the games table (e.g. a
-- historical import used a slightly different date), that UPDATE
-- simply affects 0 rows -- check the row count Postgres reports for
-- each statement, or run the SELECT at the bottom afterward to confirm
-- all 22 landed.

BEGIN;

UPDATE games SET round = 64 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Benedictine Cleveland' AND game_date = '2023-05-16';
UPDATE games SET round = 64 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Benedictine Cleveland' AND game_date = '2022-05-17';
UPDATE games SET round = 64 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Sylvania Southview' AND game_date = '2019-05-13';
UPDATE games SET round = 16 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'St Francis DeSales - Toledo' AND game_date = '2022-05-23';
UPDATE games SET round = 64 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Benedictine Cleveland' AND game_date = '2021-05-17';
UPDATE games SET round = 32 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Padua Franciscan' AND game_date = '2026-05-20';
UPDATE games SET round = 32 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Holy Name' AND game_date = '2022-05-20';
UPDATE games SET round = 32 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Rocky River' AND game_date = '2023-05-19';
UPDATE games SET round = 64 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Ottawa Hills' AND game_date = '2025-05-16';
UPDATE games SET round = 4  WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Kent Roosevelt' AND game_date = '2004-06-02';
UPDATE games SET round = 64 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Westerville North' AND game_date = '2009-05-23';
UPDATE games SET round = 64 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Sylvania Northview' AND game_date = '2011-05-19';
UPDATE games SET round = 64 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Perrysburg' AND game_date = '2005-05-21';
UPDATE games SET round = 32 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Westlake OH' AND game_date = '2019-05-16';
UPDATE games SET round = 64 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'St Francis DeSales - Toledo' AND game_date = '2026-05-25';
UPDATE games SET round = 64 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Sylvania Southview' AND game_date = '2024-05-16';
UPDATE games SET round = 16 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Walsh Jesuit' AND game_date = '2023-05-22';
UPDATE games SET round = 8  WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Ottawa Hills' AND game_date = '2022-05-26';
UPDATE games SET round = 32 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Perrysburg' AND game_date = '2016-05-19';
UPDATE games SET round = 16 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Rocky River' AND game_date = '2024-05-28';
UPDATE games SET round = 64 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Perrysburg' AND game_date = '2015-05-23';
UPDATE games SET round = 64 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Brunswick' AND game_date = '2012-05-17';

COMMIT;

-- Run after COMMIT to confirm how many of the 22 actually matched a real row:
-- SELECT opponent, game_date, round FROM games
-- WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND round IS NOT NULL
-- ORDER BY game_date;
