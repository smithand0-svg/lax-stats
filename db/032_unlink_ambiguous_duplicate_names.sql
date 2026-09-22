-- Fix: makePlayerResolver (src/lib/playerLookup.js) used to fall
-- through to an arbitrary matches[0] when a name matched MORE THAN ONE
-- real player and grad year didn't uniquely narrow it -- silently
-- attaching award/honor data to the wrong actual person, not just
-- failing to link. Found live: "Nate Miller" (2021 external honor)
-- got linked to the '14-grad Nate Miller (Wooster commit) instead of
-- the different, correct Nate Miller active in 2021. The resolver
-- itself is now fixed to return null instead of guessing when this
-- happens -- this migration retroactively undoes any bad picks
-- db/025/026/027/029 may have already made the same way.
--
-- season_honors has a real grad_year column, so a row can be verified
-- safe: if grad_year exactly matches the currently-linked player's own
-- graduation_year, that's a genuine signal it was the right pick, not
-- a guess -- left alone. Anything else pointing at a duplicate-named
-- player is unlinked (player_id set to NULL; player_name and every
-- other field is untouched, so nothing about the actual award/honor
-- is lost -- only the profile-page link).
UPDATE season_honors sh
SET player_id = NULL
FROM players cur
WHERE sh.player_id = cur.id
  AND EXISTS (
    SELECT 1 FROM players other
    WHERE other.team_id = cur.team_id
      AND other.id <> cur.id
      AND lower(other.first_name) = lower(cur.first_name)
      AND lower(other.last_name) = lower(cur.last_name)
  )
  AND sh.grad_year IS DISTINCT FROM cur.graduation_year;

-- team_awards has no grad_year column -- season_year (the year the
-- award was GIVEN) was only ever a rough proxy, and season_year ==
-- graduation_year is neither necessary nor sufficient for a correct
-- match even when the original pick WAS right (most guys don't win an
-- award in their graduating season). There is no reliable way to
-- verify these after the fact from data alone, so every team_awards
-- row currently linked to a duplicate-named player is unlinked
-- unconditionally -- Andy can re-verify and relink each one by eye
-- through the admin form, since he actually knows who won what.
UPDATE team_awards ta
SET player_id = NULL
FROM players cur
WHERE ta.player_id = cur.id
  AND EXISTS (
    SELECT 1 FROM players other
    WHERE other.team_id = cur.team_id
      AND other.id <> cur.id
      AND lower(other.first_name) = lower(cur.first_name)
      AND lower(other.last_name) = lower(cur.last_name)
  );

-- Run this to see every duplicate-full-name pair on the team, and every
-- award/honor row that just got unlinked (or was already unlinked) for
-- one of them -- worth Andy's eyes on every one of these:
SELECT p.first_name, p.last_name, p.graduation_year, p.id
FROM players p
WHERE EXISTS (
  SELECT 1 FROM players other
  WHERE other.team_id = p.team_id AND other.id <> p.id
    AND lower(other.first_name) = lower(p.first_name) AND lower(other.last_name) = lower(p.last_name)
)
ORDER BY p.first_name, p.last_name, p.graduation_year;
