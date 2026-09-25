-- TM-44 shutout discrepancy report. READ-ONLY: changes nothing.
-- Run in phpPgAdmin and send Claude the output of both queries.
--
-- The CURRENT Leaderboard rule counts a player as having a shutout in
-- any imported game where that player's goals_against is 0. Every
-- field player's row records 0 goals against, and the team's actual
-- score is never checked. The PROPOSED rule: a game where the TEAM
-- allowed 0 goals, credited to each goalie who made at least one save.

-- Query 1: every imported game the current rule treats as a shutout,
-- with what the proposed rule says about it.
WITH team_ga AS (
  SELECT g.id AS game_id,
         tgs.goals_against AS ga_team_totals,
         (SELECT SUM(goals_against) FROM game_stat_lines x WHERE x.game_id = g.id) AS ga_player_lines
  FROM games g
  LEFT JOIN team_game_stats tgs ON tgs.game_id = g.id
  WHERE g.team_id = (SELECT id FROM teams WHERE slug = 'sjj')
),
credited AS (
  SELECT g.id AS game_id, g.game_date, g.season_year, g.game_type, g.opponent,
         COUNT(*) AS players_credited_now,
         COUNT(*) FILTER (WHERE gsl.saves > 0) AS goalies_with_saves,
         string_agg(p.first_name || ' ' || p.last_name || ' (' || gsl.saves || ' sv)', ', ' ORDER BY gsl.saves DESC)
           FILTER (WHERE gsl.saves > 0) AS goalies
  FROM game_stat_lines gsl
  JOIN games g ON g.id = gsl.game_id
  JOIN players p ON p.id = gsl.player_id
  WHERE g.team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND gsl.goals_against = 0
  GROUP BY g.id, g.game_date, g.season_year, g.game_type, g.opponent
)
SELECT c.game_date, c.season_year, c.game_type, c.opponent,
       c.players_credited_now, c.goalies_with_saves, c.goalies,
       t.ga_team_totals, t.ga_player_lines,
       CASE
         WHEN COALESCE(t.ga_team_totals, t.ga_player_lines) > 0
           THEN 'NOT a shutout: team allowed ' || COALESCE(t.ga_team_totals, t.ga_player_lines) || ' goals'
         WHEN c.goalies_with_saves = 0
           THEN 'Team allowed 0, but no goalie recorded a save: check this game'
         ELSE 'Real shutout: credit goalie(s) listed'
       END AS proposed_verdict
FROM credited c
JOIN team_ga t ON t.game_id = c.game_id
ORDER BY c.game_date NULLS LAST, c.opponent;

-- Query 2: disagreements between the two goals-against sources, where
-- the team-totals import and the individual stat lines don't match.
-- The proposed rule trusts team totals first, so any row here is worth
-- a look.
SELECT g.game_date, g.opponent, tgs.goals_against AS ga_team_totals,
       SUM(gsl.goals_against) AS ga_player_lines
FROM games g
JOIN team_game_stats tgs ON tgs.game_id = g.id
JOIN game_stat_lines gsl ON gsl.game_id = g.id
WHERE g.team_id = (SELECT id FROM teams WHERE slug = 'sjj')
GROUP BY g.id, g.game_date, g.opponent, tgs.goals_against
HAVING tgs.goals_against IS DISTINCT FROM SUM(gsl.goals_against)
ORDER BY g.game_date;
