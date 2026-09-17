-- Season-by-season program history: one row per year. Coaching Stats
-- (most wins, win%, etc.) is computed by aggregating this table by
-- head_coach — not stored separately — the same pattern used for player
-- leaderboards computed from season_totals.
CREATE TABLE program_seasons (
    id               BIGSERIAL PRIMARY KEY,
    team_id          BIGINT NOT NULL REFERENCES teams(id),
    season_year      INT NOT NULL,
    head_coach       TEXT,           -- null for a not-yet-played future season
    division         INT,            -- null for pre-2002 (not tracked that far back)
    regular_wins     INT NOT NULL DEFAULT 0,
    regular_losses   INT NOT NULL DEFAULT 0,
    league_wins      INT,            -- only populated 2024+ (CHSL play)
    league_losses    INT,
    league_name      TEXT,           -- e.g. 'CHSL'
    league_finish    TEXT,           -- e.g. '5th', '3rd'
    playoff_wins     INT NOT NULL DEFAULT 0,
    playoff_losses   INT NOT NULL DEFAULT 0,
    total_wins       INT NOT NULL DEFAULT 0,
    total_losses     INT NOT NULL DEFAULT 0,
    brothers_cup     TEXT,           -- e.g. '10-7', '6-7 OT' — only 2022+
    playoff_result   TEXT,           -- furthest round reached, e.g. 'Sweet 16', 'State Finals'
    special_note     TEXT,           -- e.g. 'Season cancelled due to COVID', 'Joined CHSL'
    UNIQUE (team_id, season_year)
);
