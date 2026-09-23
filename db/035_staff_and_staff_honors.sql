-- TM-37: staff (coaches) as real entities, separate from players, so
-- coach-earned honors and per-season role assignments have somewhere
-- real to live instead of the free-text head_coach column doing all
-- the work.

CREATE TABLE staff (
    id          BIGSERIAL PRIMARY KEY,
    team_id     BIGINT NOT NULL REFERENCES teams(id),
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    bio         TEXT,             -- optional -- Andy may not fill this out immediately
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (team_id, first_name, last_name)
);

-- One row per (person, season, level, role) -- a real join table, not
-- a single role/level pair per staff per season, since Andy confirmed
-- a coach can hold more than one role in the same season, even on
-- different teams (e.g. Varsity Assistant AND JV Gold Head Coach at
-- once). team_level reuses team_awards' own values for consistency.
-- role is deliberately free text (with suggestions in the admin form,
-- not a DB CHECK) -- Andy didn't give an exhaustive role list the way
-- he did for award categories, and coaching titles vary too much to
-- lock down.
CREATE TABLE staff_seasons (
    id          BIGSERIAL PRIMARY KEY,
    staff_id    BIGINT NOT NULL REFERENCES staff(id),
    season_year INT NOT NULL,
    team_level  TEXT NOT NULL CHECK (team_level IN ('Varsity', 'JV Gold', 'JV Blue')),
    role        TEXT NOT NULL,
    UNIQUE (staff_id, season_year, team_level, role)
);

-- Backfill every known head coach directly from program_seasons.head_coach
-- (dynamic, not hand-transcribed -- correctly picks up Jim Reed's two
-- separate stints as separate season rows automatically).
INSERT INTO staff (team_id, first_name, last_name)
SELECT DISTINCT
  (SELECT id FROM teams WHERE slug = 'sjj'),
  regexp_replace(head_coach, '\s+\S+$', ''),
  regexp_replace(head_coach, '^.*\s', '')
FROM program_seasons
WHERE head_coach IS NOT NULL;

INSERT INTO staff_seasons (staff_id, season_year, team_level, role)
SELECT s.id, ps.season_year, 'Varsity', 'Head Coach'
FROM program_seasons ps
JOIN teams t ON t.id = ps.team_id
JOIN staff s ON s.team_id = t.id
  AND s.first_name = regexp_replace(ps.head_coach, '\s+\S+$', '')
  AND s.last_name = regexp_replace(ps.head_coach, '^.*\s', '')
WHERE ps.head_coach IS NOT NULL AND t.slug = 'sjj';

-- ============================================================
-- Nick Brown never appears as a head coach, so the backfill above
-- never creates him -- but his own award title ("Assistant Coach of
-- the Year") is itself good evidence of a real role, so he's added
-- explicitly here rather than left to dangle unlinked until someone
-- notices. Seasons match the three confirmed award years below.
-- ============================================================
INSERT INTO staff (team_id, first_name, last_name)
SELECT (SELECT id FROM teams WHERE slug = 'sjj'), 'Nick', 'Brown'
WHERE NOT EXISTS (
  SELECT 1 FROM staff WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
    AND first_name = 'Nick' AND last_name = 'Brown'
);

INSERT INTO staff_seasons (staff_id, season_year, team_level, role)
SELECT s.id, y, 'Varsity', 'Assistant Coach'
FROM staff s
CROSS JOIN unnest(ARRAY[2019, 2023, 2025]) AS y
WHERE s.team_id = (SELECT id FROM teams WHERE slug = 'sjj')
  AND s.first_name = 'Nick' AND s.last_name = 'Brown'
ON CONFLICT (staff_id, season_year, team_level, role) DO NOTHING;

-- ============================================================
-- season_honors (TM-18): widen for staff recipients -- exactly the
-- extension its own design comment reserved room for.
-- ============================================================
ALTER TABLE season_honors ADD COLUMN staff_id BIGINT REFERENCES staff(id);
ALTER TABLE season_honors DROP CONSTRAINT season_honors_recipient_type_check;
ALTER TABLE season_honors ADD CONSTRAINT season_honors_recipient_type_check
  CHECK (recipient_type IN ('player', 'staff'));

-- Seed the three staff honors already identified while scoping TM-18:
-- Nick Brown, Assistant Coach of the Year, three separate seasons
-- (2019, 2023, 2025); Andrew Smith, OHSAA Sportsmanship, Ethics and
-- Integrity Award (2026); and the same Andrew Smith (the source sheet
-- spells him "Andy Smith" in this one row -- same real person, same
-- fuzzy-nickname situation as Nick/Nicholas Bowers), Man of the Year
-- (2018). Resolved via the same last-name + first-3-letters fuzzy
-- match as the player-side backfill (db/029), not exact-match-only,
-- specifically to bridge Andy/Andrew.
WITH staff_honors_raw(full_name, season_year, honor_source, honor_label) AS (
  VALUES
    ('Nick Brown', 2019, 'OHSLCA - Region', 'Assistant Coach of the Year'),
    ('Nick Brown', 2023, 'OHSLCA - Region', 'Assistant Coach of the Year'),
    ('Nick Brown', 2025, 'OHSLCA - Region', 'Assistant Coach of the Year'),
    ('Andrew Smith', 2026, 'OHSAA', 'OHSAA Sportsmanship, Ethics and Integrity Award'),
    ('Andy Smith', 2018, 'OHSLCA - Region', 'Man of the Year')
)
INSERT INTO season_honors (team_id, recipient_type, staff_id, player_name, honor_source, honor_label, season_year)
SELECT
  t.id, 'staff', sf.id,
  shr.full_name, -- player_name column doubles as the display name here (see TM-18: always stored as-is)
  shr.honor_source, shr.honor_label, shr.season_year
FROM teams t
CROSS JOIN staff_honors_raw shr
LEFT JOIN LATERAL (
  SELECT s2.id
  FROM staff s2
  WHERE s2.team_id = t.id
    AND lower(s2.last_name) = lower(regexp_replace(shr.full_name, '^.*\s', ''))
    AND left(lower(s2.first_name), 3) = left(lower(regexp_replace(shr.full_name, '\s+\S+$', '')), 3)
  ORDER BY s2.id
  LIMIT 1
) sf ON true
WHERE t.slug = 'sjj';

-- Review: confirm Andy/Andrew Smith's two entries share one staff_id.
SELECT sh.id, sh.player_name, sh.staff_id, s.first_name, s.last_name
FROM season_honors sh
LEFT JOIN staff s ON s.id = sh.staff_id
WHERE sh.recipient_type = 'staff';
