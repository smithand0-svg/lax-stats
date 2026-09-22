-- ============================================================
-- 1. Name correction: Carson Borkowski -> Carson Borkosky (player 58)
-- ============================================================
UPDATE players SET last_name = 'Borkosky'
WHERE id = 58 AND first_name = 'Carson' AND last_name = 'Borkowski';

-- ============================================================
-- 2. Nate Miller's 2021 team award -- same identification method as
-- db/033 (stat activity in both 2021 and 2022), applied to whichever
-- team_awards row actually matches (the backfill has this logged as
-- JV Gold O MVP, not JV Blue as Andy described it from memory -- if
-- that's a real distinct second award rather than a misremembered
-- level, it was never captured and needs adding fresh via the admin
-- form, not by this migration).
-- ============================================================
UPDATE team_awards
SET player_id = (
  SELECT p.id
  FROM players p
  JOIN teams t ON t.id = p.team_id
  WHERE t.slug = 'sjj'
    AND lower(p.first_name) = 'nate' AND lower(p.last_name) = 'miller'
    AND EXISTS (SELECT 1 FROM season_totals st WHERE st.player_id = p.id AND st.season_year = 2021)
    AND EXISTS (SELECT 1 FROM season_totals st WHERE st.player_id = p.id AND st.season_year = 2022)
)
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
  AND player_name = 'Nate Miller' AND season_year = 2021 AND player_id IS NULL;

-- ============================================================
-- 3. Create a real player profile (is_legacy = true, no stat data)
-- for every award/honor recipient still unattributed after the fixes
-- above -- guarded so a name matching an EXISTING player (of any
-- graduation year) is never touched here, only genuinely new names.
-- This means an unresolved duplicate-name case (if any remain) is
-- safely left alone rather than risking a duplicate profile.
-- ============================================================
WITH unresolved_names AS (
  SELECT DISTINCT player_name FROM team_awards
  WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND player_id IS NULL
  UNION
  SELECT DISTINCT player_name FROM season_honors
  WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND player_id IS NULL
),
new_players AS (
  SELECT
    regexp_replace(player_name, '\s+\S+$', '') AS first_name,
    regexp_replace(player_name, '^.*\s', '') AS last_name
  FROM unresolved_names un
  WHERE NOT EXISTS (
    SELECT 1 FROM players p
    JOIN teams t ON t.id = p.team_id
    WHERE t.slug = 'sjj'
      AND lower(p.first_name) = lower(regexp_replace(un.player_name, '\s+\S+$', ''))
      AND lower(p.last_name) = lower(regexp_replace(un.player_name, '^.*\s', ''))
  )
)
INSERT INTO players (team_id, first_name, last_name, is_legacy)
SELECT (SELECT id FROM teams WHERE slug = 'sjj'), first_name, last_name, true
FROM new_players;

-- Link every now-resolvable row to the player just created (or to any
-- pre-existing exact-name match not caught above for some other
-- reason) -- exact match only, deliberately no fuzzy fallback here,
-- since these are brand-new rows just inserted with exactly the name
-- as typed.
UPDATE team_awards ta
SET player_id = p.id
FROM players p JOIN teams t ON t.id = p.team_id
WHERE t.slug = 'sjj' AND ta.team_id = t.id AND ta.player_id IS NULL
  AND lower(p.first_name || ' ' || p.last_name) = lower(ta.player_name);

UPDATE season_honors sh
SET player_id = p.id
FROM players p JOIN teams t ON t.id = p.team_id
WHERE t.slug = 'sjj' AND sh.team_id = t.id AND sh.player_id IS NULL
  AND lower(p.first_name || ' ' || p.last_name) = lower(sh.player_name);

-- Review every new profile created, and confirm nothing is left
-- unattributed except a genuine remaining duplicate-name case:
SELECT id, first_name, last_name, is_legacy, created_at FROM players
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND is_legacy = true
ORDER BY created_at DESC;

SELECT 'team_awards' AS source, player_name FROM team_awards
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND player_id IS NULL
UNION ALL
SELECT 'season_honors' AS source, player_name FROM season_honors
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND player_id IS NULL;
