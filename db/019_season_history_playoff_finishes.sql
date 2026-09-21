-- TM-30 follow-on: playoff_result is free-text (already holds values
-- like 'Sweet 16', 'Elite 8', 'State Finals') -- 1997's 6th-place and
-- 1998's 7th-place finishes belong there too, same as any other year.
-- Missed in db/017 despite being right in the ticket text; not a schema
-- gap, just an oversight.

UPDATE program_seasons
SET playoff_result = '6th'
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND season_year = 1997;

UPDATE program_seasons
SET playoff_result = '7th'
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND season_year = 1998;
