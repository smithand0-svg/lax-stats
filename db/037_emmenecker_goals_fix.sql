-- db/036 didn't actually fix anything -- its guard was "goals IS NULL",
-- but goals was already (incorrectly) set to 59, same as assists, not
-- NULL. Andy confirmed live: both fields show 59. This corrects goals
-- to 35, guarded by "goals = 59" so it only fires on the exact known-
-- wrong value rather than blindly overwriting.
UPDATE season_stat_summaries
SET goals = 35
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
  AND player_id = (
    SELECT id FROM players
    WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
      AND first_name = 'John' AND last_name = 'Emmenecker'
  )
  AND season_year IS NULL
  AND game_type = 'combined'
  AND goals = 59;

-- Confirms exactly one row changed, now showing 35 goals / 59 assists:
SELECT player_id, season_year, game_type, goals, assists
FROM season_stat_summaries
WHERE player_id = (
  SELECT id FROM players
  WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
    AND first_name = 'John' AND last_name = 'Emmenecker'
);
