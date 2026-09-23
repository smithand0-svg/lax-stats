-- John Emmenecker's Legacy (pre-2015, career-only) record already had
-- assists = 59 on file; goals was never recorded (NULL). Andy found
-- the real total: 35. Filling only the gap, guarded by "goals IS NULL"
-- so this can't silently overwrite a different number if that
-- assumption turns out wrong -- if it updates 0 rows, that's the
-- signal to double check rather than assume it worked.
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
  AND goals IS NULL;

-- Confirms exactly one row changed, now showing 35 goals / 59 assists
-- (points = 94 wherever the app computes it downstream):
SELECT player_id, season_year, game_type, goals, assists
FROM season_stat_summaries
WHERE player_id = (
  SELECT id FROM players
  WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
    AND first_name = 'John' AND last_name = 'Emmenecker'
);
