-- Corrected version of db/027 -- the original errored out because
-- PostgreSQL does not allow a LATERAL subquery inside an UPDATE ...
-- FROM clause to reference the table being updated (it isn't actually
-- part of the FROM list, just implicitly available at the top level).
-- Restructured through a CTE, where the table being resolved is a
-- normal FROM-list member and LATERAL can legally see it, then a plain
-- UPDATE ... FROM the CTE keyed by id. Same logic as db/027, just
-- syntactically valid.
--
-- If db/027 partially applied before erroring (unlikely for a single
-- statement, but Postgres wraps each statement in its own implicit
-- transaction when run one at a time in phpPgAdmin), this is still
-- safe to run -- it only touches rows still holding player_id IS NULL,
-- so anything it already fixed is simply skipped the second time.

WITH team_awards_resolved AS (
  SELECT ta.id AS award_id, pl.id AS resolved_player_id
  FROM team_awards ta
  JOIN teams t ON t.id = ta.team_id
  CROSS JOIN LATERAL (
    SELECT p2.id, p2.graduation_year
    FROM players p2
    WHERE p2.team_id = t.id
      AND lower(p2.last_name) = lower(regexp_replace(ta.player_name, '^.*\s', ''))
      AND left(lower(p2.first_name), 3) = left(lower(regexp_replace(ta.player_name, '\s+\S+$', '')), 3)
      AND length(left(lower(regexp_replace(ta.player_name, '\s+\S+$', '')), 3)) = 3
    ORDER BY (p2.graduation_year = ta.season_year) DESC NULLS LAST, p2.id
    LIMIT 1
  ) pl
  WHERE t.slug = 'sjj'
    AND ta.player_id IS NULL
)
UPDATE team_awards
SET player_id = team_awards_resolved.resolved_player_id
FROM team_awards_resolved
WHERE team_awards.id = team_awards_resolved.award_id;

WITH season_honors_resolved AS (
  SELECT sh.id AS honor_id, pl.id AS resolved_player_id
  FROM season_honors sh
  JOIN teams t ON t.id = sh.team_id
  CROSS JOIN LATERAL (
    SELECT p2.id
    FROM players p2
    WHERE p2.team_id = t.id
      AND lower(p2.last_name) = lower(regexp_replace(sh.player_name, '^.*\s', ''))
      AND left(lower(p2.first_name), 3) = left(lower(regexp_replace(sh.player_name, '\s+\S+$', '')), 3)
      AND length(left(lower(regexp_replace(sh.player_name, '\s+\S+$', '')), 3)) = 3
    ORDER BY (p2.graduation_year = sh.grad_year) DESC NULLS LAST, p2.id
    LIMIT 1
  ) pl
  WHERE t.slug = 'sjj'
    AND sh.player_id IS NULL
)
UPDATE season_honors
SET player_id = season_honors_resolved.resolved_player_id
FROM season_honors_resolved
WHERE season_honors.id = season_honors_resolved.honor_id;

-- Same verification queries as db/027:
--   SELECT player_name, player_id FROM team_awards WHERE team_id = (SELECT id FROM teams WHERE slug='sjj') ORDER BY player_name;
--   SELECT player_name, player_id FROM season_honors WHERE team_id = (SELECT id FROM teams WHERE slug='sjj') ORDER BY player_name;
