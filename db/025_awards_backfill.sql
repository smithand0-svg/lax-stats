-- TM-39: historical backfill of Yearly_Awards.xlsx into TM-18's
-- team_awards / season_honors tables. Covers every season EXCEPT 2026 --
-- Andy is entering 2026 by hand through /admin/awards as the tool's own
-- QA pass. A handful of genuinely ambiguous source rows (last-name-only
-- co-winners with no first name given, one row with a note that
-- contradicts its own column category, and a few tier-ambiguous OHSLCA
-- honors) are deliberately NOT included here -- see the chat/ticket for
-- the full flagged list; add those by hand through the admin form once
-- confirmed, same as any other award.

-- ============================================================
-- Internal (Team) Awards
-- ============================================================
WITH team_awards_raw(season_year, team_level, award_category, player_name) AS (
  VALUES
    (2025, 'Varsity', 'Coaches Award', 'Alexander Speer'),
    (2024, 'Varsity', 'Coaches Award', 'Gage Buck'),
    (2023, 'Varsity', 'Coaches Award', 'Tyler Meader'),
    (2022, 'Varsity', 'Coaches Award', 'Charlie Anderson'),
    (2019, 'Varsity', 'Coaches Award', 'Nathan Aloi'),
    (2018, 'Varsity', 'Coaches Award', 'Nate Nachtrab'),
    (2017, 'Varsity', 'Coaches Award', 'Chandler Bankey'),
    (2016, 'Varsity', 'Coaches Award', 'Bennett Miller'),
    (2015, 'Varsity', 'Coaches Award', 'Christian King'),
    (2025, 'Varsity', 'Rookie Award', 'Braylon Lewis'),
    (2024, 'Varsity', 'Rookie Award', 'Declan Loisel'),
    (2023, 'Varsity', 'Rookie Award', 'Jude Dzierwa'),
    (2022, 'Varsity', 'Rookie Award', 'Nick Bowers'),
    (2021, 'Varsity', 'Rookie Award', 'Quinn Wiklendt'),
    (2019, 'Varsity', 'Rookie Award', 'George Jacob'),
    (2018, 'Varsity', 'Rookie Award', 'JD Keller'),
    (2017, 'Varsity', 'Rookie Award', 'Alex Weinberg'),
    (2016, 'Varsity', 'Rookie Award', 'Nathan Aloi'),
    (2015, 'Varsity', 'Rookie Award', 'Ray Huntzinger'),
    (2024, 'Varsity', 'Anchor Award', 'Jude Dzierwa'),
    (2023, 'Varsity', 'Anchor Award', 'Quinn Staten'),
    (2023, 'Varsity', 'Anchor Award', 'Zach Zitkovic'),
    (2022, 'Varsity', 'Anchor Award', 'Quinn Wiklendt'),
    (2021, 'Varsity', 'Anchor Award', 'Will Bohne'),
    (2019, 'Varsity', 'Anchor Award', 'Nick Cope'),
    (2018, 'Varsity', 'Anchor Award', 'Sam Rodgers'),
    (2018, 'Varsity', 'Anchor Award', 'Nathan Aloi'),
    (2017, 'Varsity', 'Anchor Award', 'AJ Urbanski'),
    (2017, 'Varsity', 'Anchor Award', 'Nate Steinmetz'),
    (2016, 'Varsity', 'Anchor Award', 'Jake Newcomer'),
    (2015, 'Varsity', 'Anchor Award', 'Nick Wannamaker'),
    (2025, 'Varsity', 'E&A', 'Ian Moloney'),
    (2024, 'Varsity', 'E&A', 'Ian Moloney'),
    (2023, 'Varsity', 'E&A', 'Cooper Hoyt'),
    (2022, 'Varsity', 'E&A', 'Quinn Staten'),
    (2021, 'Varsity', 'E&A', 'Cooper Hoyt'),
    (2019, 'Varsity', 'E&A', 'Sam Rodgers'),
    (2018, 'Varsity', 'E&A', 'CJ Truedell'),
    (2017, 'Varsity', 'E&A', 'Carson Borkosky'),
    (2016, 'Varsity', 'E&A', 'Dan Martindale'),
    (2015, 'Varsity', 'E&A', 'Jeff Szozda'),
    (2025, 'Varsity', 'Most Improved', 'Xander Lewis'),
    (2024, 'Varsity', 'Most Improved', 'Owen Strayer'),
    (2023, 'Varsity', 'Most Improved', 'Abe Townley'),
    (2022, 'Varsity', 'Most Improved', 'Zach Zitkovic'),
    (2021, 'Varsity', 'Most Improved', 'Dan Lach'),
    (2019, 'Varsity', 'Most Improved', 'Ryan Pierce'),
    (2018, 'Varsity', 'Most Improved', 'Eric Toncre'),
    (2017, 'Varsity', 'Most Improved', 'CJ Trudell'),
    (2016, 'Varsity', 'Most Improved', 'AJ Urbanski'),
    (2015, 'Varsity', 'Most Improved', 'Ryan Rubel'),
    (2025, 'Varsity', 'D MVP', 'Mason Bowers'),
    (2024, 'Varsity', 'D MVP', 'Mason Bowers'),
    (2023, 'Varsity', 'D MVP', 'Cooper Hoyt'),
    (2022, 'Varsity', 'D MVP', 'Tyler Meader'),
    (2022, 'Varsity', 'D MVP', 'Cooper Hoyt'),
    (2021, 'Varsity', 'D MVP', 'Tyler Meader'),
    (2019, 'Varsity', 'D MVP', 'Sam Rodgers'),
    (2018, 'Varsity', 'D MVP', 'Sam Rodgers'),
    (2017, 'Varsity', 'D MVP', 'Sam Rodgers'),
    (2016, 'Varsity', 'D MVP', 'Hayden Wyper'),
    (2015, 'Varsity', 'D MVP', 'Hayden Wyper'),
    (2025, 'Varsity', 'O MVP', 'Drew Duesing'),
    (2024, 'Varsity', 'O MVP', 'Quinn Wiklendt'),
    (2023, 'Varsity', 'O MVP', 'Anthony Brohl'),
    (2023, 'Varsity', 'O MVP', 'Quinn Staten'),
    (2022, 'Varsity', 'O MVP', 'Will Bohne'),
    (2022, 'Varsity', 'O MVP', 'Quinn Wiklendt'),
    (2021, 'Varsity', 'O MVP', 'Andrew Miller'),
    (2019, 'Varsity', 'O MVP', 'Nathan Aloi'),
    (2019, 'Varsity', 'O MVP', 'Chandler Bankey'),
    (2018, 'Varsity', 'O MVP', 'Nathan Aloi'),
    (2018, 'Varsity', 'O MVP', 'Chandler Bankey'),
    (2017, 'Varsity', 'O MVP', 'Nathan Aloi'),
    (2016, 'Varsity', 'O MVP', 'Bennett Miller'),
    (2015, 'Varsity', 'O MVP', 'Bennett Miller'),
    (2025, 'JV Gold', 'Most Improved', 'Cooper Winters'),
    (2024, 'JV Gold', 'Most Improved', 'Austin Burns'),
    (2023, 'JV Gold', 'Most Improved', 'Ricco Martin'),
    (2022, 'JV Gold', 'Most Improved', 'Noah Lee'),
    (2021, 'JV Gold', 'Most Improved', 'Anthony Brohl'),
    (2019, 'JV Gold', 'Most Improved', 'Gage Knapp'),
    (2018, 'JV Gold', 'Most Improved', 'Nathan Kyllo'),
    (2017, 'JV Gold', 'Most Improved', 'Ryan Pierce'),
    (2016, 'JV Gold', 'Most Improved', 'Sam Rodgers'),
    (2015, 'JV Gold', 'Most Improved', 'Cameron Hinojosa'),
    (2025, 'JV Gold', 'E&A', 'Liam Moloney'),
    (2024, 'JV Gold', 'E&A', 'Gavin Jones'),
    (2023, 'JV Gold', 'E&A', 'Ian Moloney'),
    (2022, 'JV Gold', 'E&A', 'Liam Mack'),
    (2021, 'JV Gold', 'E&A', 'Mitchell Stansley'),
    (2021, 'JV Gold', 'E&A', 'Vincent Kendrioski'),
    (2019, 'JV Gold', 'E&A', 'Jackson Taylor'),
    (2018, 'JV Gold', 'E&A', 'Jeffrey Denker'),
    (2018, 'JV Gold', 'E&A', 'Matthew Pfeifer'),
    (2017, 'JV Gold', 'E&A', 'Parker Wilson'),
    (2016, 'JV Gold', 'E&A', 'Ethan Miller'),
    (2015, 'JV Gold', 'E&A', 'Dan Martindale'),
    (2025, 'JV Gold', 'D MVP', 'Liam Urban'),
    (2024, 'JV Gold', 'D MVP', 'Beau Seelenbinder'),
    (2023, 'JV Gold', 'D MVP', 'Nick Ruggiero'),
    (2022, 'JV Gold', 'D MVP', 'Mason Bowers'),
    (2021, 'JV Gold', 'D MVP', 'Ian Horner'),
    (2019, 'JV Gold', 'D MVP', 'Colton Bollenbacher'),
    (2018, 'JV Gold', 'D MVP', 'Austen Perkins'),
    (2017, 'JV Gold', 'D MVP', 'Blaze Whitton'),
    (2016, 'JV Gold', 'D MVP', 'Nathan Steinmetz'),
    (2015, 'JV Gold', 'D MVP', 'Caleb Sutphin'),
    (2025, 'JV Gold', 'O MVP', 'Paxton Lewis'),
    (2024, 'JV Gold', 'O MVP', 'Jameson Moloney'),
    (2023, 'JV Gold', 'O MVP', 'Owen Strayer'),
    (2022, 'JV Gold', 'O MVP', 'Jude Dzierwa'),
    (2021, 'JV Gold', 'O MVP', 'Nate Miller'),
    (2019, 'JV Gold', 'O MVP', 'Nathan Kyllo'),
    (2018, 'JV Gold', 'O MVP', 'Andrew Miller'),
    (2017, 'JV Gold', 'O MVP', 'Gareth Francis'),
    (2016, 'JV Gold', 'O MVP', 'Nick Cope'),
    (2015, 'JV Gold', 'O MVP', 'Blake Spencer'),
    (2025, 'JV Blue', 'E&A', 'Alex Traxler'),
    (2018, 'JV Blue', 'E&A', 'Cole Kovacs'),
    (2016, 'JV Blue', 'E&A', 'Colgan Karcher'),
    (2015, 'JV Blue', 'E&A', 'Zach Richards'),
    (2025, 'JV Blue', 'D MVP', 'Joe Ruggiero'),
    (2018, 'JV Blue', 'D MVP', 'Jackson Taylor'),
    (2015, 'JV Blue', 'D MVP', 'Nathan Steinmetz'),
    (2025, 'JV Blue', 'O MVP', 'Connor Honisko'),
    (2018, 'JV Blue', 'O MVP', 'Isaac Edwards'),
    (2016, 'JV Blue', 'O MVP', 'Alex Weinberg'),
    (2015, 'JV Blue', 'O MVP', 'Evan Elliott')
)
INSERT INTO team_awards (team_id, season_year, team_level, award_category, player_id, player_name)
SELECT t.id, ta.season_year, ta.team_level, ta.award_category, pl.id, ta.player_name
FROM teams t
CROSS JOIN team_awards_raw ta
LEFT JOIN LATERAL (
  SELECT p2.id
  FROM players p2
  WHERE p2.team_id = t.id
    AND lower(p2.first_name || ' ' || p2.last_name) = lower(ta.player_name)
  ORDER BY (p2.graduation_year = ta.season_year) DESC NULLS LAST, p2.id
  LIMIT 1
) pl ON true
WHERE t.slug = 'sjj';

-- ============================================================
-- External Honors
-- ============================================================
WITH season_honors_raw(season_year, grad_year, position, honor_source, honor_label, player_name) AS (
  VALUES
    (2026, 2027, 'M', 'OHSLCA - Region', '1st Team All-Region', 'Caleb DeLong'),
    (2026, 2027, 'M', 'OHSLCA - State', '3rd Team All State', 'Caleb DeLong'),
    (2025, 2026, 'M', 'OHSLCA - Region', '1st Team All-Region', 'Owen Strayer'),
    (2025, 2026, 'M', 'OHSLCA - State', '2nd Team All State', 'Owen Strayer'),
    (2026, 2026, 'D', 'OHSLCA - Region', '1st Team All-Region', 'Xander Lewis'),
    (2026, 2026, 'D', 'OHSLCA - State', '3rd Team All State', 'Xander Lewis'),
    (2025, 2025, 'A', 'OHSLCA - Region', '1st Team All-Region', 'Alexander Speer'),
    (2025, 2025, 'A', 'OHSLCA - State', '3rd Team All State', 'Alexander Speer'),
    (2026, 2027, 'D', 'OHSLCA - Region', '2nd Team All-Region', 'Jake Pieron'),
    (2025, 2025, 'D', 'OHSLCA - Region', '1st Team All-Region', 'Mason Bowers'),
    (2025, 2025, 'D', 'OHSLCA - State', '2nd Team All State', 'Mason Bowers'),
    (2026, 2026, 'LSM', 'OHSLCA - Region', '2nd Team All-Region', 'Jed Dzierwa'),
    (2025, 2025, 'A', 'OHSLCA - Region', '2nd Team All-Region', 'Drew Duesing'),
    (2026, 2026, 'FOGO', 'OHSLCA - Region', '2nd Team All-Region', 'Tyler Zetocha'),
    (2025, 2026, 'LSM', 'OHSLCA - Region', '2nd Team All-Region', 'Jed Dzierwa'),
    (2026, 2028, 'SSDM', 'OHSLCA - Region', 'HM All-Region', 'Jacob Judson'),
    (2025, 2026, 'DM', 'OHSLCA - Region', '2nd Team All-Region', 'Ian Moloney'),
    (2026, 2026, 'M', 'OHSLCA - Region', 'HM All-Region', 'Owen Strayer'),
    (2025, 2025, 'G', 'OHSLCA - Region', '2nd Team All-Region', 'Braylon Lewis'),
    (2025, 2025, 'A', 'OHSLCA - Region', 'HM All-Region', 'Cam Weinberg'),
    (2025, 2025, 'M', 'OHSLCA - Region', 'HM All-Region', 'Jameson Moloney'),
    (2026, 2027, 'M', 'League (CHSL)', 'CHSL - All Catholic', 'Caleb DeLong'),
    (2025, 2025, 'A', 'League (CHSL)', 'CHSL - All Catholic', 'Alexander Speer'),
    (2026, 2026, 'D', 'League (CHSL)', 'CHSL - All Catholic', 'Xander Lewis'),
    (2025, 2025, 'A', 'League (CHSL)', 'CHSL - All Catholic', 'Drew Duesing'),
    (2025, 2025, 'D', 'League (CHSL)', 'CHSL - All Catholic', 'Mason Bowers'),
    (2026, 2026, 'M', 'League (CHSL)', 'CHSL - All League', 'Owen Strayer'),
    (2025, 2026, 'M', 'League (CHSL)', 'CHSL - All League', 'Owen Strayer'),
    (2026, 2027, 'D', 'League (CHSL)', 'CHSL - All League', 'Jake Pieron'),
    (2025, 2025, 'D', 'League (CHSL)', 'CHSL - All League', 'Kyler Ayers'),
    (2025, 2025, 'G', 'League (CHSL)', 'CHSL - All League', 'Braylon Lewis'),
    (2026, 2026, 'A', 'League (CHSL)', 'CHSL - All Academic', 'Ian Moloney'),
    (2025, 2026, 'M', 'League (CHSL)', 'CHSL - All Academic', 'Ian Moloney'),
    (2024, 2024, 'A', 'OHSLCA - Region', '1st Team All-Region', 'Quinn Wiklendt'),
    (2024, 2024, 'A', 'OHSLCA - State', '3rd Team All State', 'Quinn Wiklendt'),
    (2023, 2023, 'LSM', 'OHSLCA - Region', '1st Team All-Region', 'Tyler Meader'),
    (2023, 2023, 'LSM', 'OHSLCA - State', '2nd Team All State', 'Tyler Meader'),
    (2024, 2024, 'DM', 'OHSLCA - Region', '1st Team All-Region', 'Jude Dzierwa'),
    (2024, 2024, 'DM', 'OHSLCA - State', '3rd Team All State', 'Jude Dzierwa'),
    (2023, 2023, 'Midfield', 'OHSLCA - Region', '1st Team All-Region', 'Will Bohne'),
    (2023, 2023, 'Midfield', 'OHSLCA - State', '3rd Team All State', 'Will Bohne'),
    (2024, 2024, 'FOGO', 'OHSLCA - Region', '2nd Team All-Region', 'Owen Winkler'),
    (2023, 2023, 'Defense', 'OHSLCA - Region', '1st Team All-Region', 'Cooper Hoyt'),
    (2023, 2023, 'Defense', 'OHSLCA - State', '3rd Team All State', 'Cooper Hoyt'),
    (2024, 2025, 'D', 'OHSLCA - Region', 'HM All-Region', 'Mason Bowers'),
    (2023, 2024, 'Attack', 'OHSLCA - Region', '2nd Team All-Region', 'Quinn Wiklendt'),
    (2024, 2025, 'A', 'OHSLCA - Region', 'HM All-Region', 'Alexander Speer'),
    (2023, 2023, 'Defense', 'OHSLCA - Region', '2nd Team All-Region', 'Abe Townley'),
    (2024, 2024, 'A', 'League (CHSL)', 'CHSL - All Catholic', 'Quinn Wiklendt'),
    (2023, 2023, 'D-Mid', 'OHSLCA - Region', '2nd Team All-Region', 'Andrew Heban'),
    (2024, 2025, 'A', 'League (CHSL)', 'CHSL - All Catholic', 'Drew Duesing'),
    (2023, 2023, 'Midfield', 'OHSLCA - Region', 'HM All-Region', 'Quinn Staten'),
    (2024, 2025, 'A', 'League (CHSL)', 'CHSL - All League', 'Alexander Speer'),
    (2023, 2024, 'Goalie', 'OHSLCA - Region', 'HM All-Region', 'Ian Horner'),
    (2024, 2024, 'LSM', 'League (CHSL)', 'CHSL - All League', 'Gage Buck'),
    (2024, 2024, 'D', 'League (CHSL)', 'CHSL - All Academic', 'Andrew Balcerzak'),
    (2022, 2024, 'Attack', 'OHSLCA - Region', '1st Team All-Region', 'Quinn Wiklendt'),
    (2022, 2024, 'Attack', 'OHSLCA - State', '1st Team All State', 'Quinn Wiklendt'),
    (2021, 2021, 'Attack', 'OHSLCA - Region', '1st Team All-Region', 'Andrew Miller'),
    (2021, 2021, 'Attack', 'OHSLCA - State', '2nd Team All State', 'Andrew Miller'),
    (2022, 2023, 'LSM', 'OHSLCA - Region', '1st Team All-Region', 'Tyler Meader'),
    (2022, 2023, 'LSM', 'OHSLCA - State', '2nd Team All State', 'Tyler Meader'),
    (2021, 2023, 'LSM', 'OHSLCA - Region', '1st Team All-Region', 'Tyler Meader'),
    (2021, 2023, 'LSM', 'OHSLCA - State', 'HM All State', 'Tyler Meader'),
    (2022, 2023, 'Midfield', 'OHSLCA - Region', '1st Team All-Region', 'Will Bohne'),
    (2022, 2023, 'Midfield', 'OHSLCA - State', '1st Team All State', 'Will Bohne'),
    (2021, 2023, 'Midfield', 'OHSLCA - Region', '2nd Team All-Region', 'Will Bohne'),
    (2022, 2023, 'Midfield', 'OHSLCA - Region', '1st Team All-Region', 'Zach Zitkovic'),
    (2022, 2023, 'Midfield', 'OHSLCA - State', 'HM All State', 'Zach Zitkovic'),
    (2021, 2021, 'Midfield', 'OHSLCA - Region', '2nd Team All-Region', 'Joshua Kraus'),
    (2022, 2022, 'SSD', 'OHSLCA - Region', '1st Team All-Region', 'Charlie Anderson'),
    (2022, 2022, 'SSD', 'OHSLCA - State', 'HM All State', 'Charlie Anderson'),
    (2021, 2021, 'Defense', 'OHSLCA - Region', '2nd Team All-Region', 'Colton Bollenbacher'),
    (2022, 2023, 'Defense', 'OHSLCA - Region', '1st Team All-Region', 'Cooper Hoyt'),
    (2022, 2023, 'Defense', 'OHSLCA - State', 'HM All State', 'Cooper Hoyt'),
    (2021, 2021, 'FOGO', 'OHSLCA - Region', '2nd Team All-Region', 'Cole Kovacs'),
    (2022, 2023, 'FOGO', 'OHSLCA - Region', '2nd Team All-Region', 'Nate Miller'),
    (2021, 2024, 'Attack', 'OHSLCA - Region', 'Honorable Mention All-Region', 'Quinn Wiklendt'),
    (2022, 2023, 'Defense', 'OHSLCA - Region', '2nd Team All-Region', 'Kaden King'),
    (2021, 2021, 'Attack', 'OHSLCA - Region', 'Honorable Mention All-Region', 'George Jacob'),
    (2022, 2023, 'Midfield', 'OHSLCA - Region', 'HM All-Region', 'Quinn Staten'),
    (2022, 2023, 'Defense', 'OHSLCA - Region', 'HM All-Region', 'Abe Townley'),
    (2019, 2019, 'M', 'OHSLCA - Region', '1st Team All-Region', 'Nathan Aloi'),
    (2019, 2019, 'A', 'OHSLCA - Region', '1st Team All-Region', 'Chandler Bankey'),
    (2019, 2019, 'D', 'OHSLCA - Region', '2nd Team All-Region', 'Sam Rodgers'),
    (2019, 2019, 'M', 'OHSLCA - Region', '2nd Team All-Region', 'Nick Cope'),
    (2019, 2019, 'A', 'OHSLCA - Region', 'HM All-Region', 'Alex Weinberg'),
    (2019, 2020, 'LSM', 'OHSLCA - Region', 'HM All-Region', 'Blaze Whitton'),
    (2018, 2019, 'M', 'OHSLCA - Region', '1st Team All-Region', 'Nathan Aloi'),
    (2017, 2019, 'A', 'OHSLCA - Region', 'HM All-Region', 'Nathan Aloi'),
    (2018, 2019, 'A', 'OHSLCA - Region', '1st Team All-Region', 'Chandler Bankey'),
    (2017, 2019, 'A', 'OHSLCA - Region', 'HM All-Region', 'Chandler Bankey'),
    (2018, 2019, 'D', 'OHSLCA - Region', '2nd Team All-Region', 'Sam Rodgers'),
    (2018, 2019, 'M', 'OHSLCA - Region', 'HM All-Region', 'Nick Cope'),
    (2018, 2019, 'A', 'OHSLCA - Region', 'HM All-Region', 'Alex Weinberg'),
    (2016, 2016, 'A', 'OHSLCA - Region', '1st Team All-Region', 'Bennett Miller'),
    (2016, 2016, 'D', 'OHSLCA - Region', '1st Team All-Region', 'Hayden Wyper'),
    (2016, 2017, 'FOGO', 'OHSLCA - Region', '1st Team All-Region', 'Jeff Szozda'),
    (2016, 2016, 'M', 'OHSLCA - Region', '2nd Team All-Region', 'Jake Newcomer'),
    (2016, 2016, 'A', 'OHSLCA - Region', 'HM All-Region', 'Zach Wester'),
    (2016, 2016, 'G', 'OHSLCA - Region', 'HM All-Region', 'Noah Houpt')
)
INSERT INTO season_honors (team_id, player_id, player_name, position, honor_source, honor_label, season_year, grad_year)
SELECT t.id, pl.id, sh.player_name, sh.position, sh.honor_source, sh.honor_label, sh.season_year, sh.grad_year
FROM teams t
CROSS JOIN season_honors_raw sh
LEFT JOIN LATERAL (
  -- Match on grad_year (the player's own class), NOT season_year -- a
  -- player can earn a season honor in a year that doesn't match their
  -- eventual graduation year exactly as recorded elsewhere, so this
  -- mirrors the same disambiguation approach as team_awards/player_honors
  -- but keyed to the field that actually identifies the person.
  SELECT p2.id
  FROM players p2
  WHERE p2.team_id = t.id
    AND lower(p2.first_name || ' ' || p2.last_name) = lower(sh.player_name)
  ORDER BY (p2.graduation_year = sh.grad_year) DESC NULLS LAST, p2.id
  LIMIT 1
) pl ON true
WHERE t.slug = 'sjj';
