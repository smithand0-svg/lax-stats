-- Team-level per-game stats, sourced directly from Hudl's "All Athletes —
-- Totals" team report — NOT summed from individual player stat lines.
-- This exists because some events (e.g. clears, rides, possessions) are
-- tracked by Hudl at the team level only and have no per-player
-- attribution, so they can never be correctly derived from
-- game_stat_lines no matter how complete player-level import gets.
--
-- One row per game, 1:1 with `games`.

CREATE TABLE team_game_stats (
    id                     BIGSERIAL PRIMARY KEY,
    game_id                BIGINT NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
    team_id                BIGINT NOT NULL REFERENCES teams(id),

    -- Shooting
    goals                  INT NOT NULL DEFAULT 0,
    assists                INT NOT NULL DEFAULT 0,
    shots                  INT NOT NULL DEFAULT 0,
    shots_on_goal          INT NOT NULL DEFAULT 0,
    shot_pct               NUMERIC(5,1),

    -- Possession
    possessions            INT NOT NULL DEFAULT 0,
    attacking_possessions  INT NOT NULL DEFAULT 0,
    poss_per_shot          NUMERIC(6,2),
    poss_per_goal          NUMERIC(6,2),
    poss_pct               NUMERIC(5,1),

    ground_balls           INT NOT NULL DEFAULT 0,

    -- Clears / Rides
    successful_clears      INT NOT NULL DEFAULT 0,
    failed_clears          INT NOT NULL DEFAULT 0,
    clear_pct              NUMERIC(5,1),
    successful_rides       INT NOT NULL DEFAULT 0,
    failed_rides           INT NOT NULL DEFAULT 0,
    ride_pct               NUMERIC(5,1),

    -- Faceoffs
    faceoffs               INT NOT NULL DEFAULT 0,  -- authoritative total, as reported by Hudl
    faceoff_wins           INT NOT NULL DEFAULT 0,
    faceoff_losses         INT NOT NULL DEFAULT 0,
    faceoff_pct            NUMERIC(5,1),

    -- Turnovers
    turnovers              INT NOT NULL DEFAULT 0,  -- authoritative total; may not always equal forced+unforced (Hudl quirk, confirmed with Andy)
    forced_turnovers       INT NOT NULL DEFAULT 0,
    unforced_turnovers     INT NOT NULL DEFAULT 0,

    -- Defense
    blocks                 INT NOT NULL DEFAULT 0,
    caused_turnovers       INT NOT NULL DEFAULT 0,

    -- Goalie / scoreboard
    goals_against          INT NOT NULL DEFAULT 0,
    saves                  INT NOT NULL DEFAULT 0,
    save_pct               NUMERIC(5,1),

    -- Extra Man Offense (our attack, higher is better)
    emo                    INT NOT NULL DEFAULT 0,
    emo_goals              INT NOT NULL DEFAULT 0,
    emo_pct                NUMERIC(5,1),

    -- Man-Down Defense (opponent's attack against us, lower is better)
    man_down_defenses      INT NOT NULL DEFAULT 0,
    man_down_goals_against INT NOT NULL DEFAULT 0,
    man_down_pct           NUMERIC(5,1),

    -- Penalties — Andy has flagged these as unreliable in Hudl (hard to
    -- tag consistently). Stored for completeness, but NOT to be surfaced
    -- in any public Team Stats / records display.
    penalties              INT NOT NULL DEFAULT 0,
    technical_penalties    INT NOT NULL DEFAULT 0,
    personal_penalties     INT NOT NULL DEFAULT 0,

    import_source          TEXT NOT NULL DEFAULT 'hudl_team_totals',
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_game_stats_game ON team_game_stats (game_id);
