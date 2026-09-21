-- TM-30 (final piece): 2000 and 2001 -- Andy confirmed both University
-- School games (5/24/00 and 5/12/01) were losses, so one loss moves from
-- regular-season to playoffs in each year. Total record is unchanged;
-- only the split changes. Division confirmed as 2 for both.

-- 2000: was 9-3 regular / 0-0 playoff. Now 9-2 regular / 0-1 playoff.
UPDATE program_seasons
SET division = 2,
    regular_wins = 9, regular_losses = 2,
    playoff_wins = 0, playoff_losses = 1,
    total_wins = 9, total_losses = 3
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND season_year = 2000;

-- 2001: was 3-12 regular / 0-0 playoff. Now 3-11 regular / 0-1 playoff.
UPDATE program_seasons
SET division = 2,
    regular_wins = 3, regular_losses = 11,
    playoff_wins = 0, playoff_losses = 1,
    total_wins = 3, total_losses = 12
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND season_year = 2001;

-- Same as 1996-1999 (db/017): Coaching Stats derives directly from
-- program_seasons.head_coach, so this also corrects Chad Fredericks'
-- career coaching numbers -- no other table needs touching.
