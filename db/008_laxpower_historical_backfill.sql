-- Historical backfill: 335 games, 2002-2019, sourced from LaxPower/LaxNumbers
-- (Andy's own archival scrape). Sparse compared to the Hudl team-totals data --
-- typically just goals, goals_against, and sometimes assists. Every other
-- stat column is left NULL (genuinely not tracked in this source), not 0.
--
-- 2020 has no games (COVID-cancelled season). 2021-2026 are NOT included here
-- -- they're already covered by the richer Hudl team-totals backfill.
--
-- Known, understood discrepancies (both already cross-validated multiple ways
-- and explained -- see project log, not blocking):
--  * 2006: 20 real games in the source vs. the site's own year-summary of 19
--    (goal totals match exactly either way)
--  * 2007: 22 vs. 21 (two legitimate same-day tournament doubleheaders account
--    for part of this; goal totals also match exactly)
--  * 2014: only 14 games recovered vs. 15 expected -- Andy noted he likely
--    stopped updating this particular tracking sheet mid-project that year
--
-- ASSUMES team_id = 1.

BEGIN;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Shaker Heights', '2002-05-21', 2002, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Walsh Jesuit', '2003-05-21', 2003, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 4, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Massilon Jackson', '2004-05-25', 2004, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Shaker Heights', '2004-05-29', 2004, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Kent Roosevelt', '2004-06-02', 2004, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 18, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Cincinnati Sycamore', '2004-06-05', 2004, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2005-05-21', 2005, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 13, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'University School', '2005-05-25', 2005, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Shaker Heights', '2005-05-28', 2005, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 3, NULL, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Kent Roosevelt', '2006-05-23', 2006, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hudson', '2006-05-26', 2006, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 22
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Thomas Worthington', '2007-05-22', 2007, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Dublin Coffman', '2008-05-24', 2008, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Westerville North', '2009-05-23', 2009, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 14, NULL, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Thomas Worthington', '2009-05-27', 2009, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 19
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2010-05-22', 2010, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Southview', '2010-05-26', 2010, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 14
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Northview', '2011-05-19', 2011, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 13, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Edward', '2011-05-21', 2011, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Brunswick', '2012-05-17', 2012, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Dublin Jerome', '2012-05-19', 2012, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 1, NULL, 17
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Westlake', '2013-05-22', 2013, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Southview', '2013-05-25', 2013, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Strongsville', '2014-05-20', 2014, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 18
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2015-05-23', 2015, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, 5, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Ignatius (Prep)', '2015-05-28', 2015, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, 4, 14
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2016-05-19', 2016, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, 7, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Olentangy', '2016-05-21', 2016, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, 4, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Delaware Hayes', '2017-05-17', 2017, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 2, 0, 16
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Avon Lake', '2018-05-14', 2018, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, 3, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2018-05-17', 2018, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 4, 3, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Southview', '2019-05-13', 2019, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 15, 10, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Westlake', '2019-05-16', 2019, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, 10, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ottawa Hills', '2019-05-20', 2019, 'playoff', 'laxpower_playoff_details')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, 5, 13
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Solon', '2014-03-26', 2014, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 19
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Ignatius (Prep)', '2014-03-29', 2014, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 13
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Medina', '2014-04-02', 2014, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 2, NULL, 18
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Erie McDowell', '2014-04-05', 2014, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2014-04-16', 2014, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Anthony Wayne', '2014-04-23', 2014, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Olentangy', '2014-04-26', 2014, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 19
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Southview', '2014-04-30', 2014, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 17
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Strongsville', '2014-05-03', 2014, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Toledo Central Catholic', '2014-05-07', 2014, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 13, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Brother Rice (Orange)', '2014-05-09', 2014, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 3, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ann Arbor Skyline', '2014-05-10', 2014, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 4, NULL, 15
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Northview', '2014-05-12', 2014, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 10, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2014-05-16', 2014, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 15
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Toledo Central Catholic', '2015-03-25', 2015, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 23, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Brebeuf Jesuit', '2015-03-28', 2015, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 16, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Marquette', '2015-03-28', 2015, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Fishers', '2015-03-29', 2015, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Bowling Green', '2015-03-30', 2015, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 14, NULL, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Medina', '2015-04-11', 2015, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Ignatius (Prep)', '2015-04-18', 2015, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 21
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Anthony Wayne', '2015-04-21', 2015, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 14, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Erie McDowell', '2015-04-24', 2015, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 15, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Stow Monroe Falls', '2015-04-25', 2015, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 19, NULL, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2015-04-28', 2015, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Strongsville', '2015-05-02', 2015, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Southview', '2015-05-05', 2015, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 16, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ottawa Hills', '2015-05-06', 2015, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 15, NULL, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Northview', '2015-05-08', 2015, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 10, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2015-05-15', 2015, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Toledo Central Catholic', '2016-03-22', 2016, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 20, NULL, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'University of Detroit Jesuit', '2016-03-31', 2016, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 10, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Charles', '2016-04-02', 2016, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Summit Country Day', '2016-04-03', 2016, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Strongsville', '2016-04-06', 2016, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 10, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Edward', '2016-04-08', 2016, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Shaker Heights', '2016-04-15', 2016, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Massilon Jackson', '2016-04-16', 2016, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Anthony Wayne', '2016-04-21', 2016, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Brebeuf Jesuit', '2016-04-23', 2016, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Marquette', '2016-04-23', 2016, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 10, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2016-04-26', 2016, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Medina', '2016-04-30', 2016, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Northview', '2016-05-03', 2016, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Brunswick', '2016-05-06', 2016, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Southview', '2016-05-10', 2016, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 17, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2016-05-13', 2016, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 17
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Mentor', '2017-03-18', 2017, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Anthony Wayne', '2017-03-23', 2017, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 4, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Strongsville', '2017-03-25', 2017, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 13
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Northview', '2017-03-28', 2017, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Kenston', '2017-03-31', 2017, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 16
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Wadsworth', '2017-04-01', 2017, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Brunswick', '2017-04-08', 2017, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ottawa Hills', '2017-04-12', 2017, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 13
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Massilon Jackson', '2017-04-22', 2017, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ann Arbor Pioneer', '2017-04-24', 2017, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Saline', '2017-04-27', 2017, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Edward', '2017-04-29', 2017, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2017-05-02', 2017, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 15
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Chagrin Falls', '2017-05-05', 2017, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 1, NULL, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Delaware Hayes', '2017-05-06', 2017, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Southview', '2017-05-09', 2017, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 18, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2017-05-12', 2017, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 2, NULL, 17
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Wooster', '2017-05-13', 2017, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 4, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Anthony Wayne', '2018-03-17', 2018, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 14
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Southview', '2018-03-20', 2018, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 13, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Wadsworth', '2018-03-24', 2018, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 14, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Archbishop Hoban', '2018-03-28', 2018, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 15
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Saline', '2018-04-06', 2018, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 4, NULL, 16
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Gahanna Lincoln', '2018-04-07', 2018, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 15, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Brunswick', '2018-04-12', 2018, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 13, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Brecksville Broadview', '2018-04-14', 2018, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 14, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Northview', '2018-04-17', 2018, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Strongsville', '2018-04-19', 2018, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Massilon Jackson', '2018-04-21', 2018, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Westlake', '2018-04-24', 2018, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Mentor', '2018-04-28', 2018, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2018-05-02', 2018, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 15
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hilliard Darby', '2018-05-04', 2018, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Delaware Hayes', '2018-05-05', 2018, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ann Arbor Pioneer', '2018-05-09', 2018, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2018-05-12', 2018, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Wadsworth', '2019-03-16', 2019, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 18, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Bowling Green', '2019-03-20', 2019, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 21, NULL, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Westlake', '2019-03-22', 2019, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Northview', '2019-04-04', 2019, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 19, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Brunswick', '2019-04-06', 2019, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 17, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ottawa Hills', '2019-04-10', 2019, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 17, NULL, 16
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Avon', '2019-04-13', 2019, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Anthony Wayne', '2019-04-16', 2019, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 4, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2019-04-24', 2019, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 14
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Southview', '2019-04-26', 2019, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 13, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Wooster', '2019-04-27', 2019, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 15, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Bay', '2019-04-30', 2019, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 13, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ottawa Hills', '2019-05-02', 2019, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 17
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Rocky River', '2019-05-04', 2019, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2019-05-07', 2019, 'regular', 'laxpower_year_sheet')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hilliard Darby', '2005-03-21', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 10, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Wellington School', '2005-03-30', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 13, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Mentor', '2005-04-01', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 14, NULL, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Medina', '2005-04-06', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hawken School', '2005-04-08', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Chagrin Falls', '2005-04-09', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 14, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Charles', '2005-04-10', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 13, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Cleveland Heights', '2005-04-15', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'University School', '2005-04-16', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania', '2005-04-19', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Massilon Jackson', '2005-04-22', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Kent Roosevelt', '2005-04-23', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Ignatius (Prep)', '2005-04-27', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Charles', '2005-04-30', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2005-05-04', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Shaker Heights', '2005-05-06', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Olentangy', '2005-05-12', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 13, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Walsh Jesuit', '2005-05-14', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 10, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2005-05-18', 2005, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Ignatius (Prep)', '2006-03-25', 2006, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hilliard Darby', '2006-04-01', 2006, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 13, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ann Arbor Pioneer', '2006-04-04', 2006, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Culver Military Academy', '2006-04-07', 2006, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hilliard Davidson', '2006-04-08', 2006, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 13, NULL, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Olentangy', '2006-04-18', 2006, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Kent Roosevelt', '2006-04-21', 2006, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 14, NULL, 16
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Walsh Jesuit', '2006-04-22', 2006, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2006-04-25', 2006, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 16, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania', '2006-04-26', 2006, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Charles', '2006-04-28', 2006, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 10, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Westerville South', '2006-04-29', 2006, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 10, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Dublin Jerome', '2006-05-03', 2006, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Shaker Heights', '2006-05-06', 2006, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 10, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Medina', '2006-05-09', 2006, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 14
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Dublin Coffman', '2006-05-13', 2006, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 13
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2006-05-16', 2006, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hudson', '2006-05-19', 2006, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 23
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Charles', '2007-03-24', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hilliard Darby', '2007-03-31', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 10, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ann Arbor Pioneer', '2007-04-02', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Lakota West', '2007-04-07', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Dublin Coffman', '2007-04-13', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Olentangy', '2007-04-14', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Bedford', '2007-04-16', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 18, NULL, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Westerville North', '2007-04-18', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Walsh Jesuit', '2007-04-21', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Medina', '2007-04-22', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 13, NULL, 20
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Cincinnati St. Xavier', '2007-04-28', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Brebeuf Jesuit', '2007-04-28', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Ignatius (Prep)', '2007-04-29', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 17, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Marquette', '2007-04-29', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania', '2007-05-02', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Upper Arlington', '2007-05-05', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 4, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2007-05-08', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hudson', '2007-05-11', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2007-05-12', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 16, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania', '2007-05-13', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Troy Athens', '2007-05-19', 2007, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 4, NULL, 14
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Lexington Dunbar', '2008-03-24', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Lexington Tates Creek', '2008-03-25', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 17, NULL, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Lexington Catholic', '2008-03-26', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Olentangy', '2008-03-29', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 3, NULL, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Medina', '2008-04-05', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Walsh Jesuit', '2008-04-09', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ann Arbor Pioneer', '2008-04-12', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 4, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2008-04-15', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Clarkston', '2008-04-18', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Lakota West', '2008-04-19', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Westerville North', '2008-04-23', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Dublin Coffman', '2008-04-25', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 3, NULL, 15
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Detroit Catholic Central', '2008-04-26', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Upper Arlington', '2008-05-02', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 2, NULL, 14
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2008-05-08', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania', '2008-05-12', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Kent Roosevelt', '2008-05-14', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hilliard Darby', '2008-05-17', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2008-05-20', 2008, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ann Arbor Pioneer', '2009-03-24', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Medina', '2009-03-28', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2009-03-30', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 15, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Upper Arlington', '2009-04-02', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hoover', '2009-04-04', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 15, NULL, 14
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Ignatius (Prep)', '2009-04-08', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Olentangy', '2009-04-11', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Dublin Coffman', '2009-04-18', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Bishop Watterson', '2009-04-22', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2009-04-24', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Kent Roosevelt', '2009-04-25', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hudson', '2009-05-01', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Notre Dame Prep', '2009-05-02', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 10, NULL, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania', '2009-05-05', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Thomas Worthington', '2009-05-08', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 4, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hilliard Darby', '2009-05-09', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 17, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Shaker Heights', '2009-05-13', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 18, NULL, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Detroit Catholic Central', '2009-05-16', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 13, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2009-05-18', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania', '2009-05-21', 2009, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2010-03-23', 2010, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Thomas Worthington', '2010-03-27', 2010, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Medina', '2010-04-03', 2010, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 3, NULL, 19
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Olentangy', '2010-04-10', 2010, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Toledo Central Catholic', '2010-04-14', 2010, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hoover', '2010-04-17', 2010, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 3, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Ignatius (Prep)', '2010-04-21', 2010, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Wooster', '2010-04-24', 2010, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Kent Roosevelt', '2010-04-30', 2010, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 16
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Seneca Valley', '2010-05-02', 2010, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Bishop Watterson', '2010-05-05', 2010, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Notre Dame Prep', '2010-05-08', 2010, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Northview', '2010-05-10', 2010, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 14, NULL, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Anthony Wayne', '2010-05-12', 2010, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 16, NULL, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2010-05-14', 2010, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Troy Athens', '2010-05-15', 2010, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Southview', '2010-05-19', 2010, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 15
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Southview', '2011-03-22', 2011, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Notre Dame Prep', '2011-03-26', 2011, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Charles', '2011-03-29', 2011, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'University School', '2011-04-02', 2011, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Medina', '2011-04-05', 2011, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 16
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hoover', '2011-04-09', 2011, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2011-04-13', 2011, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 14, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Kent Roosevelt', '2011-04-21', 2011, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Cathedral Prep', '2011-04-29', 2011, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Wheeling Cent Cath', '2011-04-30', 2011, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Erie McDowell', '2011-04-30', 2011, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Toledo Central Catholic', '2011-05-03', 2011, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Ignatius (Prep)', '2011-05-05', 2011, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 4, NULL, 18
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Detroit Catholic Central', '2011-05-07', 2011, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 3, NULL, 15
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Northview', '2011-05-10', 2011, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 16, NULL, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2011-05-13', 2011, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 10, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2012-03-23', 2012, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 14, NULL, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Anthony Wayne', '2012-03-28', 2012, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 19, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Charles', '2012-03-31', 2012, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Olentangy', '2012-04-02', 2012, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Medina', '2012-04-04', 2012, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 20
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Erie McDowell', '2012-04-13', 2012, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 15, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hoover', '2012-04-14', 2012, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 15
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Toledo Central Catholic', '2012-04-19', 2012, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 15, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Massilon Jackson', '2012-04-21', 2012, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 17
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Southview', '2012-04-25', 2012, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 4, NULL, 17
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Marquette', '2012-04-28', 2012, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'DeSmet Jesuit', '2012-04-28', 2012, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Brebeuf Jesuit', '2012-04-29', 2012, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Northview', '2012-05-02', 2012, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 16, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Ignatius (Prep)', '2012-05-05', 2012, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 14
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Olentangy', '2012-05-11', 2012, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 14
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2012-05-12', 2012, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 15
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Toledo Central Catholic', '2013-03-26', 2013, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Medina', '2013-03-28', 2013, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Charles', '2013-04-06', 2013, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Summit Country Day', '2013-04-07', 2013, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 17
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hilliard Davidson', '2013-04-13', 2013, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Southview', '2013-04-17', 2013, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Anthony Wayne', '2013-04-20', 2013, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 10, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Ignatius (Prep)', '2013-04-27', 2013, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 1, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Northview', '2013-05-01', 2013, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Olentangy', '2013-05-03', 2013, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 4, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Ann Arbor Skyline', '2013-05-11', 2013, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 6
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Perrysburg', '2013-05-15', 2013, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 15, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2013-05-17', 2013, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Francis Toledo', '2013-05-20', 2013, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 7
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania Southview', '2013-05-21', 2013, 'regular', 'laxpower_year_sheet_middle')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 2, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Indian Hill', '2002-03-16', 2002, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 0, NULL, 16
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania', '2002-03-19', 2002, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Toledo Wolfpack', '2002-04-03', 2002, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 12, NULL, 2
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hilliard Darby', '2002-04-05', 2002, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Wellington School', '2002-04-06', 2002, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Medina', '2002-04-19', 2002, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 2, NULL, 14
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Revere', '2002-04-20', 2002, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 14, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Walsh Jesuit', '2002-04-26', 2002, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 3, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'University School', '2002-04-27', 2002, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 3, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Toledo Wolfpack', '2002-05-01', 2002, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 13, NULL, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Western Reserve Academy', '2002-05-06', 2002, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 2, NULL, 17
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania', '2002-05-08', 2002, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, NULL, NULL, NULL
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Cleveland Heights', '2002-05-10', 2002, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 13, NULL, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Shaker Heights', '2002-05-11', 2002, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Charles', '2002-05-14', 2002, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'St. Charles', '2003-03-22', 2003, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 3, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania', '2003-04-03', 2003, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 2, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hilliard Darby', '2003-04-11', 2003, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 1, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'University School', '2003-04-12', 2003, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 2, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Toledo Wolfpack', '2003-04-16', 2003, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 15, NULL, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Olentangy', '2003-04-22', 2003, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 4, NULL, 12
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Kent Roosevelt', '2003-04-26', 2003, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Walsh Jesuit', '2003-05-02', 2003, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Medina', '2003-05-03', 2003, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 17
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Cleveland Heights', '2003-05-09', 2003, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 14, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Shaker Heights', '2003-05-10', 2003, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 7, NULL, 20
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hawken School', '2003-05-16', 2003, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 1, NULL, 10
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Wellington School', '2003-05-17', 2003, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 8, NULL, 11
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Walsh Jesuit', '2004-04-01', 2004, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 13, NULL, 5
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Massilon Jackson', '2004-04-03', 2004, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 14, NULL, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Toledo Wolfpack', '2004-04-07', 2004, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 15, NULL, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Hawken School', '2004-04-15', 2004, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 5, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'University School', '2004-04-17', 2004, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 4, NULL, 0
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Wellington School', '2004-04-22', 2004, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 6, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Kent Roosevelt', '2004-04-24', 2004, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 8
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Toledo Wolfpack', '2004-04-29', 2004, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 14, NULL, 4
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Sylvania', '2004-05-03', 2004, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 14, NULL, 3
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Shaker Heights', '2004-05-08', 2004, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 11, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Olentangy', '2004-05-11', 2004, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 10, NULL, 9
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Cleveland Heights', '2004-05-14', 2004, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 14, NULL, 1
FROM new_game;

WITH new_game AS (
  INSERT INTO games (team_id, opponent, game_date, season_year, game_type, import_source)
  VALUES (1, 'Chagrin Falls', '2004-05-15', 2004, 'regular', 'laxpower_year_sheet_oldest')
  RETURNING id
)
INSERT INTO team_game_stats (game_id, team_id, goals, assists, goals_against)
SELECT id, 1, 9, NULL, 6
FROM new_game;

COMMIT;