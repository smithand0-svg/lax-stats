-- Fix: link the 2021 "Nate Miller" external honor (unlinked by
-- db/032, since it couldn't safely tell the two real Nate Millers
-- apart) to the correct one -- identified by Andy as the Nate Miller
-- with logged stats in BOTH 2021 and 2022, not the '14-grad Wooster
-- commit. Using season_totals activity as the identifying signal
-- (a real, checkable fact) rather than a guessed graduation year.
UPDATE season_honors
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
  AND player_name = 'Nate Miller'
  AND season_year = 2021
  AND player_id IS NULL;

-- Confirms exactly one row changed and shows the result:
SELECT id, player_id, player_name, season_year, honor_label
FROM season_honors
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND player_name = 'Nate Miller';
