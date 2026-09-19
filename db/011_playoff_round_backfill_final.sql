-- The last three games from 009/010's "genuinely new, no PDF source"
-- list. Researched and provided by Andy on 2026-09-19.

BEGIN;

UPDATE games SET round = 32 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Ottawa Hills' AND game_date = '2021-05-20';
UPDATE games SET round = 8  WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Shaker Heights' AND game_date = '2004-05-29';

-- Above-average but not certain confidence, per Andy: his notes show
-- the team did not reach the Sweet 16 that year, so if this game is
-- the first playoff game of 2010, Round of 64 is the only value that's
-- consistent with that. Flagging here in case better records surface
-- later and this needs revisiting.
UPDATE games SET round = 64 WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND opponent = 'Perrysburg' AND game_date = '2010-05-22';

COMMIT;
