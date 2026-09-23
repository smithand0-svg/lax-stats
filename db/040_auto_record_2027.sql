-- TM-36: the 2027 row was created by Advance BEFORE db/039 added
-- auto_record, so it got the column's default (false). Rows created by
-- Advance from now on get auto_record = true automatically; this is a
-- one-time correction for the one row that predates that.
--
-- Scoped by identity (team + year), not by current value. League W/L
-- start at 0-0 only when the season has a league, matching what
-- Advance now does for a new row.
UPDATE program_seasons
SET auto_record   = true,
    league_wins   = CASE WHEN league_name IS NOT NULL THEN 0 END,
    league_losses = CASE WHEN league_name IS NOT NULL THEN 0 END
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
  AND season_year = 2027;

-- Verify: expect exactly one row, auto_record = true.
SELECT season_year, head_coach, division, league_name, auto_record,
       regular_wins, regular_losses, league_wins, league_losses
FROM program_seasons
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
  AND season_year = 2027;
