-- Found while cross-referencing IndividualPlayoffs.xlsx for TM-19 seed
-- data: "Columbus DeSales" (Andy's shorthand for St. Francis DeSales
-- High School in Columbus -- a different school from "St. Francis
-- Toledo"/St. Francis DeSales in Toledo, already its own opponent) was
-- never linked to the registered "St. Francis Columbus" opponent (2024
-- State Finals game, 2024-06-08). Purely additive, same as every other
-- alias fix this session.
INSERT INTO opponent_aliases (opponent_id, alias_name, source)
SELECT id, 'Columbus DeSales', 'TM-19 fix 2026-09-21 -- found while seeding IndividualPlayoffs.xlsx data'
FROM opponents WHERE team_id = 1 AND name = 'St. Francis Columbus';
