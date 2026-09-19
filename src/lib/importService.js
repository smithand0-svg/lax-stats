const { pool } = require('./db');
const { matchPlayer, MATCH } = require('./playerMatcher');
const { matchOpponent, MATCH: OPPONENT_MATCH } = require('./opponentMatcher');
const { parseHudlCsv, splitName } = require('./hudlParser');
const { parseHudlTeamTotalsCsv } = require('./hudlTeamTotalsParser');

/**
 * PHASE 1 — Preview an import. Read-only: touches the database only to
 * SELECT existing players/aliases for matching. Nothing is written.
 *
 * Returns one entry per parsed row, each tagged with a match status so the
 * admin UI can render "auto-matched" rows plainly and "needs your input"
 * rows with a decision control.
 */
async function previewImport(teamId, csvText, Papa) {
  const { rows, unmappedColumns } = parseHudlCsv(csvText, Papa);

  const { rows: existingPlayers } = await pool.query(
    'SELECT id, first_name AS "firstName", last_name AS "lastName", graduation_year AS "graduationYear" FROM players WHERE team_id = $1',
    [teamId]
  );
  const { rows: existingAliases } = await pool.query(
    `SELECT pa.player_id AS "playerId", pa.alias_first_name AS "aliasFirstName", pa.alias_last_name AS "aliasLastName"
     FROM player_aliases pa JOIN players p ON p.id = pa.player_id WHERE p.team_id = $1`,
    [teamId]
  );

  const previewRows = rows.map((row) => {
    const match = matchPlayer(row.fullName, existingPlayers, existingAliases);
    return { ...row, match };
  });

  const needsReview = previewRows.filter(
    (r) => r.match.status === MATCH.POSSIBLE || r.match.status === MATCH.NEW
  ).length;

  return { previewRows, unmappedColumns, needsReview, totalRows: previewRows.length };
}

/**
 * Shared by both commit paths (individual-stats and team-stats imports):
 * resolves the opponent to its canonical spelling (creating a new
 * `opponents` row if genuinely new), then finds-or-creates the game.
 *
 * "Finds" matters here, not just "creates": if a game already exists for
 * this team_id + opponent + game_date — e.g. the individual-stats CSV was
 * already imported for this game, and now the team-totals CSV is being
 * imported for the SAME game — this reuses that existing row instead of
 * creating a second `games` row for the same real game. Without this,
 * importing both formats for one game (which is exactly the point of
 * having both) would silently double the game count everywhere: GP
 * totals, season game counts, etc. This also happens to fix a pre-existing
 * gap in the individual-stats path alone: re-importing the same game's
 * player CSV a second time (e.g. a Hudl correction after review) used to
 * always insert a new game row rather than reusing the first one, unless
 * gameMeta.gameId was explicitly passed — which the UI never actually
 * does today. Natural-key matching now makes "replace-by-game" work the
 * way decisions.md already says it should, for both formats.
 */
async function resolveOpponentAndGame(client, gameMeta) {
  const { rows: existingOpponents } = await client.query(
    'SELECT id, name FROM opponents WHERE team_id = $1',
    [gameMeta.teamId]
  );
  const { rows: existingOpponentAliases } = await client.query(
    `SELECT oa.opponent_id AS "opponentId", oa.alias_name AS "aliasName"
     FROM opponent_aliases oa JOIN opponents o ON o.id = oa.opponent_id WHERE o.team_id = $1`,
    [gameMeta.teamId]
  );
  const opponentMatch = matchOpponent(gameMeta.opponent, existingOpponents, existingOpponentAliases);
  const canonicalOpponent = opponentMatch.canonicalName;
  if (!canonicalOpponent) {
    throw new Error('Opponent is required.');
  }
  if (opponentMatch.status === OPPONENT_MATCH.NEW) {
    await client.query(
      `INSERT INTO opponents (team_id, name) VALUES ($1, $2) ON CONFLICT (team_id, name) DO NOTHING`,
      [gameMeta.teamId, canonicalOpponent]
    );
  }

  let gameId = gameMeta.gameId;
  if (gameId) {
    await client.query('UPDATE games SET updated_at = now() WHERE id = $1', [gameId]);
  } else {
    const { rows: existingGameRows } = await client.query(
      `SELECT id FROM games WHERE team_id = $1 AND opponent = $2 AND game_date IS NOT DISTINCT FROM $3`,
      [gameMeta.teamId, canonicalOpponent, gameMeta.gameDate || null]
    );
    if (existingGameRows[0]) {
      gameId = existingGameRows[0].id;
      await client.query('UPDATE games SET updated_at = now() WHERE id = $1', [gameId]);
    } else {
      const gameResult = await client.query(
        `INSERT INTO games (team_id, opponent, game_date, season_year, game_type, round, import_source)
         VALUES ($1, $2, $3, $4, $5, $6, 'hudl') RETURNING id`,
        [gameMeta.teamId, canonicalOpponent, gameMeta.gameDate || null, gameMeta.seasonYear, gameMeta.gameType, gameMeta.round || null]
      );
      gameId = gameResult.rows[0].id;
    }
  }
  return { gameId, canonicalOpponent };
}

/**
 * PHASE 2 — Commit an individual-stats (per-player) import. Everything
 * happens in one transaction:
 *   - resolve the opponent + find-or-create the game (see
 *     resolveOpponentAndGame)
 *   - resolve every row to a concrete player_id (creating new players /
 *     new aliases as directed by `resolutions`)
 *   - DELETE any existing stat lines for this game (replace-by-game)
 *   - INSERT the new stat lines
 *   - log an import_batches row
 *
 * @param {object} gameMeta - { teamId, gameId? (if replacing), opponent, gameDate, seasonYear, gameType, round? }
 * @param {Array} previewRows - the rows returned by previewImport (each has .match)
 * @param {Object.<number, {action: 'use_existing'|'create_new', playerId?: string, saveAsAlias?: boolean}>} resolutions
 *   Keyed by row index. Only needed for rows whose match.status was
 *   'possible_match' or 'new_player' — exact/alias matches resolve themselves.
 * @param {string} fileName - for the import_batches audit log
 */
async function commitImport(gameMeta, previewRows, resolutions, fileName) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { gameId } = await resolveOpponentAndGame(client, gameMeta);

    // 3. Resolve every row to a concrete player_id.
    const resolvedRows = [];
    for (let i = 0; i < previewRows.length; i++) {
      const row = previewRows[i];
      let playerId;

      if (row.match.status === MATCH.EXACT || row.match.status === MATCH.ALIAS) {
        playerId = row.match.playerId;
      } else {
        const resolution = resolutions[i];
        if (!resolution) {
          throw new Error(`Row ${i} ("${row.fullName}") is unresolved (status: ${row.match.status}) — cannot commit until every ambiguous row has a decision.`);
        }
        if (resolution.action === 'create_new') {
          const { firstName, lastName } = splitName(row.fullName);
          const inserted = await client.query(
            `INSERT INTO players (team_id, first_name, last_name) VALUES ($1, $2, $3) RETURNING id`,
            [gameMeta.teamId, firstName, lastName]
          );
          playerId = inserted.rows[0].id;
        } else if (resolution.action === 'use_existing') {
          playerId = resolution.playerId;
          if (resolution.saveAsAlias) {
            const { firstName, lastName } = splitName(row.fullName);
            await client.query(
              `INSERT INTO player_aliases (player_id, alias_first_name, alias_last_name, source) VALUES ($1, $2, $3, $4)`,
              [playerId, firstName, lastName, fileName || 'hudl import']
            );
          }
        } else {
          throw new Error(`Row ${i}: unrecognized resolution action "${resolution.action}"`);
        }
      }
      resolvedRows.push({ ...row, playerId });
    }

    // 4. Replace-by-game: wipe existing stat lines for this game, then insert fresh.
    await client.query('DELETE FROM game_stat_lines WHERE game_id = $1', [gameId]);

    for (const row of resolvedRows) {
      await client.query(
        `INSERT INTO game_stat_lines
           (game_id, player_id, team_id, faceoff_wins, faceoff_losses, goals, assists,
            shots, shots_on_goal, ground_balls, turnovers, caused_turnovers,
            goals_against, saves, personal_fouls, technical_fouls)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          gameId, row.playerId, gameMeta.teamId,
          row.faceoffWins || 0, row.faceoffLosses || 0, row.goals || 0, row.assists || 0,
          row.shots || 0, row.shotsOnGoal || 0, row.groundBalls || 0, row.turnovers || 0,
          row.causedTurnovers || 0, row.goalsAgainst || 0, row.saves || 0,
          row.personalFouls || 0, row.technicalFouls || 0,
        ]
      );
    }

    // 5. Audit log.
    await client.query(
      `INSERT INTO import_batches (team_id, game_id, file_name, row_count, status) VALUES ($1,$2,$3,$4,'success')`,
      [gameMeta.teamId, gameId, fileName || null, resolvedRows.length]
    );

    await client.query('COMMIT');
    return { gameId, rowsWritten: resolvedRows.length };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { previewImport, commitImport, previewTeamImport, commitTeamImport };

/**
 * PHASE 1 (team-stats) — Preview a team-totals import. Pure parse, no DB
 * access at all — there's no player matching to do, just the "Overall"
 * row's stats to show the admin for a sanity check before committing.
 */
function previewTeamImport(csvText, Papa) {
  const { stats, periodRows } = parseHudlTeamTotalsCsv(csvText, Papa);
  return { stats, periodRows };
}

const TEAM_STATS_COLUMNS = [
  'goals', 'assists', 'shots', 'shots_on_goal', 'shot_pct',
  'possessions', 'attacking_possessions', 'poss_per_shot', 'poss_per_goal', 'poss_pct',
  'ground_balls', 'successful_clears', 'failed_clears', 'clear_pct',
  'successful_rides', 'failed_rides', 'ride_pct',
  'faceoffs', 'faceoff_wins', 'faceoff_losses', 'faceoff_pct',
  'turnovers', 'forced_turnovers', 'unforced_turnovers',
  'blocks', 'caused_turnovers', 'goals_against', 'saves', 'save_pct',
  'emo', 'emo_goals', 'emo_pct', 'man_down_defenses', 'man_down_goals_against', 'man_down_pct',
  'penalties', 'technical_penalties', 'personal_penalties',
];
// Same order as TEAM_STATS_COLUMNS, in the camelCase the parser produces.
const TEAM_STATS_FIELDS = [
  'goals', 'assists', 'shots', 'shotsOnGoal', 'shotPct',
  'possessions', 'attackingPossessions', 'possPerShot', 'possPerGoal', 'possPct',
  'groundBalls', 'successfulClears', 'failedClears', 'clearPct',
  'successfulRides', 'failedRides', 'ridePct',
  'faceoffs', 'faceoffWins', 'faceoffLosses', 'faceoffPct',
  'turnovers', 'forcedTurnovers', 'unforcedTurnovers',
  'blocks', 'causedTurnovers', 'goalsAgainst', 'saves', 'savePct',
  'emo', 'emoGoals', 'emoPct', 'manDownDefenses', 'manDownGoalsAgainst', 'manDownPct',
  'penalties', 'technicalPenalties', 'personalPenalties',
];

/**
 * PHASE 2 (team-stats) — Commit a team-totals import. One transaction:
 *   - resolve the opponent + find-or-create the game (see
 *     resolveOpponentAndGame — this is what lets an individual-stats
 *     import and a team-stats import for the same game land on the same
 *     `games` row instead of creating two)
 *   - upsert the parsed stats into team_game_stats (replace-by-game,
 *     same convention as the individual-stats path's delete-then-insert)
 *   - log an import_batches row
 *
 * @param {object} gameMeta - same shape as commitImport's
 * @param {object} stats - the `stats` object from previewTeamImport
 * @param {string} fileName - for the import_batches audit log
 */
async function commitTeamImport(gameMeta, stats, fileName) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { gameId } = await resolveOpponentAndGame(client, gameMeta);

    const values = TEAM_STATS_FIELDS.map((f) => (stats[f] === undefined ? null : stats[f]));
    const placeholders = values.map((_, i) => `$${i + 3}`).join(', '); // $1 = gameId, $2 = teamId
    const updateSet = TEAM_STATS_COLUMNS.map((c) => `${c} = EXCLUDED.${c}`).join(', ');

    await client.query(
      `INSERT INTO team_game_stats (game_id, team_id, ${TEAM_STATS_COLUMNS.join(', ')}, import_source)
       VALUES ($1, $2, ${placeholders}, 'hudl_team_totals')
       ON CONFLICT (game_id) DO UPDATE SET ${updateSet}, import_source = EXCLUDED.import_source`,
      [gameId, gameMeta.teamId, ...values]
    );

    await client.query(
      `INSERT INTO import_batches (team_id, game_id, file_name, row_count, status) VALUES ($1,$2,$3,1,'success')`,
      [gameMeta.teamId, gameId, fileName || null]
    );

    await client.query('COMMIT');
    return { gameId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
