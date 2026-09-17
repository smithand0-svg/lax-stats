-- Season-by-season program history, transcribed from Andy's own
-- historical records PDF. 2027 (a future, not-yet-played season with a
-- placeholder row and no coach assigned) is deliberately excluded — it's
-- not real historical data yet.
--
-- team_id is looked up by slug rather than hardcoded, so this runs
-- correctly regardless of the actual id value in any given database.

INSERT INTO program_seasons
  (team_id, season_year, head_coach, division, regular_wins, regular_losses,
   league_wins, league_losses, league_name, league_finish,
   playoff_wins, playoff_losses, total_wins, total_losses,
   brothers_cup, playoff_result, special_note)
SELECT id, v.season_year, v.head_coach, v.division, v.regular_wins, v.regular_losses,
       v.league_wins, v.league_losses, v.league_name, v.league_finish,
       v.playoff_wins, v.playoff_losses, v.total_wins, v.total_losses,
       v.brothers_cup, v.playoff_result, v.special_note
FROM teams,
LATERAL (VALUES
  (1990, 'Brad Lay',        NULL, 1,  3, NULL, NULL, NULL, NULL, 0, 0,  1,  3, NULL, NULL, NULL),
  (1991, 'Brad Lay',        NULL, 0,  4, NULL, NULL, NULL, NULL, 0, 0,  0,  4, NULL, NULL, NULL),
  (1992, 'Mike Degens',     NULL, 0,  6, NULL, NULL, NULL, NULL, 0, 0,  0,  6, NULL, NULL, NULL),
  (1993, 'Mike Degens',     NULL, 3,  6, NULL, NULL, NULL, NULL, 0, 0,  3,  6, NULL, NULL, NULL),
  (1994, 'Mike Degens',     NULL, 7,  9, NULL, NULL, NULL, NULL, 0, 0,  7,  9, NULL, NULL, NULL),
  (1995, 'Jim Reed',        NULL, 10, 7, NULL, NULL, NULL, NULL, 0, 0, 10,  7, NULL, NULL, NULL),
  (1996, 'Jim Reed',        NULL, 13, 8, NULL, NULL, NULL, NULL, 0, 0, 13,  8, NULL, NULL, NULL),
  (1997, 'Jim Reed',        NULL, 11, 9, NULL, NULL, NULL, NULL, 0, 0, 11,  9, NULL, NULL, NULL),
  (1998, 'Chad Fredericks', NULL, 7, 12, NULL, NULL, NULL, NULL, 0, 0,  7, 12, NULL, NULL, NULL),
  (1999, 'Chad Fredericks', NULL, 7,  8, NULL, NULL, NULL, NULL, 0, 0,  7,  8, NULL, NULL, NULL),
  (2000, 'Chad Fredericks', NULL, 9,  3, NULL, NULL, NULL, NULL, 0, 0,  9,  3, NULL, NULL, NULL),
  (2001, 'Chad Fredericks', NULL, 3, 12, NULL, NULL, NULL, NULL, 0, 0,  3, 12, NULL, NULL, NULL),
  (2002, 'Chad Fredericks', 2,    5,  9, NULL, NULL, NULL, NULL, 0, 1,  5, 10, NULL, NULL, NULL),
  (2003, 'Jim Reed',        2,    2, 11, NULL, NULL, NULL, NULL, 0, 1,  2, 12, NULL, NULL, NULL),
  (2004, 'Jim Reed',        2,   11,  2, NULL, NULL, 'TALA', NULL, 3, 1, 14,  3, NULL, 'State Finals', NULL),
  (2005, 'Jim Reed',        1,   15,  4, NULL, NULL, 'TALA', NULL, 2, 1, 17,  5, NULL, 'Elite 8', NULL),
  (2006, 'Jim Reed',        1,   12,  8, NULL, NULL, 'TALA', NULL, 1, 1, 13,  9, NULL, NULL, NULL),
  (2007, 'Mike McComish',   1,   13,  8, NULL, NULL, 'TALA', NULL, 0, 1, 13,  9, NULL, NULL, NULL),
  (2008, 'Mike McComish',   1,   12,  7, NULL, NULL, 'TALA', NULL, 0, 1, 12,  8, NULL, NULL, NULL),
  (2009, 'Mike McComish',   1,   14,  6, NULL, NULL, 'TALA', NULL, 1, 1, 15,  7, NULL, 'Sweet 16', NULL),
  (2010, 'Mike McComish',   1,    4, 13, NULL, NULL, 'TALA', NULL, 1, 1,  5, 14, NULL, NULL, NULL),
  (2011, 'Mike McComish',   1,    7,  9, NULL, NULL, 'TALA', NULL, 1, 1,  8, 10, NULL, NULL, NULL),
  (2012, 'Mike McComish',   1,    8,  9, NULL, NULL, 'TALA', NULL, 1, 1,  9, 10, NULL, NULL, NULL),
  (2013, 'Mike McComish',   1,    9,  6, NULL, NULL, 'TALA', NULL, 1, 1, 10,  7, NULL, NULL, NULL),
  (2014, 'Mike McComish',   1,    4, 10, NULL, NULL, NULL, NULL, 0, 1,  4, 11, NULL, NULL, NULL),
  (2015, 'Adam Salon',      1,   11,  5, NULL, NULL, NULL, NULL, 1, 1, 12,  6, NULL, NULL, NULL),
  (2016, 'Adam Salon',      1,   13,  4, NULL, NULL, NULL, NULL, 1, 1, 14,  5, NULL, 'Sweet 16', NULL),
  (2017, 'Adam Salon',      1,    4, 14, NULL, NULL, NULL, NULL, 0, 1,  4, 15, NULL, NULL, 'Lacrosse Becomes OHSAA Sport'),
  (2018, 'Adam Salon',      2,    8, 10, NULL, NULL, NULL, NULL, 1, 1,  9, 11, NULL, NULL, NULL),
  (2019, 'Adam Salon',      2,   11,  4, NULL, NULL, NULL, NULL, 2, 1, 13,  5, NULL, 'Sweet 16', NULL),
  (2020, 'Andrew Smith',    2,    0,  0, NULL, NULL, NULL, NULL, 0, 0,  0,  0, NULL, NULL, 'Season cancelled due to COVID'),
  (2021, 'Andrew Smith',    2,   10,  4, NULL, NULL, NULL, NULL, 2, 1, 12,  5, NULL, 'Sweet 16', NULL),
  (2022, 'Andrew Smith',    2,   14,  4, NULL, NULL, NULL, NULL, 4, 1, 18,  5, '10-7', 'Final 4', 'Inaugural Brothers Cup w/ SFS Toledo'),
  (2023, 'Andrew Smith',    2,   10,  6, NULL, NULL, NULL, NULL, 3, 1, 13,  7, '6-7 OT', 'Elite 8', NULL),
  (2024, 'Andrew Smith',    2,    9,  7, 3, 4, 'CHSL', '5th',    5, 1, 14,  8, '8-11', 'State Finals', 'Joined CHSL'),
  (2025, 'Andrew Smith',    2,   14,  3, 5, 2, 'CHSL', '3rd',    1, 1, 15,  4, '8-5', NULL, NULL),
  (2026, 'Andrew Smith',    2,    9,  7, 4, 3, 'CHSL', '4th',    2, 1, 11,  8, '9-5', 'Sweet 16', NULL)
) AS v(season_year, head_coach, division, regular_wins, regular_losses,
       league_wins, league_losses, league_name, league_finish,
       playoff_wins, playoff_losses, total_wins, total_losses,
       brothers_cup, playoff_result, special_note)
WHERE teams.slug = 'sjj';
