-- TM-39 corrections, from Andy's review of the flagged items in
-- db/025_awards_backfill.sql.

-- ============================================================
-- MVP category: some years didn't split O MVP / D MVP into two
-- awards -- 2016 JV Blue gave one combined MVP instead (Andy: "we
-- didn't have an O and D MVP" that year). Widening the CHECK rather
-- than forcing this into O MVP or D MVP, since it's neither.
-- ============================================================
ALTER TABLE team_awards DROP CONSTRAINT team_awards_award_category_check;
ALTER TABLE team_awards ADD CONSTRAINT team_awards_award_category_check
  CHECK (award_category IN (
    'Coaches Award', 'Rookie Award', 'Anchor Award',
    'E&A', 'Most Improved', 'D MVP', 'O MVP', 'MVP'
  ));

-- ============================================================
-- Confirmed full names for the last-name-only co-winners flagged
-- from db/025 (2021 Coaches Award, 2025 Anchor Award).
--
-- Note: Andy said "Josh Kraus" -- the player, if already in the
-- players table from stat data, may be recorded as "Joshua Kraus"
-- (that's the spelling in the historical StateLeague honors sheet).
-- Stored exactly as Andy gave it; if the name-match below comes up
-- empty (player_id NULL on this row), that's why -- fix the link via
-- the admin form's player picker rather than assuming it's wrong.
-- ============================================================
WITH corrections_raw(season_year, team_level, award_category, player_name) AS (
  VALUES
    (2021, 'Varsity', 'Coaches Award', 'Josh Kraus'),
    (2021, 'Varsity', 'Coaches Award', 'Colton Bollenbacher'),
    (2025, 'Varsity', 'Anchor Award', 'Alexander Speer'),
    (2025, 'Varsity', 'Anchor Award', 'Drew Duesing'),
    (2025, 'Varsity', 'Anchor Award', 'Cameron Weinberg'),
    (2025, 'Varsity', 'Anchor Award', 'Mason Bowers'),
    -- 2016 JV Blue: two E&A winners, not one -- Colgan Karcher (already
    -- inserted correctly by db/025) plus Pierce Morrison, whose source
    -- cell was misfiled under the D MVP column with a note correcting
    -- it to E&A.
    (2016, 'JV Blue', 'E&A', 'Pierce Morrison'),
    -- 2016 JV Blue: one combined MVP, not a separate O MVP -- replaces
    -- the O MVP row db/025 inserted for Alex Weinberg (deleted below).
    (2016, 'JV Blue', 'MVP', 'Alex Weinberg')
)
INSERT INTO team_awards (team_id, season_year, team_level, award_category, player_id, player_name)
SELECT t.id, c.season_year, c.team_level, c.award_category, pl.id, c.player_name
FROM teams t
CROSS JOIN corrections_raw c
LEFT JOIN LATERAL (
  SELECT p2.id
  FROM players p2
  WHERE p2.team_id = t.id
    AND lower(p2.first_name || ' ' || p2.last_name) = lower(c.player_name)
  ORDER BY (p2.graduation_year = c.season_year) DESC NULLS LAST, p2.id
  LIMIT 1
) pl ON true
WHERE t.slug = 'sjj';

-- Remove the incorrect O MVP row db/025 inserted for this same person/
-- season/level -- superseded by the MVP row just inserted above.
DELETE FROM team_awards
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
  AND season_year = 2016 AND team_level = 'JV Blue' AND award_category = 'O MVP'
  AND player_name = 'Alex Weinberg';

-- ============================================================
-- Confirmed: all 6 previously tier-ambiguous OHSLCA honors from
-- db/025's flagged list are Region-tier, not State-tier (Andy: "All 5
-- of our Position Player of the Year guys were at the All-Region
-- level" -- the 6th, "Region 5 Player of the Year", already said
-- Region in its own label).
-- ============================================================
WITH honors_raw(season_year, grad_year, position, player_name, honor_label) AS (
  VALUES
    (2023, 2023, 'LSM', 'Tyler Meader', 'Position Player of the Year'),
    (2022, 2024, 'Attack', 'Quinn Wiklendt', 'Position Player of the Year'),
    (2022, 2024, 'Attack', 'Quinn Wiklendt', 'Region 5 Player of the Year'),
    (2021, 2021, 'Attack', 'Andrew Miller', 'Position Player of the Year'),
    (2022, 2023, 'LSM', 'Tyler Meader', 'Position Player of the Year'),
    (2022, 2023, 'Midfield', 'Will Bohne', 'Position Player of the Year')
)
INSERT INTO season_honors (team_id, player_id, player_name, position, honor_source, honor_label, season_year, grad_year)
SELECT t.id, pl.id, h.player_name, h.position, 'OHSLCA - Region', h.honor_label, h.season_year, h.grad_year
FROM teams t
CROSS JOIN honors_raw h
LEFT JOIN LATERAL (
  SELECT p2.id
  FROM players p2
  WHERE p2.team_id = t.id
    AND lower(p2.first_name || ' ' || p2.last_name) = lower(h.player_name)
  ORDER BY (p2.graduation_year = h.grad_year) DESC NULLS LAST, p2.id
  LIMIT 1
) pl ON true
WHERE t.slug = 'sjj';
