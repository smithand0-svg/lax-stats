-- Normalize position abbreviations in season_honors to full titles,
-- per Andy's mapping. Only touches season_honors -- team_awards has no
-- position column. Left OUT of this pass: 'SSD' and 'SSDM' (Short
-- Stick D / Short Stick Defensive Midfielder, presumably) -- not
-- covered by any of Andy's six rules, and folding them into plain
-- "Defensive Midfielder" would lose a real, meaningful distinction
-- (short stick vs. long stick) rather than just abbreviation noise.
-- Waiting on Andy's call before touching those.
UPDATE season_honors SET position = 'Attack' WHERE position = 'A';
UPDATE season_honors SET position = 'Midfield' WHERE position = 'M';
UPDATE season_honors SET position = 'Defense' WHERE position = 'D';
UPDATE season_honors SET position = 'FOGO' WHERE position IN ('F', 'Faceoff');
UPDATE season_honors SET position = 'Goalie' WHERE position IN ('G', 'Goal');
UPDATE season_honors SET position = 'Defensive Midfielder' WHERE position IN ('DM', 'D-Mid');

-- Verify nothing unexpected remains:
--   SELECT DISTINCT position FROM season_honors WHERE team_id = (SELECT id FROM teams WHERE slug='sjj') ORDER BY position;
