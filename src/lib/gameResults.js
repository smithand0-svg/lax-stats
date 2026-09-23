// TM-36 point 3: one shared definition of a game's result, so Season
// History records (and later the Coaching Matrix, TM-43) all read the
// same thing.
//
// Score source: the team-totals import (team_game_stats.goals /
// goals_against) first, falling back to summing the individual stat
// lines when team totals weren't imported for that game. A game with
// no score from either source, or a tied score, counts as neither a
// win nor a loss (and is reported, not guessed).
const { pool } = require('./db');

const GAME_SCORES_SQL = `
  SELECT g.id, g.season_year, g.game_type, g.is_league_game, g.opponent, g.game_date,
         COALESCE(tgs.goals, pl.goals) AS goals_for,
         COALESCE(tgs.goals_against, pl.goals_against) AS goals_against
  FROM games g
  LEFT JOIN team_game_stats tgs ON tgs.game_id = g.id
  LEFT JOIN (
    SELECT game_id, SUM(goals) AS goals, SUM(goals_against) AS goals_against
    FROM game_stat_lines GROUP BY game_id
  ) pl ON pl.game_id = g.id
  WHERE g.team_id = $1`;

// Recalculates one season's record from its games -- only if that
// season is flagged auto_record. Takes a client so it runs inside the
// caller's import transaction: the record and the imported stats commit
// (or roll back) together.
async function recalcSeasonRecord(client, teamId, seasonYear) {
  const { rows: seasonRows } = await client.query(
    `SELECT auto_record, league_name FROM program_seasons WHERE team_id = $1 AND season_year = $2`,
    [teamId, seasonYear]
  );
  const season = seasonRows[0];
  if (!season || !season.auto_record) return null;

  const { rows } = await client.query(
    `WITH gs AS (${GAME_SCORES_SQL} AND g.season_year = $2)
     SELECT
       COUNT(*) FILTER (WHERE game_type = 'regular' AND goals_for > goals_against) AS rw,
       COUNT(*) FILTER (WHERE game_type = 'regular' AND goals_for < goals_against) AS rl,
       COUNT(*) FILTER (WHERE game_type = 'playoff' AND goals_for > goals_against) AS pw,
       COUNT(*) FILTER (WHERE game_type = 'playoff' AND goals_for < goals_against) AS pl,
       COUNT(*) FILTER (WHERE is_league_game AND game_type = 'regular' AND goals_for > goals_against) AS lw,
       COUNT(*) FILTER (WHERE is_league_game AND game_type = 'regular' AND goals_for < goals_against) AS ll
     FROM gs`,
    [teamId, seasonYear]
  );
  const r = rows[0];
  const n = (v) => Number(v || 0);
  const hasLeague = !!season.league_name;

  await client.query(
    `UPDATE program_seasons
     SET regular_wins = $3, regular_losses = $4, playoff_wins = $5, playoff_losses = $6,
         total_wins = $9, total_losses = $10,
         league_wins = $7, league_losses = $8
     WHERE team_id = $1 AND season_year = $2`,
    [
      teamId, seasonYear, n(r.rw), n(r.rl), n(r.pw), n(r.pl),
      hasLeague ? n(r.lw) : null, hasLeague ? n(r.ll) : null,
      n(r.rw) + n(r.pw), n(r.rl) + n(r.pl),
    ]
  );
  return r;
}

// Games in an auto_record season that currently count as neither a win
// nor a loss (no score yet, or tied) -- surfaced on the admin Seasons
// page so a missing team-totals import doesn't silently shrink a record.
async function getUncountedGames(teamId, seasonYear) {
  const { rows } = await pool.query(
    `WITH gs AS (${GAME_SCORES_SQL} AND g.season_year = $2)
     SELECT opponent, game_date, goals_for, goals_against FROM gs
     WHERE goals_for IS NULL OR goals_against IS NULL OR goals_for = goals_against
     ORDER BY game_date NULLS LAST`,
    [teamId, seasonYear]
  );
  return rows;
}

module.exports = { GAME_SCORES_SQL, recalcSeasonRecord, getUncountedGames };
