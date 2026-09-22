-- Follow-up to db/030: Andy confirmed SSD and SSDM also map to
-- Defensive Midfielder (same target as DM/D-Mid), rather than being
-- kept as a distinct short-stick designation.
UPDATE season_honors SET position = 'Defensive Midfielder' WHERE position IN ('SSD', 'SSDM');
