-- Full canonical opponent list + aliases, combining Hudl-CSV-discovered
-- names and LaxPower-historical-discovered names. Supersedes the earlier,
-- Hudl-only version of this file (nothing has been run against production
-- yet, so this replaces it rather than migrating on top of it).
--
-- One open item: 'Olentangy HS'/'Liberty-Olentangy' entries (2003-2013) are
-- defaulted to plain 'Olentangy' pending Andy confirming, game by game,
-- whether some were actually 'Liberty Olentangy'. Cheap to fix later via a
-- targeted UPDATE once confirmed -- not blocking this import.

CREATE TABLE opponents (
    id          BIGSERIAL PRIMARY KEY,
    team_id     BIGINT NOT NULL REFERENCES teams(id),
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (team_id, name)
);

CREATE TABLE opponent_aliases (
    id             BIGSERIAL PRIMARY KEY,
    opponent_id    BIGINT NOT NULL REFERENCES opponents(id) ON DELETE CASCADE,
    alias_name     TEXT NOT NULL,
    source         TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_opponent_aliases_name ON opponent_aliases (alias_name);

-- Seed the canonical list (assumes team_id = 1)
INSERT INTO opponents (team_id, name) VALUES (1, 'Wellington School');
INSERT INTO opponents (team_id, name) VALUES (1, 'Ann Arbor Pioneer');
INSERT INTO opponents (team_id, name) VALUES (1, 'Ann Arbor Skyline');
INSERT INTO opponents (team_id, name) VALUES (1, 'Anthony Wayne');
INSERT INTO opponents (team_id, name) VALUES (1, 'Archbishop Hoban');
INSERT INTO opponents (team_id, name) VALUES (1, 'Avon');
INSERT INTO opponents (team_id, name) VALUES (1, 'Avon Lake');
INSERT INTO opponents (team_id, name) VALUES (1, 'Bay');
INSERT INTO opponents (team_id, name) VALUES (1, 'Bedford');
INSERT INTO opponents (team_id, name) VALUES (1, 'Benedictine');
INSERT INTO opponents (team_id, name) VALUES (1, 'Bishop Watterson');
INSERT INTO opponents (team_id, name) VALUES (1, 'Bowling Green');
INSERT INTO opponents (team_id, name) VALUES (1, 'Brebeuf Jesuit');
INSERT INTO opponents (team_id, name) VALUES (1, 'Brecksville Broadview');
INSERT INTO opponents (team_id, name) VALUES (1, 'Brother Rice');
INSERT INTO opponents (team_id, name) VALUES (1, 'Brother Rice (Orange)');
INSERT INTO opponents (team_id, name) VALUES (1, 'Brunswick');
INSERT INTO opponents (team_id, name) VALUES (1, 'CVCA');
INSERT INTO opponents (team_id, name) VALUES (1, 'Cathedral Prep');
INSERT INTO opponents (team_id, name) VALUES (1, 'Chagrin Falls');
INSERT INTO opponents (team_id, name) VALUES (1, 'Chaminade Julienne');
INSERT INTO opponents (team_id, name) VALUES (1, 'Cincinnati St. Xavier');
INSERT INTO opponents (team_id, name) VALUES (1, 'Cincinnati Sycamore');
INSERT INTO opponents (team_id, name) VALUES (1, 'Clarkston');
INSERT INTO opponents (team_id, name) VALUES (1, 'Cleveland Heights');
INSERT INTO opponents (team_id, name) VALUES (1, 'Columbus Academy');
INSERT INTO opponents (team_id, name) VALUES (1, 'Copley');
INSERT INTO opponents (team_id, name) VALUES (1, 'Cranbrook');
INSERT INTO opponents (team_id, name) VALUES (1, 'Culver Military Academy');
INSERT INTO opponents (team_id, name) VALUES (1, 'De La Salle');
INSERT INTO opponents (team_id, name) VALUES (1, 'DeSmet Jesuit');
INSERT INTO opponents (team_id, name) VALUES (1, 'Delaware Hayes');
INSERT INTO opponents (team_id, name) VALUES (1, 'Detroit Catholic Central');
INSERT INTO opponents (team_id, name) VALUES (1, 'Detroit Country Day');
INSERT INTO opponents (team_id, name) VALUES (1, 'Dublin Coffman');
INSERT INTO opponents (team_id, name) VALUES (1, 'Dublin Jerome');
INSERT INTO opponents (team_id, name) VALUES (1, 'Erie McDowell');
INSERT INTO opponents (team_id, name) VALUES (1, 'Eugene Ashley (NC)');
INSERT INTO opponents (team_id, name) VALUES (1, 'Findlay');
INSERT INTO opponents (team_id, name) VALUES (1, 'Fishers');
INSERT INTO opponents (team_id, name) VALUES (1, 'Gahanna Lincoln');
INSERT INTO opponents (team_id, name) VALUES (1, 'Gilmour Academy');
INSERT INTO opponents (team_id, name) VALUES (1, 'Hawken School');
INSERT INTO opponents (team_id, name) VALUES (1, 'Hilliard Darby');
INSERT INTO opponents (team_id, name) VALUES (1, 'Hilliard Davidson');
INSERT INTO opponents (team_id, name) VALUES (1, 'Holy Name');
INSERT INTO opponents (team_id, name) VALUES (1, 'Hoover');
INSERT INTO opponents (team_id, name) VALUES (1, 'Hudson');
INSERT INTO opponents (team_id, name) VALUES (1, 'Indian Hill');
INSERT INTO opponents (team_id, name) VALUES (1, 'Kenston');
INSERT INTO opponents (team_id, name) VALUES (1, 'Kent Roosevelt');
INSERT INTO opponents (team_id, name) VALUES (1, 'Lakota West');
INSERT INTO opponents (team_id, name) VALUES (1, 'Lexington Catholic');
INSERT INTO opponents (team_id, name) VALUES (1, 'Lexington Dunbar');
INSERT INTO opponents (team_id, name) VALUES (1, 'Lexington Tates Creek');
INSERT INTO opponents (team_id, name) VALUES (1, 'Liberty Olentangy');
INSERT INTO opponents (team_id, name) VALUES (1, 'Marquette');
INSERT INTO opponents (team_id, name) VALUES (1, 'Massilon Jackson');
INSERT INTO opponents (team_id, name) VALUES (1, 'Medina');
INSERT INTO opponents (team_id, name) VALUES (1, 'Mentor');
INSERT INTO opponents (team_id, name) VALUES (1, 'Northview');
INSERT INTO opponents (team_id, name) VALUES (1, 'Notre Dame Prep');
INSERT INTO opponents (team_id, name) VALUES (1, 'Oakwood');
INSERT INTO opponents (team_id, name) VALUES (1, 'Olentangy');
INSERT INTO opponents (team_id, name) VALUES (1, 'Olmsted Falls');
INSERT INTO opponents (team_id, name) VALUES (1, 'Orchard Lake St. Mary''s');
INSERT INTO opponents (team_id, name) VALUES (1, 'Ottawa Hills');
INSERT INTO opponents (team_id, name) VALUES (1, 'Padua Franciscan');
INSERT INTO opponents (team_id, name) VALUES (1, 'Perrysburg');
INSERT INTO opponents (team_id, name) VALUES (1, 'Revere');
INSERT INTO opponents (team_id, name) VALUES (1, 'Rocky River');
INSERT INTO opponents (team_id, name) VALUES (1, 'Saline');
INSERT INTO opponents (team_id, name) VALUES (1, 'Seneca Valley');
INSERT INTO opponents (team_id, name) VALUES (1, 'Shaker Heights');
INSERT INTO opponents (team_id, name) VALUES (1, 'Solon');
INSERT INTO opponents (team_id, name) VALUES (1, 'Southview');
INSERT INTO opponents (team_id, name) VALUES (1, 'St. Charles');
INSERT INTO opponents (team_id, name) VALUES (1, 'St. Edward');
INSERT INTO opponents (team_id, name) VALUES (1, 'St. Francis Columbus');
INSERT INTO opponents (team_id, name) VALUES (1, 'St. Francis Toledo');
INSERT INTO opponents (team_id, name) VALUES (1, 'St. Ignatius (Prep)');
INSERT INTO opponents (team_id, name) VALUES (1, 'St. Ignatius Blue');
INSERT INTO opponents (team_id, name) VALUES (1, 'St. Joe''s Indiana');
INSERT INTO opponents (team_id, name) VALUES (1, 'St. Joseph''s');
INSERT INTO opponents (team_id, name) VALUES (1, 'Stow Monroe Falls');
INSERT INTO opponents (team_id, name) VALUES (1, 'Strongsville');
INSERT INTO opponents (team_id, name) VALUES (1, 'Summit Country Day');
INSERT INTO opponents (team_id, name) VALUES (1, 'Sylvania');
INSERT INTO opponents (team_id, name) VALUES (1, 'Sylvania Maple Leafs');
INSERT INTO opponents (team_id, name) VALUES (1, 'Sylvania Northview');
INSERT INTO opponents (team_id, name) VALUES (1, 'Sylvania Southview');
INSERT INTO opponents (team_id, name) VALUES (1, 'Thomas Worthington');
INSERT INTO opponents (team_id, name) VALUES (1, 'Toledo Central Catholic');
INSERT INTO opponents (team_id, name) VALUES (1, 'Toledo Wolfpack');
INSERT INTO opponents (team_id, name) VALUES (1, 'Topsail (NC)');
INSERT INTO opponents (team_id, name) VALUES (1, 'Troy Athens');
INSERT INTO opponents (team_id, name) VALUES (1, 'University School');
INSERT INTO opponents (team_id, name) VALUES (1, 'University of Detroit Jesuit');
INSERT INTO opponents (team_id, name) VALUES (1, 'Upper Arlington');
INSERT INTO opponents (team_id, name) VALUES (1, 'Wadsworth');
INSERT INTO opponents (team_id, name) VALUES (1, 'Walsh Jesuit');
INSERT INTO opponents (team_id, name) VALUES (1, 'Western Reserve Academy');
INSERT INTO opponents (team_id, name) VALUES (1, 'Westerville North');
INSERT INTO opponents (team_id, name) VALUES (1, 'Westerville South');
INSERT INTO opponents (team_id, name) VALUES (1, 'Westlake');
INSERT INTO opponents (team_id, name) VALUES (1, 'Wheeling Cent Cath');
INSERT INTO opponents (team_id, name) VALUES (1, 'Wooster');

-- Seed known Hudl-name aliases (2021-2026 team-totals backfill)
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Ashley', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'Eugene Ashley (NC)';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'BJPHS', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'Brebeuf Jesuit';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'CKHS', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'Cranbrook';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'CVCAH', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'CVCA';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Chaminade-Julienne', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'Chaminade Julienne';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'DCC', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'Detroit Catholic Central';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'DCDHS', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'Detroit Country Day';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'DCDS', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'Detroit Country Day';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'DLS', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'De La Salle';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'De La Salle Collegiate', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'De La Salle';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'OLSM', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'Orchard Lake St. Mary''s';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'SFD', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'St. Francis Columbus';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'SFS', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'St. Francis Toledo';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'SFdSH', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'St. Francis Toledo';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'SJHS', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'St. Joe''s Indiana';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'St. Ignatius', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'St. Ignatius (Prep)';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'St. Mary''s Prep', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'Orchard Lake St. Mary''s';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Topsail', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'Topsail (NC)';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'UDJHS', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'University of Detroit Jesuit';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'UOD', 'Hudl team-totals backfill 2021-2026' FROM opponents WHERE team_id = 1 AND name = 'University of Detroit Jesuit';

-- Seed known LaxPower-name aliases (2002-2019 historical backfill)
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'ANN ARBOR PIONEER', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Ann Arbor Pioneer';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'ANN ARBOR SKYLINE', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Ann Arbor Skyline';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'ANTHONY WAYNE', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Anthony Wayne';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Avon OH', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Avon';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'BEDFORD', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Bedford';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'BRUNSWICK', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Brunswick';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Bay OH', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Bay';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Bowling Green OH', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Bowling Green';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Brecksville-Broadview', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Brecksville Broadview';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Brother Rice Orange', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Brother Rice (Orange)';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Brunswick OH', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Brunswick';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Brunswick, OH', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Brunswick';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'CHAGRIN FALLS', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Chagrin Falls';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'CLARKSTON', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Clarkston';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'CLEVELAND ST IGNATIUS', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'St. Ignatius (Prep)';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'COLUMBUS ST CHARLES', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'St. Charles';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Cinc Indian Hill', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Indian Hill';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Cincinnati St Xavier', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Cincinnati St. Xavier';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Cleveland St Ignatius', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'St. Ignatius (Prep)';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Columbus St Charles', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'St. Charles';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Culver Military Acad', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Culver Military Academy';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'DETROIT CATHOLIC CENT', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Detroit Catholic Central';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'DUBLIN COFFMAN', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Dublin Coffman';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'DUBLIN JEROME', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Dublin Jerome';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Detroit Catholic Cent', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Detroit Catholic Central';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'ERIE-MCDOWELL', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Erie McDowell';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Erie-McDowell', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Erie McDowell';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'HAWKEN SCHOOL', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Hawken School';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'HILLIARD DARBY', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Hilliard Darby';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'HILLIARD DAVIDSON', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Hilliard Davidson';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'HOOVER/NO. CANTON', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Hoover';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'HUDSON', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Hudson';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Hoover/No. Canton', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Hoover';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Jackson, Massillon', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Massilon Jackson';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'KENT ROOSEVELT', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Kent Roosevelt';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'LAKOTA WEST', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Lakota West';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Liberty-Olentangy', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Olentangy';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Lincoln, Gahanna', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Gahanna Lincoln';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'MASSILLON-JACKSON', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Massilon Jackson';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'MEDINA', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Medina';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'MENTOR', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Mentor';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Massillon-Jackson', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Massilon Jackson';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Milwaukee Marquette', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Marquette';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'NOTRE DAME PREP', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Notre Dame Prep';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Olentangy HS', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Olentangy';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'PERRYSBURG', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Perrysburg';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Rocky River OH', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Rocky River';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'SENECA VALLEY', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Seneca Valley';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'SHAKER HEIGHTS', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Shaker Heights';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'ST FRANCIS DE SALES', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'St. Francis Toledo';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'ST FRANCIS DESALES', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'St. Francis Toledo';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'SYLVANIA', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Sylvania';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'SYLVANIA NORTHVIEW', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Sylvania Northview';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'SYLVANIA SOUTHVIEW', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Sylvania Southview';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'St Charles', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'St. Charles';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'St Edward', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'St. Edward';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'St Francis DeSales', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'St. Francis Toledo';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'St Francis DeSales - Toledo', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'St. Francis Toledo';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'St Francis DeSales, Tol', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'St. Francis Toledo';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'St Francis de Sales', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'St. Francis Toledo';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'St Ignatius Prep', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'St. Ignatius (Prep)';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Stow Munroe Falls', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Stow Monroe Falls';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Stow Walsh Jesuit', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Walsh Jesuit';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'THOMAS WORTHINGTON', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Thomas Worthington';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'TOLEDO CENTRAL CATHOLIC', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Toledo Central Catholic';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'TROY ATHENS', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Troy Athens';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Toledo Cath Central', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Toledo Central Catholic';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'UNIVERSITY SCHOOL', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'University School';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'UPPER ARLINGTON', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Upper Arlington';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Univ Detroit Jesuit', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'University of Detroit Jesuit';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'WALSH JESUIT', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Walsh Jesuit';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'WESTERVILLE NORTH', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Westerville North';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'WESTERVILLE SOUTH', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Westerville South';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Watterson', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Bishop Watterson';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Western Reserve Acad', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Western Reserve Academy';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Westlake OH', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Westlake';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Westlake, OH', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Westlake';
INSERT INTO opponent_aliases (opponent_id, alias_name, source) SELECT id, 'Wooster OH', 'LaxPower historical backfill 2002-2019' FROM opponents WHERE team_id = 1 AND name = 'Wooster';