const { pool } = require('./db');
const { matchPlayer, MATCH } = require('./playerMatcher');
const { parseHudlCsv, splitName } = require('./hudlParser');

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
 * PHASE 2 — Commit an import. Everything happens in one transaction:
 *   - create or reuse the game record
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

    // 1. Create or reuse the game.
    let gameId = gameMeta.gameId;
    if (gameId) {
      await client.query('UPDATE games SET updated_at = now() WHERE id = $1', [gameId]);
    } else {
      const gameResult = await client.query(
        `INSERT INTO games (team_id, opponent, game_date, season_year, game_type, round, import_source)
         VALUES ($1, $2, $3, $4, $5, $6, 'hudl') RETURNING id`,
        [gameMeta.teamId, gameMeta.opponent, gameMeta.gameDate || null, gameMeta.seasonYear, gameMeta.gameType, gameMeta.round || null]
      );
      gameId = gameResult.rows[0].id;
    }

    // 2. Resolve every row to a concrete player_id.
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

    // 3. Replace-by-game: wipe existing stat lines for this game, then insert fresh.
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

    // 4. Audit log.
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

module.exports = { previewImport, commitImport };
