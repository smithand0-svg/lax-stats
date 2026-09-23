-- Corrections from Jim Reed's January 2008 email to Mike McComish,
-- compiled from Reed's own scorebooks. Andy treats everything in that
-- email as fact (2026-09-23).
--
-- 2006: the row had 12-8 as the REGULAR season plus 1-1 playoffs, for
-- 13-9 total. 12-8 was actually the full season (Reed's email, Game
-- History, and LaxPower all agree, 20 games), so regular is 11-7.
--
-- 1996: Reed lists 14-5 (the row had 13-8). Pre-2002 results all count
-- as regular season, so regular and total both become 14-5.
--
-- 1992: SJJ joined the OHSLA for the 1992 season (same email).
--
-- Scoped by identity (team + year), not by current value, so these
-- can't silently match zero rows.
UPDATE program_seasons
SET regular_wins = 11, regular_losses = 7, total_wins = 12, total_losses = 8
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND season_year = 2006;

UPDATE program_seasons
SET regular_wins = 14, regular_losses = 5, total_wins = 14, total_losses = 5
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND season_year = 1996;

UPDATE program_seasons
SET special_note = CASE WHEN special_note IS NULL OR special_note = '' THEN 'Joined OHSLA'
                        ELSE special_note || '. Joined OHSLA' END
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND season_year = 1992;

-- Verify: expect three rows.
--   1992  0-6   note includes "Joined OHSLA"
--   1996  14-5 regular, 14-5 total
--   2006  11-7 regular, 1-1 playoffs, 12-8 total
SELECT season_year, head_coach, regular_wins, regular_losses, playoff_wins, playoff_losses,
       total_wins, total_losses, special_note
FROM program_seasons
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND season_year IN (1992, 1996, 2006)
ORDER BY season_year;
