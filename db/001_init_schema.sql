-- SJJ Lacrosse Stats — Initial Schema
-- Target: PostgreSQL (cPanel-hosted)
-- Run this once against a fresh database to create the MVP schema.

-- ============================================================
-- Core / multi-tenancy
-- ============================================================

CREATE TABLE teams (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Players & identity
-- ============================================================

CREATE TABLE players (
    id               BIGSERIAL PRIMARY KEY,
    team_id          BIGINT NOT NULL REFERENCES teams(id),
    first_name       TEXT NOT NULL,
    last_name        TEXT NOT NULL,
    graduation_year  INT,
    is_legacy        BOOLEAN NOT NULL DEFAULT FALSE,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (team_id, first_name, last_name, graduation_year)
);

CREATE TABLE player_aliases (
    id                BIGSERIAL PRIMARY KEY,
    player_id         BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    alias_first_name  TEXT NOT NULL,
    alias_last_name   TEXT NOT NULL,
    source            TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_player_aliases_name ON player_aliases (alias_first_name, alias_last_name);

-- ============================================================
-- Game-level data (2020+ Hudl, and eventually 2015-2019 backfill)
-- ============================================================

CREATE TABLE games (
    id             BIGSERIAL PRIMARY KEY,
    team_id        BIGINT NOT NULL REFERENCES teams(id),
    opponent       TEXT NOT NULL,
    game_date      DATE,
    season_year    INT NOT NULL,
    game_type      TEXT NOT NULL CHECK (game_type IN ('regular', 'playoff')),
    round          TEXT,                          -- playoff round label, nullable
    import_source  TEXT NOT NULL DEFAULT 'hudl',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE game_stat_lines (
    id               BIGSERIAL PRIMARY KEY,
    game_id          BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id        BIGINT NOT NULL REFERENCES players(id),
    team_id          BIGINT NOT NULL REFERENCES teams(id),

    faceoff_wins     INT NOT NULL DEFAULT 0,
    faceoff_losses   INT NOT NULL DEFAULT 0,
    goals            INT NOT NULL DEFAULT 0,
    assists          INT NOT NULL DEFAULT 0,
    -- Note: no stored "points" column here (goals+assists) — that required
    -- a "generated column" feature only available in Postgres 12+, and this
    -- database is running Postgres 10. Every reporting view computes points
    -- from goals+assists directly instead, so nothing is lost.
    shots            INT NOT NULL DEFAULT 0,
    shots_on_goal    INT NOT NULL DEFAULT 0,
    ground_balls     INT NOT NULL DEFAULT 0,
    turnovers        INT NOT NULL DEFAULT 0,
    caused_turnovers INT NOT NULL DEFAULT 0,
    goals_against    INT NOT NULL DEFAULT 0,
    saves            INT NOT NULL DEFAULT 0,
    personal_fouls   INT NOT NULL DEFAULT 0,
    technical_fouls  INT NOT NULL DEFAULT 0,

    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (game_id, player_id)
);

-- ============================================================
-- Season/career-only data (pre-2020, sparse "Legacy" tier)
-- ============================================================

CREATE TABLE season_stat_summaries (
    id                BIGSERIAL PRIMARY KEY,
    team_id           BIGINT NOT NULL REFERENCES teams(id),
    player_id         BIGINT NOT NULL REFERENCES players(id),
    season_year       INT,                  -- null = career-only entry, no specific year known
    game_type         TEXT NOT NULL DEFAULT 'combined'
                        CHECK (game_type IN ('combined', 'regular', 'playoff')),

    faceoff_wins      INT, faceoff_losses INT,
    goals             INT, assists INT,
    shots             INT, shots_on_goal INT,
    ground_balls      INT, turnovers INT, caused_turnovers INT,
    goals_against     INT, saves INT,
    personal_fouls    INT, technical_fouls INT,

    source_note       TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (team_id, player_id, season_year, game_type)
);

-- ============================================================
-- Gold Balls
-- ============================================================

CREATE TABLE gold_ball_rules (
    id              BIGSERIAL PRIMARY KEY,
    team_id         BIGINT NOT NULL REFERENCES teams(id),
    stat_name       TEXT NOT NULL,
    scope           TEXT NOT NULL CHECK (scope IN ('career', 'season', 'game')),
    rule_type       TEXT NOT NULL CHECK (rule_type IN ('first_stat', 'multiple_of', 'top_10', 'number_one')),
    threshold_value INT,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gold_ball_awards (
    id               BIGSERIAL PRIMARY KEY,
    team_id          BIGINT NOT NULL REFERENCES teams(id),
    player_id        BIGINT NOT NULL REFERENCES players(id),
    rule_id          BIGINT REFERENCES gold_ball_rules(id),
    stat_name        TEXT NOT NULL,
    scope            TEXT NOT NULL,
    value_at_award   INT,
    season_year      INT,
    awarded_date     DATE,
    is_retroactive   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Import auditing
-- ============================================================

CREATE TABLE import_batches (
    id           BIGSERIAL PRIMARY KEY,
    team_id      BIGINT NOT NULL REFERENCES teams(id),
    game_id      BIGINT REFERENCES games(id),
    file_name    TEXT,
    row_count    INT,
    status       TEXT NOT NULL DEFAULT 'success',
    imported_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Reporting views: unions game-level and season-only tiers
--
-- IMPORTANT: a legacy 'combined' row already INCLUDES that year's
-- playoff stats (it came from CareerStats.xlsx, which is all-inclusive).
-- So we cannot just relabel 'combined' as 'regular' — that would
-- double-count playoff stats for any year that also has a 'playoff'
-- row. Instead we derive regular = combined - playoff per player/year
-- BEFORE aggregating anything.
-- ============================================================

CREATE VIEW season_totals AS
WITH legacy_playoff AS (
    SELECT team_id, player_id, season_year,
           goals, assists, shots, shots_on_goal, ground_balls, turnovers,
           caused_turnovers, faceoff_wins, faceoff_losses, saves, goals_against,
           personal_fouls, technical_fouls
    FROM season_stat_summaries
    WHERE game_type = 'playoff'
),
legacy_combined AS (
    SELECT team_id, player_id, season_year,
           goals, assists, shots, shots_on_goal, ground_balls, turnovers,
           caused_turnovers, faceoff_wins, faceoff_losses, saves, goals_against,
           personal_fouls, technical_fouls
    FROM season_stat_summaries
    WHERE game_type = 'combined'
),
legacy_regular AS (
    -- combined minus playoff, per player/year. Nulls treated as 0 for the
    -- subtraction (a legacy record with an unknown stat is assumed 0 for
    -- that stat rather than propagating NULL through every downstream sum).
    SELECT
        c.team_id, c.player_id, c.season_year, 'regular'::TEXT AS game_type,
        COALESCE(c.goals, 0) - COALESCE(p.goals, 0) AS goals,
        COALESCE(c.assists, 0) - COALESCE(p.assists, 0) AS assists,
        COALESCE(c.shots, 0) - COALESCE(p.shots, 0) AS shots,
        COALESCE(c.shots_on_goal, 0) - COALESCE(p.shots_on_goal, 0) AS shots_on_goal,
        COALESCE(c.ground_balls, 0) - COALESCE(p.ground_balls, 0) AS ground_balls,
        COALESCE(c.turnovers, 0) - COALESCE(p.turnovers, 0) AS turnovers,
        COALESCE(c.caused_turnovers, 0) - COALESCE(p.caused_turnovers, 0) AS caused_turnovers,
        COALESCE(c.faceoff_wins, 0) - COALESCE(p.faceoff_wins, 0) AS faceoff_wins,
        COALESCE(c.faceoff_losses, 0) - COALESCE(p.faceoff_losses, 0) AS faceoff_losses,
        COALESCE(c.saves, 0) - COALESCE(p.saves, 0) AS saves,
        COALESCE(c.goals_against, 0) - COALESCE(p.goals_against, 0) AS goals_against,
        COALESCE(c.personal_fouls, 0) - COALESCE(p.personal_fouls, 0) AS personal_fouls,
        COALESCE(c.technical_fouls, 0) - COALESCE(p.technical_fouls, 0) AS technical_fouls
    FROM legacy_combined c
    LEFT JOIN legacy_playoff p
        ON p.team_id = c.team_id AND p.player_id = c.player_id AND p.season_year = c.season_year
),
legacy_playoff_labeled AS (
    SELECT team_id, player_id, season_year, 'playoff'::TEXT AS game_type,
           goals, assists, shots, shots_on_goal, ground_balls, turnovers,
           caused_turnovers, faceoff_wins, faceoff_losses, saves, goals_against,
           personal_fouls, technical_fouls
    FROM legacy_playoff
),
game_level AS (
    SELECT gsl.player_id, gsl.team_id, g.season_year, g.game_type,
           gsl.goals, gsl.assists, gsl.shots, gsl.shots_on_goal, gsl.ground_balls,
           gsl.turnovers, gsl.caused_turnovers, gsl.faceoff_wins, gsl.faceoff_losses,
           gsl.saves, gsl.goals_against, gsl.personal_fouls, gsl.technical_fouls
    FROM game_stat_lines gsl
    JOIN games g ON g.id = gsl.game_id
),
unioned AS (
    SELECT player_id, team_id, season_year, game_type, goals, assists, shots,
           shots_on_goal, ground_balls, turnovers, caused_turnovers, faceoff_wins,
           faceoff_losses, saves, goals_against, personal_fouls, technical_fouls
    FROM legacy_regular
    UNION ALL
    SELECT player_id, team_id, season_year, game_type, goals, assists, shots,
           shots_on_goal, ground_balls, turnovers, caused_turnovers, faceoff_wins,
           faceoff_losses, saves, goals_against, personal_fouls, technical_fouls
    FROM legacy_playoff_labeled
    UNION ALL
    SELECT player_id, team_id, season_year, game_type, goals, assists, shots,
           shots_on_goal, ground_balls, turnovers, caused_turnovers, faceoff_wins,
           faceoff_losses, saves, goals_against, personal_fouls, technical_fouls
    FROM game_level
)
SELECT
    player_id, team_id, season_year, game_type,
    SUM(goals) AS goals, SUM(assists) AS assists,
    SUM(goals) + SUM(assists) AS points,
    SUM(shots) AS shots, SUM(shots_on_goal) AS shots_on_goal,
    SUM(ground_balls) AS ground_balls, SUM(turnovers) AS turnovers,
    SUM(caused_turnovers) AS caused_turnovers,
    SUM(faceoff_wins) AS faceoff_wins, SUM(faceoff_losses) AS faceoff_losses,
    SUM(saves) AS saves, SUM(goals_against) AS goals_against,
    SUM(personal_fouls) AS personal_fouls, SUM(technical_fouls) AS technical_fouls
FROM unioned
GROUP BY player_id, team_id, season_year, game_type;

-- Career totals = season_totals collapsed across all years.
-- Query with game_type = 'regular' or 'playoff'; sum both together in the
-- application layer (or add a WHERE-less GROUP BY) to get "combined" totals.
CREATE VIEW career_totals AS
SELECT
    player_id, team_id, game_type,
    SUM(goals) AS goals, SUM(assists) AS assists, SUM(points) AS points,
    SUM(shots) AS shots, SUM(shots_on_goal) AS shots_on_goal,
    SUM(ground_balls) AS ground_balls, SUM(turnovers) AS turnovers,
    SUM(caused_turnovers) AS caused_turnovers,
    SUM(faceoff_wins) AS faceoff_wins, SUM(faceoff_losses) AS faceoff_losses,
    SUM(saves) AS saves, SUM(goals_against) AS goals_against,
    SUM(personal_fouls) AS personal_fouls, SUM(technical_fouls) AS technical_fouls
FROM season_totals
GROUP BY player_id, team_id, game_type;

-- Seed the one team we currently need.
INSERT INTO teams (name, slug) VALUES ('St. John''s Jesuit', 'sjj');
