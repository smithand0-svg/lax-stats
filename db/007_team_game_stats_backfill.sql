-- Backfill: team-level per-game stats for 2021-2026, from Hudl 'All Athletes
-- -- Totals' team exports. 120 games total. Regular/playoff split derived from
-- Season History's known playoff game counts per year, cross-validated against
-- each source file's own total game count (exact match, all 6 years).
--
-- games.round is left NULL — not available at the individual-game level in
-- this data source.
--
-- ASSUMES team_id = 1 (the only team in this single-tenant deployment today).
-- Adjust if that's not correct.

BEGIN;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2021-05-24', 2021, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 8, 4, 21, 13, 38.1,
  59, 19, 2.0, 7.0, 47.3,
  24, 13, 9, 59.1,
  4, 16, 20.0,
  20, 9, 11, 45.0,
  21, 13, 7,
  1, 6, 10, 14, 58.3,
  7, 2, 28.6, 3, 0, 0.0,
  9, 5, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ottawa Hills', '2021-05-20', 2021, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 8, 4, 48, 24, 16.7,
  83, 18, 1.0, 10.0, 51.3,
  42, 16, 5, 76.2,
  10, 17, 37.0,
  15, 6, 9, 40.0,
  19, 12, 4,
  3, 21, 4, 4, 50.0,
  5, 1, 20.0, 4, 1, 25.0,
  12, 5, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Benedictine', '2021-05-17', 2021, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 17, 5, 42, 29, 40.5,
  64, 25, 1.0, 3.0, 50.1,
  38, 17, 1, 94.4,
  11, 15, 42.3,
  21, 8, 13, 38.1,
  14, 8, 6,
  2, 22, 1, 1, 50.0,
  0, 0, 0.0, 3, 0, 0.0,
  12, 9, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Westlake', '2021-05-08', 2021, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 11, 6, 28, 16, 39.3,
  68, 18, 2.0, 6.0, 48.1,
  25, 14, 8, 63.6,
  9, 11, 45.0,
  22, 7, 15, 31.8,
  19, 8, 11,
  0, 17, 9, 9, 50.0,
  4, 3, 75.0, 3, 2, 66.7,
  8, 4, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2021-05-06', 2021, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 10, 5, 24, 15, 41.7,
  65, 17, 2.0, 6.0, 43.5,
  22, 11, 9, 55.0,
  3, 12, 20.0,
  26, 8, 18, 30.8,
  22, 17, 5,
  1, 13, 15, 10, 40.0,
  3, 2, 66.7, 7, 4, 57.1,
  12, 5, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Anthony Wayne', '2021-05-04', 2021, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 10, 8, 23, 17, 43.5,
  53, 20, 2.0, 5.0, 50.3,
  26, 9, 7, 56.3,
  3, 11, 21.4,
  23, 15, 8, 65.2,
  20, 14, 6,
  2, 5, 9, 8, 47.1,
  1, 1, 100.0, 5, 4, 80.0,
  7, 4, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Gilmour Academy', '2021-05-01', 2021, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 13, 9, 31, 22, 41.9,
  78, 24, 2.0, 6.0, 54.3,
  32, 15, 10, 60.0,
  7, 17, 29.2,
  22, 13, 9, 59.1,
  22, 7, 15,
  3, 8, 7, 15, 68.2,
  6, 2, 33.3, 4, 2, 50.0,
  10, 8, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Ignatius (Prep)', '2021-04-30', 2021, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 11, 6, 38, 23, 28.9,
  67, 25, 1.0, 6.0, 53.1,
  46, 14, 8, 63.6,
  8, 17, 32.0,
  20, 14, 6, 70.0,
  15, 8, 5,
  0, 15, 6, 7, 53.8,
  5, 2, 40.0, 2, 0, 0.0,
  12, 7, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Bay', '2021-04-24', 2021, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 9, 6, 21, 15, 42.9,
  50, 26, 2.0, 5.0, 45.6,
  31, 14, 3, 82.4,
  6, 15, 28.6,
  18, 13, 5, 72.2,
  20, 13, 6,
  1, 10, 8, 9, 52.9,
  4, 1, 25.0, 6, 2, 33.3,
  8, 2, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2021-04-22', 2021, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 5, 4, 18, 8, 27.8,
  65, 19, 3.0, 13.0, 49.7,
  41, 7, 11, 38.9,
  1, 14, 6.7,
  21, 13, 8, 61.9,
  27, 14, 12,
  1, 13, 14, 6, 30.0,
  5, 0, 0.0, 4, 2, 50.0,
  12, 5, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Walsh Jesuit', '2021-04-17', 2021, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 6, 4, 25, 20, 24.0,
  52, 13, 2.0, 8.0, 42.7,
  21, 12, 6, 66.7,
  2, 17, 10.5,
  19, 3, 16, 15.8,
  13, 5, 7,
  5, 4, 11, 16, 59.3,
  2, 1, 50.0, 6, 3, 50.0,
  18, 3, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ottawa Hills', '2021-04-14', 2021, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 13, 11, 29, 19, 44.8,
  68, 22, 2.0, 5.0, 57.3,
  34, 13, 8, 61.9,
  4, 11, 26.7,
  23, 11, 12, 47.8,
  17, 11, 6,
  0, 9, 8, 4, 33.3,
  5, 3, 60.0, 6, 3, 50.0,
  8, 2, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Olmsted Falls', '2021-04-10', 2021, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 9, 7, 23, 19, 39.1,
  72, 18, 3.0, 8.0, 44.2,
  30, 10, 14, 41.7,
  5, 9, 35.7,
  27, 10, 17, 37.0,
  31, 19, 12,
  1, 9, 15, 11, 42.3,
  4, 3, 75.0, 4, 2, 50.0,
  12, 5, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Gahanna Lincoln', '2021-03-27', 2021, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 21, 15, 59, 31, 35.6,
  83, 30, 1.0, 3.0, 70.4,
  62, 11, 1, 91.7,
  18, 6, 75.0,
  25, 22, 3, 88.0,
  21, 13, 8,
  0, 21, 0, 3, 100.0,
  1, 1, 100.0, 0, 0, 0.0,
  5, 3, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Northview', '2021-03-25', 2021, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 18, 12, 57, 42, 31.6,
  80, 34, 1.0, 4.0, 61.9,
  56, 17, 7, 70.8,
  18, 9, 66.7,
  29, 23, 6, 79.3,
  10, 2, 8,
  1, 3, 8, 7, 46.7,
  4, 1, 25.0, 3, 0, 0.0,
  5, 0, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Southview', '2021-03-23', 2021, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 16, 13, 49, 31, 32.7,
  70, 24, 1.0, 4.0, 65.8,
  42, 8, 1, 88.9,
  15, 12, 55.6,
  23, 18, 5, 78.3,
  8, 5, 3,
  0, 14, 3, 0, 0.0,
  1, 1, 100.0, 1, 0, 0.0,
  1, 0, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Oakwood', '2021-03-20', 2021, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 16, 9, 46, 37, 34.8,
  78, 24, 1.0, 4.0, 61.0,
  44, 9, 6, 60.0,
  8, 9, 47.1,
  26, 17, 9, 65.4,
  15, 11, 4,
  1, 12, 7, 10, 58.8,
  5, 1, 20.0, 3, 2, 66.7,
  5, 0, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Chagrin Falls', '2022-05-31', 2022, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 5, 4, 18, 11, 27.8,
  55, 16, 3.0, 11.0, 38.4,
  23, 9, 4, 69.2,
  6, 13, 31.6,
  24, 10, 14, 41.7,
  21, 13, 5,
  0, 11, 18, 8, 30.8,
  5, 0, 0.0, 1, 1, 100.0,
  7, 0, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ottawa Hills', '2022-05-26', 2022, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 9, 7, 35, 23, 25.7,
  70, 23, 2.0, 7.0, 49.6,
  38, 19, 8, 70.4,
  7, 16, 30.4,
  20, 8, 12, 40.0,
  19, 8, 11,
  0, 13, 8, 7, 46.7,
  4, 0, 0.0, 6, 2, 33.3,
  11, 11, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2022-05-23', 2022, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 15, 11, 45, 41, 33.3,
  74, 15, 1.0, 4.0, 54.7,
  50, 8, 6, 57.1,
  6, 17, 26.1,
  24, 12, 12, 50.0,
  15, 3, 10,
  2, 7, 7, 17, 70.8,
  5, 4, 80.0, 4, 1, 25.0,
  14, 9, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Holy Name', '2022-05-20', 2022, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 10, 8, 48, 29, 20.8,
  71, 28, 1.0, 7.0, 62.9,
  51, 21, 2, 91.3,
  14, 14, 50.0,
  15, 11, 4, 73.3,
  17, 5, 12,
  1, 10, 3, 6, 66.7,
  1, 0, 0.0, 2, 1, 50.0,
  9, 4, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Benedictine', '2022-05-17', 2022, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 19, 14, 46, 32, 41.3,
  70, 27, 1.0, 3.0, 71.2,
  36, 11, 2, 84.6,
  6, 6, 50.0,
  25, 20, 5, 80.0,
  12, 1, 11,
  0, 9, 2, 3, 60.0,
  1, 0, 0.0, 1, 0, 0.0,
  4, 1, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Ignatius (Prep)', '2022-05-13', 2022, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 5, 4, 27, 13, 18.5,
  66, 20, 2.0, 13.0, 42.3,
  32, 19, 8, 70.4,
  3, 19, 13.6,
  21, 6, 15, 28.6,
  30, 14, 13,
  1, 13, 12, 7, 36.8,
  1, 1, 100.0, 4, 3, 75.0,
  15, 5, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2022-05-11', 2022, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 8, 6, 33, 28, 24.2,
  80, 20, 2.0, 10.0, 52.3,
  40, 15, 9, 62.5,
  11, 13, 45.8,
  16, 8, 8, 50.0,
  27, 14, 12,
  0, 13, 6, 19, 76.0,
  4, 1, 25.0, 4, 2, 50.0,
  11, 6, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Brebeuf Jesuit', '2022-05-07', 2022, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 7, 5, 37, 18, 18.9,
  57, 17, 1.0, 8.0, 56.6,
  27, 13, 6, 68.4,
  5, 11, 31.3,
  15, 6, 9, 40.0,
  12, 5, 6,
  1, 11, 5, 3, 37.5,
  1, 1, 100.0, 1, 0, 0.0,
  4, 0, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Joe''s Indiana', '2022-05-07', 2022, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 6, 1, 38, 20, 15.8,
  71, 23, 1.0, 11.0, 58.5,
  37, 16, 2, 88.9,
  4, 13, 23.5,
  15, 10, 5, 66.7,
  13, 8, 4,
  4, 8, 7, 7, 50.0,
  2, 1, 50.0, 2, 0, 0.0,
  14, 10, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2022-05-04', 2022, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 10, 5, 35, 19, 28.6,
  63, 18, 1.0, 6.0, 47.5,
  28, 15, 4, 78.9,
  6, 9, 40.0,
  19, 4, 15, 21.1,
  16, 7, 8,
  1, 13, 7, 9, 56.3,
  3, 0, 0.0, 5, 1, 20.0,
  18, 11, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Westlake', '2022-04-30', 2022, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 12, 10, 44, 33, 27.3,
  79, 26, 1.0, 6.0, 54.5,
  40, 19, 3, 86.4,
  10, 16, 38.5,
  19, 11, 8, 57.9,
  16, 10, 6,
  3, 19, 3, 12, 80.0,
  6, 2, 33.3, 2, 0, 0.0,
  6, 3, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'University of Detroit Jesuit', '2022-04-28', 2022, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 12, 10, 33, 17, 36.4,
  87, 24, 2.0, 7.0, 60.8,
  33, 12, 3, 80.0,
  13, 10, 56.5,
  21, 14, 7, 66.7,
  28, 11, 15,
  0, 10, 6, 4, 40.0,
  8, 4, 50.0, 4, 2, 50.0,
  14, 9, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Southview', '2022-04-26', 2022, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 10, 7, 42, 32, 23.8,
  81, 24, 1.0, 8.0, 66.0,
  64, 11, 7, 61.1,
  14, 3, 82.4,
  19, 14, 5, 73.7,
  25, 20, 4,
  1, 18, 5, 7, 58.3,
  2, 1, 50.0, 6, 1, 16.7,
  12, 4, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'CVCA', '2022-04-23', 2022, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 13, 8, 37, 24, 35.1,
  79, 28, 2.0, 6.0, 54.2,
  35, 20, 2, 90.9,
  9, 14, 39.1,
  22, 9, 13, 40.9,
  20, 5, 14,
  2, 11, 5, 12, 70.6,
  3, 2, 66.7, 5, 2, 40.0,
  14, 10, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Walsh Jesuit', '2022-04-22', 2022, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 10, 7, 36, 22, 27.8,
  62, 22, 1.0, 6.0, 56.6,
  31, 13, 3, 81.3,
  5, 17, 22.7,
  19, 12, 7, 63.2,
  15, 5, 8,
  1, 8, 6, 7, 53.8,
  2, 1, 50.0, 4, 3, 75.0,
  6, 0, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Northview', '2022-04-12', 2022, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 14, 8, 49, 27, 28.6,
  82, 30, 1.0, 5.0, 60.4,
  50, 21, 5, 80.8,
  15, 12, 55.6,
  23, 13, 10, 56.5,
  16, 10, 6,
  0, 23, 5, 6, 54.5,
  5, 2, 40.0, 3, 1, 33.3,
  13, 7, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Chaminade Julienne', '2022-04-09', 2022, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 14, 10, 39, 23, 35.9,
  85, 36, 2.0, 6.0, 53.5,
  47, 16, 11, 59.3,
  6, 24, 20.0,
  32, 23, 9, 71.9,
  30, 12, 18,
  0, 11, 15, 13, 46.4,
  0, 0, 0.0, 4, 0, 0.0,
  12, 5, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ottawa Hills', '2022-04-06', 2022, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 16, 8, 43, 22, 37.2,
  74, 22, 1.0, 4.0, 62.0,
  39, 10, 4, 71.4,
  6, 13, 31.6,
  25, 19, 6, 76.0,
  20, 8, 9,
  2, 9, 6, 8, 57.1,
  7, 4, 57.1, 2, 0, 0.0,
  10, 2, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Bowling Green', '2022-04-02', 2022, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 16, 9, 38, 23, 42.1,
  70, 21, 1.0, 4.0, 68.8,
  44, 5, 5, 50.0,
  13, 4, 76.5,
  23, 18, 5, 78.3,
  20, 8, 12,
  0, 15, 5, 6, 54.5,
  4, 1, 25.0, 3, 0, 0.0,
  5, 4, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Bay', '2022-03-26', 2022, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 8, 4, 29, 21, 27.6,
  70, 18, 2.0, 8.0, 48.3,
  41, 10, 11, 47.6,
  13, 14, 48.1,
  19, 10, 9, 52.6,
  27, 11, 16,
  3, 15, 7, 8, 53.3,
  3, 2, 66.7, 4, 1, 25.0,
  10, 5, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Anthony Wayne', '2022-03-24', 2022, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 10, 7, 38, 27, 26.3,
  80, 23, 2.0, 8.0, 59.7,
  34, 14, 4, 77.8,
  9, 14, 39.1,
  19, 12, 7, 63.2,
  20, 3, 14,
  1, 4, 7, 5, 41.7,
  6, 2, 33.3, 2, 1, 50.0,
  10, 2, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Oakwood', '2022-03-19', 2022, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 15, 12, 36, 19, 41.7,
  69, 20, 1.0, 4.0, 47.0,
  30, 14, 5, 73.7,
  5, 13, 27.8,
  25, 11, 14, 44.0,
  22, 6, 15,
  3, 12, 7, 17, 70.8,
  5, 3, 60.0, 6, 2, 33.3,
  14, 4, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Shaker Heights', '2022-03-18', 2022, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 5, 5, 42, 18, 11.9,
  78, 16, 1.0, 15.0, 53.2,
  43, 9, 7, 56.3,
  16, 11, 59.3,
  13, 7, 6, 53.8,
  22, 8, 13,
  1, 15, 6, 8, 57.1,
  7, 1, 14.3, 3, 2, 66.7,
  8, 4, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Olmsted Falls', '2023-05-24', 2023, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 4, 3, 36, 14, 11.1,
  62, 10, 1.0, 15.0, 56.6,
  25, 10, 8, 55.6,
  7, 10, 41.2,
  13, 2, 11, 15.4,
  15, 6, 8,
  1, 6, 5, 12, 70.6,
  6, 2, 33.3, 5, 1, 20.0,
  12, 5, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Walsh Jesuit', '2023-05-22', 2023, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 10, 7, 30, 16, 33.3,
  66, 18, 2.0, 6.0, 56.2,
  29, 15, 6, 71.4,
  5, 13, 27.8,
  14, 10, 4, 71.4,
  19, 13, 6,
  1, 13, 0, 12, 100.0,
  2, 2, 100.0, 4, 0, 0.0,
  6, 2, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Rocky River', '2023-05-19', 2023, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 13, 6, 33, 16, 39.4,
  60, 22, 1.0, 4.0, 63.1,
  45, 12, 1, 92.3,
  7, 6, 53.8,
  20, 13, 7, 65.0,
  15, 7, 7,
  0, 6, 4, 2, 33.3,
  1, 0, 0.0, 0, 0, 0.0,
  4, 2, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Benedictine', '2023-05-16', 2023, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 20, 14, 52, 26, 38.5,
  72, 32, 1.0, 3.0, 79.5,
  45, 17, 2, 89.5,
  9, 3, 75.0,
  23, 19, 4, 82.6,
  11, 4, 6,
  0, 10, 0, 3, 100.0,
  0, 0, 0.0, 2, 0, 0.0,
  8, 5, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2023-05-10', 2023, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 14, 5, 28, 21, 50.0,
  75, 26, 2.0, 5.0, 58.9,
  29, 18, 6, 75.0,
  10, 10, 50.0,
  18, 12, 6, 66.7,
  27, 17, 8,
  0, 16, 3, 6, 66.7,
  5, 3, 60.0, 3, 1, 33.3,
  8, 2, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2023-05-05', 2023, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 6, 4, 33, 16, 18.2,
  73, 15, 2.0, 12.0, 54.3,
  30, 13, 4, 76.5,
  9, 12, 42.9,
  17, 6, 11, 35.3,
  17, 10, 6,
  1, 14, 7, 8, 53.3,
  5, 2, 40.0, 6, 0, 0.0,
  12, 5, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Bay', '2023-05-02', 2023, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 13, 11, 32, 20, 40.6,
  64, 18, 2.0, 4.0, 60.1,
  44, 13, 9, 59.1,
  8, 4, 66.7,
  16, 8, 8, 50.0,
  19, 5, 14,
  0, 12, 0, 9, 100.0,
  5, 1, 20.0, 6, 0, 0.0,
  11, 1, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Orchard Lake St. Mary''s', '2023-04-29', 2023, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 7, 3, 31, 21, 22.6,
  52, 17, 1.0, 7.0, 44.6,
  28, 12, 7, 63.2,
  3, 6, 33.3,
  18, 7, 11, 38.9,
  13, 6, 7,
  1, 11, 8, 12, 60.0,
  1, 0, 0.0, 7, 0, 0.0,
  9, 7, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ottawa Hills', '2023-04-25', 2023, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 6, 4, 28, 12, 21.4,
  63, 22, 2.0, 10.0, 48.0,
  29, 15, 7, 68.2,
  5, 16, 23.8,
  17, 8, 9, 47.1,
  20, 15, 5,
  0, 19, 10, 7, 41.2,
  7, 3, 42.9, 3, 1, 33.3,
  7, 5, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Indian Hill', '2023-04-22', 2023, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 6, 3, 30, 21, 20.0,
  68, 27, 2.0, 11.0, 51.8,
  27, 17, 6, 73.9,
  4, 17, 19.0,
  18, 13, 5, 72.2,
  17, 5, 12,
  0, 5, 8, 4, 33.3,
  4, 0, 0.0, 3, 1, 33.3,
  7, 2, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Chaminade Julienne', '2023-04-21', 2023, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 12, 5, 42, 21, 28.6,
  79, 30, 1.0, 6.0, 60.4,
  42, 23, 8, 74.2,
  4, 19, 17.4,
  23, 11, 12, 47.8,
  22, 13, 9,
  0, 20, 7, 7, 50.0,
  3, 2, 66.7, 3, 1, 33.3,
  8, 1, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Westlake', '2023-04-18', 2023, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 7, 5, 31, 17, 22.6,
  74, 26, 2.0, 10.0, 54.4,
  48, 15, 7, 68.2,
  9, 13, 40.9,
  18, 12, 6, 66.7,
  26, 8, 17,
  0, 14, 6, 7, 53.8,
  4, 1, 25.0, 4, 1, 25.0,
  10, 3, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Chagrin Falls', '2023-04-15', 2023, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 10, 5, 41, 19, 24.4,
  70, 14, 1.0, 7.0, 51.4,
  33, 15, 2, 88.2,
  4, 11, 26.7,
  18, 5, 13, 27.8,
  13, 5, 8,
  2, 8, 9, 4, 30.8,
  6, 1, 16.7, 6, 2, 33.3,
  13, 3, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Walsh Jesuit', '2023-04-14', 2023, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 3, 0, 31, 13, 9.7,
  73, 22, 2.0, 24.0, 51.5,
  29, 19, 11, 63.3,
  5, 20, 20.0,
  9, 6, 3, 66.7,
  22, 13, 7,
  1, 13, 2, 11, 84.6,
  1, 0, 0.0, 2, 0, 0.0,
  10, 6, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'University of Detroit Jesuit', '2023-04-04', 2023, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 14, 10, 28, 19, 50.0,
  82, 22, 2.0, 5.0, 55.9,
  38, 17, 10, 63.0,
  13, 11, 54.2,
  18, 10, 8, 55.6,
  27, 13, 10,
  2, 23, 2, 9, 81.8,
  6, 2, 33.3, 2, 0, 0.0,
  11, 5, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Bishop Watterson', '2023-04-01', 2023, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 6, 3, 24, 15, 25.0,
  62, 20, 2.0, 10.0, 47.9,
  30, 13, 9, 59.1,
  3, 16, 15.8,
  18, 7, 11, 38.9,
  19, 8, 11,
  0, 7, 10, 11, 52.4,
  3, 1, 33.3, 5, 1, 20.0,
  11, 9, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Cranbrook', '2023-03-28', 2023, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 8, 7, 38, 26, 21.1,
  81, 17, 2.0, 10.0, 58.3,
  28, 13, 4, 76.5,
  12, 12, 50.0,
  18, 10, 8, 55.6,
  15, 3, 12,
  0, 10, 7, 2, 22.2,
  6, 2, 33.3, 4, 1, 25.0,
  7, 4, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Detroit Country Day', '2023-03-25', 2023, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 10, 6, 29, 20, 34.5,
  72, 25, 2.0, 7.0, 53.4,
  52, 12, 4, 75.0,
  4, 18, 18.2,
  30, 16, 14, 53.3,
  24, 15, 9,
  1, 16, 16, 8, 33.3,
  9, 3, 33.3, 1, 1, 100.0,
  5, 3, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Anthony Wayne', '2023-03-21', 2023, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 19, 17, 40, 28, 47.5,
  79, 27, 1.0, 4.0, 60.7,
  49, 21, 7, 75.0,
  14, 9, 60.9,
  22, 12, 10, 54.5,
  22, 9, 12,
  2, 28, 1, 4, 80.0,
  5, 2, 40.0, 1, 0, 0.0,
  9, 4, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Joseph''s', '2023-03-19', 2023, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 7, 6, 31, 13, 22.6,
  55, 15, 1.0, 7.0, 50.3,
  38, 10, 2, 83.3,
  6, 11, 35.3,
  16, 9, 7, 56.3,
  16, 11, 5,
  1, 10, 6, 4, 40.0,
  2, 2, 100.0, 3, 2, 66.7,
  6, 2, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Columbus', '2024-06-08', 2024, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 4, 2, 15, 9, 26.7,
  41, 14, 2.0, 10.0, 38.2,
  16, 9, 1, 90.0,
  5, 12, 29.4,
  23, 10, 13, 43.5,
  15, 10, 4,
  3, 4, 15, 8, 34.8,
  1, 0, 0.0, 1, 1, 100.0,
  6, 3, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'University School', '2024-06-05', 2024, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 8, 6, 25, 14, 32.0,
  60, 13, 2.0, 7.0, 55.1,
  26, 11, 7, 61.1,
  6, 10, 37.5,
  16, 4, 12, 25.0,
  18, 11, 6,
  1, 10, 5, 10, 66.7,
  5, 3, 60.0, 0, 0, 0.0,
  5, 3, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Wooster', '2024-05-30', 2024, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 9, 6, 22, 14, 40.9,
  50, 15, 2.0, 5.0, 50.9,
  17, 11, 6, 64.7,
  2, 5, 28.6,
  18, 7, 11, 38.9,
  11, 2, 9,
  3, 3, 6, 5, 45.5,
  2, 1, 50.0, 1, 0, 0.0,
  3, 2, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Rocky River', '2024-05-28', 2024, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 2, 1, 17, 8, 11.8,
  42, 18, 2.0, 21.0, 53.3,
  17, 14, 4, 77.8,
  3, 14, 17.6,
  7, 7, 0, 100.0,
  15, 3, 11,
  2, 10, 1, 5, 83.3,
  0, 0, 0.0, 1, 0, 0.0,
  2, 0, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ottawa Hills', '2024-05-22', 2024, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 8, 4, 25, 17, 32.0,
  63, 21, 2.0, 7.0, 56.2,
  34, 13, 8, 61.9,
  9, 12, 42.9,
  17, 13, 4, 76.5,
  21, 14, 7,
  0, 15, 5, 8, 61.5,
  4, 0, 0.0, 2, 1, 50.0,
  7, 5, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Southview', '2024-05-16', 2024, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 11, 7, 37, 24, 29.7,
  68, 23, 1.0, 6.0, 59.9,
  38, 15, 7, 68.2,
  9, 12, 42.9,
  22, 14, 8, 63.6,
  20, 12, 7,
  1, 15, 7, 2, 22.2,
  4, 0, 0.0, 2, 0, 0.0,
  8, 5, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2024-05-09', 2024, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 9, 7, 29, 21, 31.0,
  60, 27, 2.0, 6.0, 48.5,
  38, 19, 3, 86.4,
  6, 16, 27.3,
  18, 10, 8, 55.6,
  22, 11, 11,
  1, 14, 5, 8, 61.5,
  1, 1, 100.0, 8, 2, 25.0,
  15, 7, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Westlake', '2024-05-04', 2024, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 16, 13, 50, 29, 32.0,
  68, 24, 1.0, 4.0, 56.9,
  41, 14, 6, 70.0,
  12, 8, 60.0,
  23, 15, 8, 65.2,
  13, 3, 9,
  0, 5, 4, 7, 63.6,
  5, 4, 80.0, 6, 2, 33.3,
  10, 5, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Southview', '2024-05-02', 2024, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 13, 11, 36, 26, 36.1,
  73, 28, 2.0, 5.0, 58.6,
  41, 17, 6, 73.9,
  10, 13, 43.5,
  23, 15, 8, 65.2,
  19, 6, 13,
  1, 10, 7, 5, 41.7,
  3, 1, 33.3, 4, 2, 50.0,
  6, 2, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Brother Rice', '2024-04-30', 2024, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 4, 2, 14, 8, 28.6,
  52, 16, 3.0, 13.0, 43.4,
  19, 13, 8, 61.9,
  4, 16, 20.0,
  21, 7, 14, 33.3,
  26, 23, 3,
  0, 7, 15, 15, 50.0,
  4, 0, 0.0, 1, 1, 100.0,
  2, 1, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Detroit Country Day', '2024-04-27', 2024, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 6, 5, 30, 12, 20.0,
  85, 25, 2.0, 14.0, 56.9,
  37, 10, 12, 45.5,
  5, 17, 22.7,
  25, 18, 7, 72.0,
  29, 6, 22,
  0, 9, 15, 12, 44.4,
  6, 2, 33.3, 1, 0, 0.0,
  6, 4, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Orchard Lake St. Mary''s', '2024-04-25', 2024, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 9, 5, 28, 14, 32.1,
  54, 22, 1.0, 6.0, 46.0,
  31, 5, 4, 55.6,
  5, 14, 26.3,
  24, 20, 4, 83.3,
  16, 8, 7,
  1, 6, 13, 11, 45.8,
  4, 3, 75.0, 5, 4, 80.0,
  6, 3, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'University of Detroit Jesuit', '2024-04-23', 2024, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 10, 8, 45, 31, 22.2,
  87, 13, 1.0, 8.0, 55.3,
  39, 15, 6, 71.4,
  7, 10, 41.2,
  22, 2, 20, 9.1,
  20, 9, 10,
  0, 19, 9, 14, 60.9,
  3, 1, 33.3, 2, 1, 50.0,
  9, 5, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ottawa Hills', '2024-04-22', 2024, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 5, 4, 29, 15, 17.2,
  73, 24, 2.0, 14.0, 49.8,
  34, 13, 5, 72.2,
  9, 12, 42.9,
  18, 13, 5, 72.2,
  23, 8, 15,
  0, 8, 10, 15, 60.0,
  4, 0, 0.0, 1, 1, 100.0,
  4, 1, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Bishop Watterson', '2024-04-19', 2024, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 9, 7, 28, 15, 32.1,
  61, 18, 2.0, 6.0, 45.1,
  39, 11, 8, 57.9,
  6, 11, 35.3,
  24, 10, 14, 41.7,
  21, 14, 7,
  1, 12, 14, 7, 33.3,
  5, 4, 80.0, 3, 2, 66.7,
  8, 4, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Cranbrook', '2024-04-16', 2024, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 7, 4, 35, 20, 20.0,
  60, 20, 1.0, 8.0, 49.3,
  24, 15, 5, 75.0,
  5, 17, 22.7,
  17, 10, 7, 58.8,
  17, 4, 12,
  3, 3, 6, 13, 68.4,
  0, 0, 0.0, 2, 1, 50.0,
  5, 2, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Detroit Catholic Central', '2024-04-11', 2024, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 6, 5, 16, 12, 37.5,
  41, 11, 2.0, 6.0, 39.0,
  10, 9, 6, 60.0,
  2, 10, 16.7,
  25, 8, 17, 32.0,
  13, 3, 10,
  0, 6, 16, 14, 46.7,
  2, 0, 0.0, 1, 0, 0.0,
  3, 2, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'De La Salle', '2024-04-09', 2024, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 22, 14, 41, 26, 53.7,
  56, 25, 1.0, 2.0, 56.0,
  36, 11, 3, 78.6,
  4, 5, 44.4,
  31, 20, 11, 64.5,
  11, 9, 2,
  1, 11, 6, 7, 53.8,
  1, 0, 0.0, 2, 1, 50.0,
  6, 4, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Revere', '2024-04-06', 2024, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 17, 13, 41, 29, 41.5,
  63, 27, 1.0, 3.0, 64.1,
  41, 8, 5, 61.5,
  9, 9, 50.0,
  28, 20, 8, 71.4,
  18, 10, 6,
  0, 13, 8, 6, 42.9,
  6, 4, 66.7, 3, 0, 0.0,
  8, 4, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2024-03-26', 2024, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 8, 4, 15, 11, 53.3,
  45, 12, 3.0, 5.0, 32.9,
  24, 14, 13, 51.9,
  3, 11, 21.4,
  22, 2, 20, 9.1,
  16, 10, 6,
  3, 11, 11, 16, 59.3,
  3, 1, 33.3, 5, 1, 20.0,
  15, 6, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Archbishop Hoban', '2024-03-22', 2024, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 11, 6, 33, 22, 33.3,
  71, 21, 2.0, 6.0, 53.1,
  35, 11, 6, 64.7,
  8, 13, 38.1,
  21, 15, 6, 71.4,
  16, 7, 9,
  1, 9, 6, 9, 60.0,
  2, 1, 50.0, 5, 3, 60.0,
  13, 9, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Northview', '2024-03-16', 2024, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 17, 11, 43, 30, 39.5,
  61, 27, 1.0, 3.0, 67.1,
  46, 11, 2, 84.6,
  6, 12, 33.3,
  25, 17, 8, 68.0,
  11, 4, 6,
  1, 9, 6, 2, 25.0,
  2, 1, 50.0, 1, 0, 0.0,
  4, 2, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2025-05-21', 2025, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 6, 4, 24, 14, 25.0,
  46, 17, 1.0, 7.0, 38.9,
  31, 13, 5, 72.2,
  6, 11, 35.3,
  22, 8, 14, 36.4,
  18, 8, 10,
  2, 8, 13, 7, 35.0,
  0, 0, 0.0, 2, 0, 0.0,
  4, 3, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ottawa Hills', '2025-05-16', 2025, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 12, 7, 34, 18, 35.3,
  57, 23, 1.0, 4.0, 52.3,
  30, 14, 8, 63.6,
  4, 10, 28.6,
  20, 11, 9, 55.0,
  17, 4, 12,
  3, 11, 5, 9, 64.3,
  1, 1, 100.0, 1, 0, 0.0,
  7, 6, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Anthony Wayne', '2025-05-09', 2025, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 11, 8, 25, 15, 44.0,
  56, 19, 2.0, 5.0, 42.9,
  30, 13, 7, 65.0,
  3, 9, 25.0,
  25, 13, 12, 52.0,
  20, 9, 11,
  0, 4, 10, 18, 64.3,
  2, 2, 100.0, 6, 5, 83.3,
  7, 0, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Brother Rice', '2025-05-06', 2025, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 3, 1, 11, 8, 27.3,
  46, 10, 4.0, 15.0, 36.7,
  21, 6, 15, 28.6,
  2, 10, 16.7,
  24, 4, 20, 16.7,
  23, 15, 6,
  0, 10, 18, 11, 37.9,
  1, 0, 0.0, 4, 2, 50.0,
  7, 2, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Olmsted Falls', '2025-05-03', 2025, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 6, 4, 28, 13, 21.4,
  59, 15, 2.0, 9.0, 56.4,
  32, 17, 8, 68.0,
  5, 12, 29.4,
  12, 5, 7, 41.7,
  18, 14, 4,
  3, 11, 2, 13, 86.7,
  4, 0, 0.0, 3, 0, 0.0,
  3, 2, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'University of Detroit Jesuit', '2025-05-01', 2025, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 21, 15, 38, 32, 55.3,
  57, 24, 1.0, 2.0, 60.8,
  38, 13, 3, 81.3,
  11, 3, 78.6,
  25, 12, 13, 48.0,
  9, 5, 4,
  0, 17, 1, 8, 88.9,
  0, 0, 0.0, 1, 0, 0.0,
  3, 2, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Detroit Catholic Central', '2025-04-29', 2025, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 5, 4, 20, 10, 25.0,
  54, 10, 2.0, 10.0, 38.7,
  18, 8, 7, 53.3,
  2, 12, 14.3,
  19, 4, 15, 21.1,
  16, 4, 12,
  1, 5, 11, 11, 50.0,
  2, 1, 50.0, 0, 0, 0.0,
  4, 3, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Findlay', '2025-04-26', 2025, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 6, 3, 23, 14, 26.1,
  58, 19, 2.0, 9.0, 51.9,
  23, 13, 3, 81.3,
  8, 13, 38.1,
  13, 8, 5, 61.5,
  19, 7, 11,
  1, 10, 3, 10, 76.9,
  4, 2, 50.0, 6, 1, 16.7,
  10, 1, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2025-04-24', 2025, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 8, 6, 36, 21, 22.2,
  54, 16, 1.0, 6.0, 51.7,
  27, 13, 4, 76.5,
  5, 10, 33.3,
  16, 5, 11, 31.3,
  9, 5, 3,
  3, 6, 5, 11, 68.8,
  4, 1, 25.0, 3, 1, 33.3,
  8, 6, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Bowling Green', '2025-04-16', 2025, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 20, 16, 44, 33, 45.5,
  69, 23, 1.0, 3.0, 64.4,
  47, 11, 1, 91.7,
  15, 6, 71.4,
  26, 16, 10, 61.5,
  17, 8, 8,
  1, 22, 3, 2, 40.0,
  1, 1, 100.0, 1, 1, 100.0,
  4, 0, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Columbus Academy', '2025-04-12', 2025, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 13, 11, 28, 17, 46.4,
  53, 25, 1.0, 4.0, 49.4,
  35, 15, 5, 75.0,
  2, 11, 15.4,
  17, 12, 5, 70.6,
  13, 3, 7,
  1, 9, 2, 9, 81.8,
  3, 1, 33.3, 5, 1, 20.0,
  13, 8, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2025-04-10', 2025, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 9, 7, 43, 20, 20.9,
  66, 21, 1.0, 7.0, 67.0,
  40, 16, 2, 88.9,
  8, 9, 47.1,
  15, 9, 6, 60.0,
  14, 4, 10,
  0, 9, 3, 3, 50.0,
  4, 1, 25.0, 1, 0, 0.0,
  1, 0, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'De La Salle', '2025-04-08', 2025, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 13, 11, 33, 24, 39.4,
  65, 25, 1.0, 5.0, 61.0,
  42, 14, 2, 87.5,
  8, 13, 38.1,
  22, 15, 7, 68.2,
  20, 11, 9,
  2, 10, 5, 9, 64.3,
  4, 1, 25.0, 0, 0, 0.0,
  4, 2, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Edward', '2025-04-05', 2025, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 8, 8, 14, 10, 57.1,
  49, 17, 3.0, 6.0, 46.4,
  23, 13, 9, 59.1,
  5, 5, 50.0,
  14, 8, 6, 57.1,
  19, 10, 8,
  0, 7, 3, 13, 81.3,
  2, 1, 50.0, 5, 0, 0.0,
  7, 4, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Southview', '2025-04-03', 2025, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 13, 8, 44, 28, 29.5,
  74, 25, 1.0, 5.0, 68.4,
  41, 17, 2, 89.5,
  15, 9, 62.5,
  17, 11, 6, 64.7,
  18, 4, 12,
  0, 23, 1, 2, 66.7,
  4, 2, 50.0, 0, 0, 0.0,
  4, 2, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ottawa Hills', '2025-04-01', 2025, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 12, 6, 26, 25, 46.2,
  64, 16, 2.0, 5.0, 50.5,
  33, 7, 6, 53.8,
  7, 8, 46.7,
  19, 12, 7, 63.2,
  15, 1, 14,
  3, 9, 5, 5, 50.0,
  3, 0, 0.0, 3, 2, 66.7,
  11, 5, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Cranbrook', '2025-03-29', 2025, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 8, 6, 25, 14, 32.0,
  66, 14, 2.0, 8.0, 48.3,
  24, 10, 5, 66.7,
  6, 6, 50.0,
  18, 8, 10, 44.4,
  17, 5, 9,
  2, 8, 7, 7, 50.0,
  4, 2, 50.0, 1, 1, 100.0,
  7, 3, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Orchard Lake St. Mary''s', '2025-03-25', 2025, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 9, 6, 27, 17, 33.3,
  63, 18, 2.0, 7.0, 49.5,
  44, 13, 8, 61.9,
  6, 8, 42.9,
  18, 10, 8, 55.6,
  21, 12, 7,
  2, 16, 6, 10, 62.5,
  3, 0, 0.0, 2, 0, 0.0,
  9, 5, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Rocky River', '2025-03-22', 2025, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 5, 5, 18, 9, 27.8,
  45, 15, 2.0, 9.0, 41.0,
  27, 13, 3, 81.3,
  4, 12, 25.0,
  19, 5, 14, 26.3,
  17, 9, 7,
  0, 9, 10, 13, 56.5,
  2, 1, 50.0, 4, 2, 50.0,
  8, 6, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Rocky River', '2026-05-26', 2026, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 5, 2, 31, 16, 16.1,
  54, 20, 1.0, 10.0, 57.0,
  20, 9, 3, 75.0,
  4, 12, 25.0,
  19, 12, 7, 63.2,
  14, 6, 7,
  1, 4, 9, 7, 43.8,
  2, 1, 50.0, 3, 1, 33.3,
  5, 3, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Padua Franciscan', '2026-05-20', 2026, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 11, 11, 28, 21, 39.3,
  63, 31, 2.0, 5.0, 55.9,
  38, 15, 4, 78.9,
  8, 13, 38.1,
  21, 16, 5, 76.2,
  22, 2, 16,
  0, 3, 6, 6, 50.0,
  2, 2, 100.0, 2, 0, 0.0,
  4, 2, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2026-05-15', 2026, 'playoff', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 9, 8, 35, 24, 25.7,
  62, 24, 1.0, 6.0, 57.0,
  26, 20, 6, 76.9,
  4, 15, 21.1,
  19, 8, 11, 42.1,
  11, 4, 7,
  3, 9, 6, 12, 66.7,
  1, 1, 100.0, 1, 0, 0.0,
  4, 3, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2026-05-06', 2026, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 9, 5, 44, 21, 20.5,
  68, 23, 1.0, 7.0, 64.2,
  41, 12, 1, 92.3,
  14, 10, 58.3,
  15, 12, 3, 80.0,
  15, 9, 6,
  1, 23, 4, 4, 50.0,
  4, 2, 50.0, 4, 3, 75.0,
  7, 3, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Olmsted Falls', '2026-05-02', 2026, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 10, 4, 37, 23, 27.0,
  50, 17, 1.0, 5.0, 52.3,
  35, 12, 1, 92.3,
  5, 9, 35.7,
  18, 9, 9, 50.0,
  10, 7, 3,
  2, 8, 5, 6, 54.5,
  0, 0, 0.0, 2, 0, 0.0,
  5, 1, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Brother Rice', '2026-04-29', 2026, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 7, 7, 30, 14, 23.3,
  59, 27, 1.0, 8.0, 44.2,
  29, 17, 1, 94.4,
  3, 17, 15.0,
  27, 11, 16, 40.7,
  15, 9, 6,
  4, 5, 17, 8, 32.0,
  2, 1, 50.0, 2, 0, 0.0,
  9, 4, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Cranbrook', '2026-04-28', 2026, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 4, 2, 24, 12, 16.7,
  58, 17, 2.0, 14.0, 48.5,
  20, 6, 4, 60.0,
  6, 13, 31.6,
  22, 14, 8, 63.6,
  21, 1, 19,
  0, 3, 14, 5, 26.3,
  2, 1, 50.0, 1, 1, 100.0,
  5, 2, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Northview', '2026-04-24', 2026, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 20, 17, 55, 37, 36.4,
  82, 42, 1.0, 4.0, 64.2,
  65, 20, 3, 87.0,
  18, 14, 56.3,
  30, 28, 2, 93.3,
  21, 3, 18,
  0, 8, 6, 2, 25.0,
  2, 1, 50.0, 1, 0, 0.0,
  2, 2, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'De La Salle', '2026-04-21', 2026, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 11, 8, 33, 27, 33.3,
  82, 30, 2.0, 7.0, 61.0,
  42, 19, 3, 86.4,
  13, 15, 46.4,
  21, 16, 5, 76.2,
  23, 13, 7,
  2, 19, 6, 2, 25.0,
  5, 2, 40.0, 6, 1, 16.7,
  10, 6, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Detroit Catholic Central', '2026-04-17', 2026, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 3, 3, 20, 11, 15.0,
  50, 15, 2.0, 16.0, 45.6,
  18, 12, 2, 85.7,
  3, 13, 18.8,
  23, 6, 17, 26.1,
  16, 5, 10,
  0, 5, 17, 11, 39.3,
  2, 1, 50.0, 1, 0, 0.0,
  4, 2, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Orchard Lake St. Mary''s', '2026-04-14', 2026, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 17, 8, 41, 28, 41.5,
  67, 31, 1.0, 3.0, 64.2,
  45, 17, 4, 81.0,
  3, 9, 25.0,
  26, 16, 10, 61.5,
  15, 7, 8,
  1, 13, 5, 6, 54.5,
  3, 2, 66.7, 2, 0, 0.0,
  4, 3, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Topsail (NC)', '2026-04-10', 2026, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 8, 4, 23, 15, 34.8,
  56, 22, 2.0, 7.0, 49.2,
  35, 18, 5, 78.3,
  5, 10, 33.3,
  19, 10, 9, 52.6,
  19, 9, 9,
  2, 11, 7, 7, 50.0,
  4, 1, 25.0, 3, 1, 33.3,
  10, 5, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Eugene Ashley (NC)', '2026-04-07', 2026, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 8, 5, 35, 20, 22.9,
  70, 22, 2.0, 8.0, 48.1,
  36, 17, 5, 77.3,
  10, 16, 38.5,
  23, 8, 15, 34.8,
  16, 4, 12,
  0, 13, 11, 3, 21.4,
  5, 2, 40.0, 4, 2, 50.0,
  9, 9, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ottawa Hills', '2026-03-30', 2026, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 24, 13, 56, 55, 42.9,
  69, 33, 1.0, 2.0, 71.8,
  54, 15, 1, 93.8,
  7, 8, 46.7,
  29, 22, 7, 75.9,
  12, 8, 4,
  0, 14, 1, 3, 75.0,
  1, 0, 0.0, 0, 0, 0.0,
  1, 0, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Edward', '2026-03-28', 2026, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 5, 2, 38, 18, 13.2,
  74, 19, 1.0, 14.0, 58.8,
  42, 13, 7, 65.0,
  8, 13, 38.1,
  16, 10, 6, 62.5,
  18, 9, 9,
  1, 4, 6, 10, 62.5,
  5, 1, 20.0, 2, 1, 50.0,
  4, 2, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'University of Detroit Jesuit', '2026-03-24', 2026, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 14, 11, 47, 29, 29.8,
  77, 18, 1.0, 5.0, 59.5,
  45, 10, 3, 76.9,
  11, 10, 52.4,
  20, 9, 11, 45.0,
  18, 6, 12,
  1, 23, 2, 4, 66.7,
  0, 0, 0.0, 1, 0, 0.0,
  4, 3, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Walsh Jesuit', '2026-03-20', 2026, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 9, 6, 24, 12, 37.5,
  66, 19, 2.0, 7.0, 46.4,
  30, 13, 9, 59.1,
  5, 11, 31.3,
  22, 8, 14, 36.4,
  25, 13, 12,
  3, 15, 10, 11, 52.4,
  3, 2, 66.7, 3, 1, 33.3,
  9, 7, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Southview', '2026-03-18', 2026, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 13, 10, 46, 27, 28.3,
  67, 22, 1.0, 5.0, 60.6,
  51, 11, 0, 100.0,
  12, 8, 60.0,
  19, 13, 6, 68.4,
  14, 3, 9,
  1, 20, 2, 3, 60.0,
  3, 2, 66.7, 2, 1, 50.0,
  9, 5, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Copley', '2026-03-14', 2026, 'regular', 'hudl_team_totals')
  RETURNING id
)
INSERT INTO team_game_stats (
  game_id, team_id, goals, assists, shots, shots_on_goal, shot_pct,
  possessions, attacking_possessions, poss_per_shot, poss_per_goal, poss_pct,
  ground_balls, successful_clears, failed_clears, clear_pct,
  successful_rides, failed_rides, ride_pct,
  faceoffs, faceoff_wins, faceoff_losses, faceoff_pct,
  turnovers, forced_turnovers, unforced_turnovers,
  blocks, caused_turnovers, goals_against, saves, save_pct,
  emo, emo_goals, emo_pct, man_down_defenses, man_down_goals_against, man_down_pct,
  penalties, technical_penalties, personal_penalties
)
SELECT id, 1, 7, 3, 33, 18, 21.2,
  72, 21, 2.0, 10.0, 59.0,
  40, 15, 3, 83.3,
  10, 14, 41.7,
  19, 11, 8, 57.9,
  20, 11, 8,
  1, 12, 8, 8, 50.0,
  3, 0, 0.0, 0, 0, 0.0,
  5, 3, 0
FROM new_game;

COMMIT;