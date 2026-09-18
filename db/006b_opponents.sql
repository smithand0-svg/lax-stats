-- Canonical opponent list and alias mapping, seeded from Andy's own
-- Coaching Matrix, with corrections confirmed directly with him:
-- 'Gahanna Lincoln' (not 'Lincoln Gahanna'/'Lincoln, Gahanna'), 'St. Edward'
-- (not 'St. Edward's'), 'University of Detroit Jesuit' (not 'UD Jesuit'),
-- and a new distinct entry for "St. Joe's Indiana" (not the same school as
-- the existing 'St. Joseph's').

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
INSERT INTO opponents (team_id, name) VALUES (1, 'Clarkston');
INSERT INTO opponents (team_id, name) VALUES (1, 'Columbus Academy');
INSERT INTO opponents (team_id, name) VALUES (1, 'Copley');
INSERT INTO opponents (team_id, name) VALUES (1, 'Cranbrook');
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
INSERT INTO opponents (team_id, name) VALUES (1, 'Sylvania Maple Leafs');
INSERT INTO opponents (team_id, name) VALUES (1, 'Sylvania Northview');
INSERT INTO opponents (team_id, name) VALUES (1, 'Sylvania Southview');
INSERT INTO opponents (team_id, name) VALUES (1, 'Thomas Worthington');
INSERT INTO opponents (team_id, name) VALUES (1, 'Toledo Central Catholic');
INSERT INTO opponents (team_id, name) VALUES (1, 'Topsail (NC)');
INSERT INTO opponents (team_id, name) VALUES (1, 'Troy Athens');
INSERT INTO opponents (team_id, name) VALUES (1, 'University School');
INSERT INTO opponents (team_id, name) VALUES (1, 'University of Detroit Jesuit');
INSERT INTO opponents (team_id, name) VALUES (1, 'Upper Arlington');
INSERT INTO opponents (team_id, name) VALUES (1, 'Wadsworth');
INSERT INTO opponents (team_id, name) VALUES (1, 'Walsh Jesuit');
INSERT INTO opponents (team_id, name) VALUES (1, 'Westerville North');
INSERT INTO opponents (team_id, name) VALUES (1, 'Westlake');
INSERT INTO opponents (team_id, name) VALUES (1, 'Wheeling Cent Cath');
INSERT INTO opponents (team_id, name) VALUES (1, 'Wooster');

-- Seed known Hudl-name aliases found in the 2021-2026 backfill
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