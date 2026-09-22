-- TM-24: explicit "current season" pointer, replacing the inferred
-- MAX(season_year)-with-live-data heuristic that Team Stats (TM-16) and
-- the Leaderboard used for amber "in progress" highlighting.
--
-- Backfilled to 2026 -- the latest real program_seasons row as of this
-- writing (2027 has deliberately never been inserted; see
-- 003_season_history_data.sql) -- so this starts out equivalent to the
-- old inferred behavior. The season-advance mechanism (TM-24's admin
-- action) is what moves it forward from here; nothing else should ever
-- write to this column.
ALTER TABLE teams ADD COLUMN current_season_year INT;

UPDATE teams SET current_season_year = 2026 WHERE slug = 'sjj';
