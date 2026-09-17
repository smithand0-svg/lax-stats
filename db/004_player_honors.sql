-- Player honors: college commitments, All-American recognitions, etc.
-- player_id is nullable and resolved by exact name match against the
-- players table where possible — many honorees here predate our stat
-- data (1991-2013ish), so a real match won't always exist. Unmatched
-- honorees still display on the standalone College/All-Americans page,
-- just without a link to a player profile.
CREATE TABLE player_honors (
    id            BIGSERIAL PRIMARY KEY,
    team_id       BIGINT NOT NULL REFERENCES teams(id),
    player_id     BIGINT REFERENCES players(id),
    player_name   TEXT NOT NULL,   -- always stored as-is, even when matched, for display/audit
    honor_type    TEXT NOT NULL CHECK (honor_type IN (
                     'college_commitment', 'all_american',
                     'academic_all_american', 'collegiate_all_american'
                   )),
    honor_year    INT,
    position      TEXT,
    school        TEXT,            -- college attended, where applicable
    division      TEXT,            -- D1/D2/D3, where applicable
    note          TEXT             -- e.g. 'HM' for Honorable Mention
);
