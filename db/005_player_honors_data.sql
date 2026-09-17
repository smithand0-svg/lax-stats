-- Player honors, transcribed from Andy's own historical records PDF.
-- player_id is resolved by exact case-insensitive name match against the
-- players table — expect many NULLs here, since most college-commitment
-- entries from the 1990s/2000s predate our stat data entirely. That's
-- correct, not a bug: they'll still show on the standalone honors page,
-- just without a player-profile link.

WITH honors_raw(player_name, honor_type, honor_year, position, school, division, note) AS (
  VALUES
    -- College commitments
    ('James Yap', 'college_commitment', 1991, 'Goalie', 'Michigan State University', 'D1', NULL::text),
    ('Eric Schaeffer', 'college_commitment', 1994, 'Attack', 'Wittenberg University', 'D3', NULL),
    ('James Reed', 'college_commitment', 1994, 'Midfield', 'Ohio State University', 'D1', NULL),
    ('Andrew Durniat', 'college_commitment', 1997, 'Defense', 'Ohio Wesleyan University', 'D3', NULL),
    ('Michael Durniat', 'college_commitment', 2000, 'Attack', 'Ohio Wesleyan University', 'D3', NULL),
    ('Chris Nixon', 'college_commitment', 2004, 'Midfield', 'Wooster College', 'D3', NULL),
    ('Ryan McMahon', 'college_commitment', 2004, 'Attack', 'Wooster College', 'D3', NULL),
    ('Brian Masterson', 'college_commitment', 2006, 'Attack', 'Queens University Charlotte', 'D2', NULL),
    ('Riley Seidel', 'college_commitment', 2009, 'Attack', 'Colorado', 'D1', NULL),
    ('Connor Martin', 'college_commitment', 2009, 'Midfield', 'Robert Morris', 'D1', NULL),
    ('Spencer Lonseth', 'college_commitment', 2013, 'Attack', 'University of Tampa', 'D2', NULL),
    ('John Emmenecker', 'college_commitment', 2013, 'Midfield', 'Robert Morris', 'D1', NULL),
    ('Jonathan Yobaggy', 'college_commitment', 2013, 'LSM', 'Adrian College', 'D3', NULL),
    ('Cameron Happel', 'college_commitment', 2014, 'Midfield', 'Mercyhurst', 'D2', NULL),
    ('Nate Miller', 'college_commitment', 2014, 'Attack', 'Wooster College', 'D3', NULL),
    ('Jacob Ransom', 'college_commitment', 2014, 'Defense', 'Walsh University', 'D2', NULL),
    ('Bo Taylor', 'college_commitment', 2017, 'LSM', 'Albion', 'D3', NULL),
    ('Nathan Steinmetz', 'college_commitment', 2018, 'Defense', 'Mount Union', 'D3', NULL),
    ('Nathan Aloi', 'college_commitment', 2019, 'Midfield', 'John Carroll', 'D3', NULL),
    ('Chandler Bankey', 'college_commitment', 2019, 'Attack', 'John Carroll', 'D3', NULL),
    ('Sam Rodgers', 'college_commitment', 2019, 'Defense', 'John Carroll', 'D3', NULL),
    ('Ryan Pierce', 'college_commitment', 2020, 'Goalie', 'Capital', 'D3', NULL),
    ('Andrew Miller', 'college_commitment', 2021, 'Attack', 'Albion', 'D3', NULL),
    ('Quinn Staten', 'college_commitment', 2023, 'Midfield', 'Cincinnati (football)', 'D1', NULL),
    ('Zachary Zitkovic', 'college_commitment', 2023, 'Midfield', 'Hillsdale (football)', 'D2', NULL),
    ('Will Bohne', 'college_commitment', 2023, 'Midfield', 'Monmouth', 'D1', NULL),
    ('Owen Winkler', 'college_commitment', 2024, 'FOGO', 'Muskingum', 'D3', NULL),
    ('Ty Sadowy', 'college_commitment', 2024, 'Goalie/Defense', 'Heidelberg', 'D3', NULL),
    ('Kyler Ayers', 'college_commitment', 2025, 'Defense', 'Hope College', 'D3', NULL),
    ('Ryan Kosola', 'college_commitment', 2026, 'Attack', 'Alma', 'D3', NULL),

    -- All Americans
    ('Bennett Miller', 'all_american', 2016, 'Attack', NULL, NULL, NULL),

    -- Academic All Americans
    ('Ron Erdelyi', 'academic_all_american', 2007, NULL, NULL, NULL, NULL),
    ('Bennett Miller', 'academic_all_american', 2016, 'Attack', NULL, NULL, NULL),
    ('Nathan Aloi', 'academic_all_american', 2019, 'Midfield', NULL, NULL, NULL),
    ('Quinn Wiklendt', 'academic_all_american', 2024, 'Attack', NULL, NULL, NULL),
    ('Alexander Speer', 'academic_all_american', 2025, 'Attack', NULL, NULL, NULL),

    -- Collegiate All Americans
    ('Andrew Durniat', 'collegiate_all_american', 2001, 'Defense', 'Ohio Wesleyan University', 'D3', 'HM')
)
INSERT INTO player_honors (team_id, player_id, player_name, honor_type, honor_year, position, school, division, note)
SELECT t.id, pl.id, h.player_name, h.honor_type, h.honor_year, h.position, h.school, h.division, h.note
FROM teams t
CROSS JOIN honors_raw h
LEFT JOIN LATERAL (
  -- Some names (e.g. "Nate Miller") match more than one real player —
  -- two different people, disambiguated elsewhere by graduation year.
  -- Prefer whichever match's graduation_year actually matches this
  -- honor's year, so a name collision doesn't silently duplicate the
  -- row or attach the honor to the wrong person.
  SELECT p2.id
  FROM players p2
  WHERE p2.team_id = t.id
    AND lower(p2.first_name || ' ' || p2.last_name) = lower(h.player_name)
  ORDER BY (p2.graduation_year = h.honor_year) DESC NULLS LAST, p2.id
  LIMIT 1
) pl ON true
WHERE t.slug = 'sjj';
