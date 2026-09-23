-- TM-36 point 3: season records calculated from game results.
--
-- is_league_game: set per game from a checkbox on the import form.
-- Regular-season games only (a playoff game is never a league game).
ALTER TABLE games ADD COLUMN is_league_game BOOLEAN NOT NULL DEFAULT false;

-- auto_record: when true, this season's regular/playoff/total (and
-- league, if it has a league) W/L are recalculated from game results
-- on every import, instead of being hand-entered. Every existing
-- season stays false (hand-entered records untouched). The Advance
-- Season action sets it true on each new season row, so calculated
-- records take over "going forward" from the next season on.
ALTER TABLE program_seasons ADD COLUMN auto_record BOOLEAN NOT NULL DEFAULT false;

-- Read-only sanity check (changes nothing): what the calculated logic
-- WOULD produce for each season that has game data, next to the
-- hand-entered record, so the logic can be checked against real,
-- known results (e.g. 2026) before any season relies on it.
-- League columns will read 0-0 for older seasons since no games were
-- ever tagged as league games before this migration.
WITH game_scores AS (
  SELECT g.id, g.season_year, g.game_type, g.is_league_game,
         COALESCE(tgs.goals, pl.goals) AS gf,
         COALESCE(tgs.goals_against, pl.goals_against) AS ga
  FROM games g
  LEFT JOIN team_game_stats tgs ON tgs.game_id = g.id
  LEFT JOIN (
    SELECT game_id, SUM(goals) AS goals, SUM(goals_against) AS goals_against
    FROM game_stat_lines GROUP BY game_id
  ) pl ON pl.game_id = g.id
  WHERE g.team_id = (SELECT id FROM teams WHERE slug = 'sjj')
)
SELECT ps.season_year,
       ps.regular_wins || '-' || ps.regular_losses AS regular_entered,
       COUNT(*) FILTER (WHERE gs.game_type = 'regular' AND gs.gf > gs.ga) || '-' ||
       COUNT(*) FILTER (WHERE gs.game_type = 'regular' AND gs.gf < gs.ga) AS regular_calculated,
       ps.playoff_wins || '-' || ps.playoff_losses AS playoff_entered,
       COUNT(*) FILTER (WHERE gs.game_type = 'playoff' AND gs.gf > gs.ga) || '-' ||
       COUNT(*) FILTER (WHERE gs.game_type = 'playoff' AND gs.gf < gs.ga) AS playoff_calculated,
       COUNT(*) FILTER (WHERE gs.gf IS NULL OR gs.ga IS NULL) AS games_without_score,
       COUNT(*) FILTER (WHERE gs.gf = gs.ga) AS games_tied_score
FROM program_seasons ps
JOIN game_scores gs ON gs.season_year = ps.season_year
WHERE ps.team_id = (SELECT id FROM teams WHERE slug = 'sjj')
GROUP BY ps.season_year, ps.regular_wins, ps.regular_losses, ps.playoff_wins, ps.playoff_losses
ORDER BY ps.season_year;
