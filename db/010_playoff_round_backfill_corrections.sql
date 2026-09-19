-- Corrections to 009_playoff_round_backfill.sql: several UPDATEs there
-- matched zero rows because the opponent name I assumed from the PDF
-- differs from what's actually canonicalized in the games table.
-- Confirmed by Andy running a diagnostic SELECT on 2026-09-19.

BEGIN;

-- "Benedictine Cleveland" (PDF) is actually stored as "Benedictine"
UPDATE games SET round = 64 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Benedictine' AND game_date = '2023-05-16';
UPDATE games SET round = 64 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Benedictine' AND game_date = '2022-05-17';
UPDATE games SET round = 64 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Benedictine' AND game_date = '2021-05-17';

-- "St Francis DeSales - Toledo" (PDF) is actually stored as "St. Francis Toledo".
-- Also: the 2026 game's real date is 2026-05-15, not 2026-05-25 as the PDF
-- transcription had it (confirmed by the assists value, 8, matching exactly).
UPDATE games SET round = 16 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'St. Francis Toledo' AND game_date = '2022-05-23';
UPDATE games SET round = 64 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'St. Francis Toledo' AND game_date = '2026-05-15';

-- "Westlake OH" (PDF) is actually stored as "Westlake"
UPDATE games SET round = 32 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Westlake' AND game_date = '2019-05-16';

-- The 2024 Sylvania Southview game is inconsistently stored as just
-- "Southview" (the 2010/2013/2019 games against the same opponent use
-- the full "Sylvania Southview" -- this one date only differs)
UPDATE games SET round = 64 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Southview' AND game_date = '2024-05-16';

COMMIT;

-- Still needed (Andy to provide, not yet known): rounds for these three
-- games, which weren't in the original PDF's top-10 lists at all --
-- surfaced only because live data now populates the board more fully:
--   Ottawa Hills,    2021-05-20 (goals against)
--   Shaker Heights,  2004-05-29 (goals against)
--   Perrysburg,      2010-05-22 (goals against)
