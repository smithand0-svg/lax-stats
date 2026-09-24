-- Nick Brown's varsity role titles (Andy, 2026-09-23):
--   2015-2019: Assistant Coach -> Offensive Coordinator
--   2021-2027: Assistant Coach -> Associate Head Coach/OC
-- 2020 is not mentioned, so it is left unchanged (see the BEFORE list).
--
-- Resolves Nick Brown the same way the app does: exact name, else last
-- name plus first three letters of the first name (so "Nicholas Brown"
-- also matches). It refuses to run if that finds no one, or more than
-- one person, rather than guessing. Varsity rows only.

-- BEFORE: all of Nick Brown's current roles, for reference.
SELECT s.first_name, s.last_name, ss.season_year, ss.team_level, ss.role
FROM staff s JOIN staff_seasons ss ON ss.staff_id = s.id
WHERE s.team_id = (SELECT id FROM teams WHERE slug = 'sjj')
  AND lower(s.last_name) = 'brown' AND lower(left(s.first_name, 3)) = 'nic'
ORDER BY ss.season_year, ss.team_level;

DO $$
DECLARE
  matches INT;
  nick_id BIGINT;
  n1 INT;
  n2 INT;
BEGIN
  SELECT COUNT(*), MIN(id) INTO matches, nick_id
  FROM staff
  WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
    AND lower(last_name) = 'brown' AND lower(left(first_name, 3)) = 'nic';

  IF matches <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one Nick Brown in staff, found %. Nothing changed.', matches;
  END IF;

  UPDATE staff_seasons SET role = 'Offensive Coordinator'
  WHERE staff_id = nick_id AND team_level = 'Varsity' AND role = 'Assistant Coach'
    AND season_year BETWEEN 2015 AND 2019;
  GET DIAGNOSTICS n1 = ROW_COUNT;

  UPDATE staff_seasons SET role = 'Associate Head Coach/OC'
  WHERE staff_id = nick_id AND team_level = 'Varsity' AND role = 'Assistant Coach'
    AND season_year BETWEEN 2021 AND 2027;
  GET DIAGNOSTICS n2 = ROW_COUNT;

  -- Reported in phpPgAdmin's messages. Expect 5 and 7 if every one of
  -- those seasons was on file as Varsity Assistant Coach. A lower number
  -- means some seasons were missing or titled differently: compare with
  -- the BEFORE and AFTER lists.
  RAISE NOTICE 'Updated % rows to Offensive Coordinator (2015-2019) and % rows to Associate Head Coach/OC (2021-2027).', n1, n2;
END $$;

-- AFTER: expect 2015-2019 Offensive Coordinator, 2021-2027 Associate Head Coach/OC.
SELECT s.first_name, s.last_name, ss.season_year, ss.team_level, ss.role
FROM staff s JOIN staff_seasons ss ON ss.staff_id = s.id
WHERE s.team_id = (SELECT id FROM teams WHERE slug = 'sjj')
  AND lower(s.last_name) = 'brown' AND lower(left(s.first_name, 3)) = 'nic'
ORDER BY ss.season_year, ss.team_level;
