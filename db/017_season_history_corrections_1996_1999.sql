-- TM-30: Season History corrections from Andy's yearbook research.
-- 1996, 1997, 1998, 1999 are fully specified and applied here.
-- 2000 and 2001 are NOT included yet -- see the note at the bottom of
-- this file; one detail is needed from Andy before those can be written
-- correctly.

-- 1996: yearbook says defeated in the 2nd round of the playoffs (1-1),
-- redistributed out of what was previously logged as a 13-8 regular-only
-- season. Total stays 13-8 either way. Division confirmed as 1.
UPDATE program_seasons
SET division = 1,
    regular_wins = 12, regular_losses = 7,
    playoff_wins = 1, playoff_losses = 1,
    total_wins = 13, total_losses = 8,
    special_note = 'Yearbook says 2nd round of playoffs, unsure of # of teams'
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND season_year = 1996;

-- 1997: 1998 yearbook states a 6th place finish, 12-9 overall.
-- Regular 11-8, playoffs 1-1 (11+1=12, 8+1=9). Division confirmed as 1.
UPDATE program_seasons
SET division = 1,
    regular_wins = 11, regular_losses = 8,
    playoff_wins = 1, playoff_losses = 1,
    total_wins = 12, total_losses = 9
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND season_year = 1997;

-- 1998: team finished 7-12 overall, but the playoff format that year was
-- an 8-team single-elimination bracket with consolation games -- finished
-- 7th exactly. Regular 6-10, playoffs 1-2 (6+1=7, 10+2=12 -- total
-- unchanged). Division confirmed as 2. Also carries the Pagniano note
-- (see 1999 below -- Andy wants the same note on both years).
UPDATE program_seasons
SET division = 2,
    regular_wins = 6, regular_losses = 10,
    playoff_wins = 1, playoff_losses = 2,
    total_wins = 7, total_losses = 12,
    special_note = 'Mike Pagniano split HC duties with Chad Fredericks'
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND season_year = 1998;

-- 1999: regular season 7-8 confirmed correct as-is, no change there.
-- Yearbook adds a playoff loss to Cincinnati Sycamore, Elite 8 exit --
-- best available is 0-1 (other playoff games, if any, aren't
-- verifiable yet). Total moves from 7-8 to 7-9. Division confirmed as 2.
-- Same Pagniano note as 1998.
UPDATE program_seasons
SET division = 2,
    playoff_wins = 0, playoff_losses = 1,
    total_wins = 7, total_losses = 9,
    playoff_result = 'Elite 8',
    special_note = 'Mike Pagniano split HC duties with Chad Fredericks'
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND season_year = 1999;

-- Note: Coaching Stats has no separate table -- it's derived directly
-- from program_seasons.head_coach, so these four UPDATEs alone are
-- enough to correct Chad Fredericks' and Jim Reed's career numbers too.
-- No other table needs touching for 1996-1999.

-- John Kozak, 1998: 48 goals that season (combined -- Andy confirmed
-- regular + playoffs together, not split), including a 6-goal game
-- against St. Francis Toledo (likely playing as "Toledo Wolfpack" at
-- the time -- their official first season as St. Francis wasn't until
-- 2002). No single-game individual record tracking exists yet (that's
-- TM-19), so the single-game detail is kept in source_note for context
-- rather than as its own row.
INSERT INTO players (team_id, first_name, last_name, is_legacy, notes)
SELECT t.id, 'John', 'Kozak', TRUE, 'Legacy player, 1998 season only tracked so far -- from Andy''s school yearbook research'
FROM teams t
WHERE t.slug = 'sjj'
  AND NOT EXISTS (
    SELECT 1 FROM players p2
    WHERE p2.team_id = t.id AND p2.first_name = 'John' AND p2.last_name = 'Kozak'
  );

INSERT INTO season_stat_summaries (team_id, player_id, season_year, game_type, goals, source_note)
SELECT t.id, p.id, 1998, 'combined', 48,
       'From school yearbook: 48 goals in 1998, including a 6-goal game vs St. Francis Toledo (then playing as Toledo Wolfpack)'
FROM teams t
JOIN players p ON p.team_id = t.id AND p.first_name = 'John' AND p.last_name = 'Kozak'
WHERE t.slug = 'sjj'
ON CONFLICT (team_id, player_id, season_year, game_type) DO NOTHING;

-- ============================================================
-- NOT YET INCLUDED: 2000 and 2001
-- ============================================================
-- Both years: the final game of the season (vs University School, 5/24/00
-- and 5/12/01 respectively) was actually a playoff game, currently
-- counted as a regular-season game. Division should become 2 for both.
-- Needed before writing the fix: was the University School game a WIN or
-- a LOSS in each year? That decides which column (wins or losses) moves
-- from regular to playoff:
--   2000 currently: regular 9-3, playoff 0-0, total 9-3
--   2001 currently: regular 3-12, playoff 0-0, total 3-12
-- Total stays the same either way -- only the regular/playoff split
-- changes. Will follow up as db/018 once confirmed.
