-- Team-level per-game stats, sourced from Hudl's "All Athletes — Totals"
-- team report AND from historical LaxPower/LaxNumbers records — NOT summed
-- from individual player stat lines. This exists because some events
-- (e.g. clears, rides, possessions) are tracked at the team level only and
-- have no per-player attribution, and because older eras (2002-2019) only
-- have sparse historical data available at all (often just goals/goals
-- against, occasionally assists).
--
-- One row per game, 1:1 with `games`.
--
-- Every stat column is NULLABLE. This is deliberate: this table spans two
-- very different eras of data richness (full Hudl team-totals exports vs.
-- sparse historical scrapes), and a column being NULL ("we don't know")
-- must stay distinguishable from a recorded 0 ("we know it happened zero
-- times") — e.g. a shutout has goals_against = 0, which is a real,
-- meaningful record; an untracked stat from a 2004 game should be NULL,
-- not a misleading 0 that would incorrectly compete for "fewest allowed"
-- records against games where it was actually measured.

CREATE TABLE team_game_stats (
    id                     BIGSERIAL PRIMARY KEY,
    game_id                BIGINT NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
    team_id                BIGINT NOT NULL REFERENCES teams(id),

    -- Shooting
    goals                  INT,
    assists                INT,
    shots                  INT,
    shots_on_goal          INT,
    shot_pct               NUMERIC(5,1),

    -- Possession
    possessions            INT,
    attacking_possessions  INT,
    poss_per_shot          NUMERIC(6,2),
    poss_per_goal          NUMERIC(6,2),
    poss_pct               NUMERIC(5,1),

    ground_balls           INT,

    -- Clears / Rides
    successful_clears      INT,
    failed_clears          INT,
    clear_pct              NUMERIC(5,1),
    successful_rides       INT,
    failed_rides           INT,
    ride_pct               NUMERIC(5,1),

    -- Faceoffs
    faceoffs               INT,  -- authoritative total, as reported by Hudl
    faceoff_wins           INT,
    faceoff_losses         INT,
    faceoff_pct            NUMERIC(5,1),

    -- Turnovers
    turnovers              INT,  -- authoritative total; may not always equal forced+unforced (Hudl quirk, confirmed with Andy)
    forced_turnovers       INT,
    unforced_turnovers     INT,

    -- Defense
    blocks                 INT,
    caused_turnovers       INT,

    -- Goalie / scoreboard
    goals_against          INT,
    saves                  INT,
    save_pct               NUMERIC(5,1),

    -- Extra Man Offense (our attack, higher is better)
    emo                    INT,
    emo_goals              INT,
    emo_pct                NUMERIC(5,1),

    -- Man-Down Defense (opponent's attack against us, lower is better)
    man_down_defenses      INT,
    man_down_goals_against INT,
    man_down_pct           NUMERIC(5,1),

    -- Penalties — Andy has flagged these as unreliable in Hudl (hard to
    -- tag consistently). Stored for completeness, but NOT to be surfaced
    -- in any public Team Stats / records display.
    penalties              INT,
    technical_penalties    INT,
    personal_penalties     INT,

    import_source          TEXT NOT NULL DEFAULT 'hudl_team_totals',
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_game_stats_game ON team_game_stats (game_id);
