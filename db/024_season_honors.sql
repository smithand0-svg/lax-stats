-- TM-18: internal Team Awards + external Player Honors (season awards),
-- kept as two tables since their shapes genuinely differ -- matches the
-- source spreadsheet's own two-tab split.

-- ============================================================
-- Internal recognition (program's own end-of-season awards)
-- ============================================================
-- Coaches Award, Rookie Award, and Anchor Award are program-level --
-- Andy: ~99.9999999999999% always Varsity, for all of history going
-- forward -- so team_level is still populated for every row (never
-- left NULL), just expected to always be 'Varsity' for those three.
-- E&A / Most Improved / D MVP / O MVP genuinely repeat across levels
-- (Varsity / JV Gold / JV Blue). Multiple players may share an award
-- in a season (coach's discretion) -- one row per (award, recipient),
-- not a slash-joined string like the source sheet uses. Not every
-- category needs a winner every season -- zero rows for a category in
-- a season is expected, not a data gap. History only goes back to 2015.
CREATE TABLE team_awards (
    id             BIGSERIAL PRIMARY KEY,
    team_id        BIGINT NOT NULL REFERENCES teams(id),
    season_year    INT NOT NULL,
    team_level     TEXT NOT NULL CHECK (team_level IN ('Varsity', 'JV Gold', 'JV Blue')),
    award_category TEXT NOT NULL CHECK (award_category IN (
                       'Coaches Award', 'Rookie Award', 'Anchor Award',
                       'E&A', 'Most Improved', 'D MVP', 'O MVP'
                     )),
    player_id      BIGINT REFERENCES players(id),
    player_name    TEXT NOT NULL,   -- always stored as-is, same convention as player_honors
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- External recognition (League, OHSLCA, USA Lacrosse, OHSAA, ...)
-- ============================================================
-- honor_source is deliberately NOT a CHECK-constrained enum -- Andy
-- confirmed a real, separate set of OHSAA awards exists and he doesn't
-- know the full list yet (Andrew Smith won an OHSAA Sportsmanship,
-- Ethics and Integrity Award in 2025-26 -- a coach honor, out of scope
-- here, but it confirms OHSAA as a real, only-partially-known source).
-- honor_label is free text for the same reason -- position+tier would
-- force a shape that breaks on non-positional "Other" awards (Player
-- of the Year, Man of the Year).
--
-- recipient_type is reserved for TM-18's sibling ticket (coach/staff
-- awards, new staff table) -- 'player' is the only legal value for now
-- so this ticket stays player-only; that ticket will ALTER this CHECK
-- to add 'staff' and add a staff_id column once the staff table exists,
-- rather than reworking this table from scratch.
--
-- season_year is the season the honor was earned (from the source
-- sheet's merged column header). grad_year is the player's own
-- graduation/class year (from the sheet's per-row "Year" column) --
-- these are NOT the same thing, confirmed from a real discrepancy in
-- the source data (Caleb DeLong listed as Year=2027 under the "2026
-- Winners" block). Keeping both, nullable independently, avoids ever
-- conflating them again.
CREATE TABLE season_honors (
    id             BIGSERIAL PRIMARY KEY,
    team_id        BIGINT NOT NULL REFERENCES teams(id),
    recipient_type TEXT NOT NULL DEFAULT 'player' CHECK (recipient_type IN ('player')),
    player_id      BIGINT REFERENCES players(id),
    player_name    TEXT NOT NULL,
    position       TEXT,            -- nullable -- non-positional honors (e.g. Player of the Year) have none
    honor_source   TEXT NOT NULL,   -- e.g. 'League (CHSL)', 'OHSLCA - Region', 'OHSLCA - State', 'USA Lacrosse', 'OHSAA'
    honor_label    TEXT NOT NULL,   -- e.g. '1st Team All-Region', 'CHSL - All Catholic', 'Bob Scott Award'
    season_year    INT NOT NULL,    -- season the honor was earned
    grad_year      INT,             -- player's graduation/class year, distinct from season_year -- see note above
    note           TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Migrate USA Lacrosse honors out of player_honors into season_honors
-- ============================================================
-- all_american / academic_all_american were already live in
-- player_honors and shown on /college-honors -- these are USA Lacrosse
-- season honors, not college-recruiting outcomes, so they belong here
-- now. grad_year is left NULL (unknown for these pre-existing rows,
-- same as it always was). honor_year on the old rows was already the
-- season earned (no Year-column ambiguity applied to these), so it
-- maps straight across to season_year.
INSERT INTO season_honors (team_id, player_id, player_name, position, honor_source, honor_label, season_year, note)
SELECT team_id, player_id, player_name, position,
       'USA Lacrosse',
       CASE honor_type WHEN 'all_american' THEN 'All-American' ELSE 'Academic All-American' END,
       honor_year, note
FROM player_honors
WHERE honor_type IN ('all_american', 'academic_all_american');

DELETE FROM player_honors WHERE honor_type IN ('all_american', 'academic_all_american');

-- player_honors narrows back to what it's actually for: college
-- commitments and collegiate (college-career) all-american honors --
-- a genuinely different concept from season awards.
ALTER TABLE player_honors DROP CONSTRAINT player_honors_honor_type_check;
ALTER TABLE player_honors ADD CONSTRAINT player_honors_honor_type_check
  CHECK (honor_type IN ('college_commitment', 'collegiate_all_american'));
