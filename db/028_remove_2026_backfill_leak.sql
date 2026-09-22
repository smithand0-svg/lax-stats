-- Fix: db/025's backfill was supposed to exclude 2026 entirely (Andy
-- was entering that season by hand as the tool's own QA pass) -- and
-- it correctly did, for team_awards. But the exclusion was only
-- applied to the Team Awards half of the parsing script, not the
-- External Honors half, so 14 season_honors rows for season_year=2026
-- got backfilled anyway, sitting alongside Andy's own manual 2026
-- entries for some of the same real-world awards.
--
-- Scoped to the exact created_at timestamp db/025's single INSERT
-- statement gave every row it touched (a statement's now() is one
-- fixed value for the whole statement) -- not to content -- so this
-- can't accidentally delete one of Andy's own manual entries even
-- where the content looks similar or identical. Confirmed against
-- Andy's own phpPgAdmin output: 2026-09-22 14:30:55.32138-05.
--
-- IMPORTANT: verify this timestamp still matches what you see in your
-- own table before running -- if it's even slightly different, STOP
-- and check with Claude rather than adjusting it yourself, since a
-- wrong timestamp here would delete the wrong rows.
DELETE FROM season_honors
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
  AND season_year = 2026
  AND created_at = '2026-09-22 14:30:55.32138-05';

-- Run this after, to confirm exactly 14 rows are gone and nothing else
-- from 2026 was touched:
--   SELECT count(*) FROM season_honors WHERE team_id = (SELECT id FROM teams WHERE slug='sjj') AND season_year = 2026;
-- (should now show only your own manually-entered 2026 rows)
