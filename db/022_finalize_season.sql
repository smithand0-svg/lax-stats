-- TM-17: season-finalize mechanism. NULL = not finalized (the default,
-- current state for every season). A timestamp both flags a season as
-- locked and gives a free audit trail of when it happened.
--
-- Scope, per Andy (2026-09-22): finalize locks the WHOLE season at
-- once -- regular season and playoffs together, one flag, not split
-- by game_type. Finalizing does not itself change anything else
-- derived elsewhere on the site (coach tenure, current-season
-- pointers, etc.) -- that's the separate advance mechanism, TM-24.
ALTER TABLE program_seasons ADD COLUMN finalized_at TIMESTAMPTZ;
