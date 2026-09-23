-- Both db/036 (guarded on "goals IS NULL") and db/037 (guarded on
-- "goals = 59") turned out to be guarding against the wrong current
-- value -- the live screenshot shows no Goals card at all and Points
-- = 59, meaning goals has actually been NULL the whole time and
-- neither previous attempt's WHERE clause ever matched. No more
-- guessing at the current value -- this just sets it, scoped tightly
-- enough (one specific player, season_year IS NULL, game_type =
-- 'combined') that there's no real risk of hitting the wrong row.
UPDATE season_stat_summaries
SET goals = 35
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
  AND player_id = (
    SELECT id FROM players
    WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
      AND first_name = 'John' AND last_name = 'Emmenecker'
  )
  AND season_year IS NULL
  AND game_type = 'combined';

-- Confirms exactly one row changed, now showing 35 goals / 59 assists:
SELECT player_id, season_year, game_type, goals, assists
FROM season_stat_summaries
WHERE player_id = (
  SELECT id FROM players
  WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
    AND first_name = 'John' AND last_name = 'Emmenecker'
);
