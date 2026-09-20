-- TM-14: Olentangy vs Liberty Olentangy, resolved per Andy (2026-09-20).
-- There are actually 4 (soon 5) separate Olentangy-district schools:
-- Olentangy ("Regular"), Olentangy Liberty, Olentangy Orange, Olentangy
-- Berlin. Of the 11 games from 2003-2013 stored as plain "Olentangy",
-- only 2012-04-02 was actually against Liberty -- everything else in
-- that list is correctly "Olentangy" as-is and needs no change.

-- 1) The existing "Liberty Olentangy" opponent has its words reversed
--    from the real school name ("Olentangy Liberty High School") and
--    from how its siblings need to be named below. Rename it, keeping
--    the old spelling as an alias so nothing that already matches it
--    breaks.
UPDATE opponents SET name = 'Olentangy Liberty' WHERE team_id = 1 AND name = 'Liberty Olentangy';

INSERT INTO opponent_aliases (opponent_id, alias_name, source)
SELECT id, 'Liberty Olentangy', 'TM-14 rename 2026-09-20 -- previous canonical spelling'
FROM opponents WHERE team_id = 1 AND name = 'Olentangy Liberty';

-- 2) Pre-existing bug found while fixing this: the LaxPower backfill
--    already had an alias for "Liberty-Olentangy" (hyphenated), but it
--    pointed at plain "Olentangy" -- the WRONG school. Any future import
--    typed exactly that way would have silently resolved to the wrong
--    canonical opponent. Repoint it at the real Liberty campus.
DELETE FROM opponent_aliases
WHERE alias_name = 'Liberty-Olentangy'
  AND opponent_id = (SELECT id FROM opponents WHERE team_id = 1 AND name = 'Olentangy');

INSERT INTO opponent_aliases (opponent_id, alias_name, source)
SELECT id, 'Liberty-Olentangy', 'TM-14 fix 2026-09-20 -- was wrongly aliased to plain Olentangy'
FROM opponents WHERE team_id = 1 AND name = 'Olentangy Liberty';

-- 3) The one confirmed misattributed game: relabel it from plain
--    "Olentangy" to "Olentangy Liberty". No other games in the flagged
--    2003-2013 list change.
UPDATE games
SET opponent = 'Olentangy Liberty'
WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
  AND opponent = 'Olentangy'
  AND game_date = '2012-04-02';

-- 4) Register the other two real Olentangy-district schools now, ahead
--    of ever needing them in an import -- Andy confirmed both exist
--    (a 5th is coming but isn't named/open yet, so not added here).
--    No aliases guessed at; add real ones if/when an actual import
--    spells either differently.
INSERT INTO opponents (team_id, name) VALUES (1, 'Olentangy Orange');
INSERT INTO opponents (team_id, name) VALUES (1, 'Olentangy Berlin');
