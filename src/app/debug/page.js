import { pool } from '@/lib/db';

// Temporary diagnostic page — shows the exact database connection error
// directly in the browser, since logs have been hard to access on this
// hosting environment. Safe to leave up short-term (shows no secrets),
// but should be deleted once the real leaderboard/import pages are
// confirmed working.
export const dynamic = 'force-dynamic';

export default async function DebugPage() {
  let result = null;
  let error = null;
  let counts = null;
  let leaderboardTest = null;
  let periodLabelTest = null;
  let coachingStatsTest = null;

  try {
    const { rows } = await pool.query('SELECT NOW() AS server_time, current_database() AS db_name');
    result = rows[0];

    const countQueries = await Promise.all([
      pool.query('SELECT COUNT(*) FROM teams'),
      pool.query('SELECT COUNT(*) FROM players'),
      pool.query('SELECT COUNT(*) FROM games'),
      pool.query('SELECT COUNT(*) FROM game_stat_lines'),
      pool.query("SELECT COUNT(*) FROM career_totals WHERE game_type = 'regular'"),
      pool.query('SELECT id, opponent, season_year, game_type FROM games ORDER BY id DESC LIMIT 5'),
    ]);
    counts = {
      teams: countQueries[0].rows[0].count,
      players: countQueries[1].rows[0].count,
      games: countQueries[2].rows[0].count,
      game_stat_lines: countQueries[3].rows[0].count,
      career_totals_regular_rows: countQueries[4].rows[0].count,
      recentGames: countQueries[5].rows,
    };

    // Runs the EXACT query the leaderboard page uses for "goals", to see
    // directly whether it's returning real rows or something's wrong
    // with this specific query on the deployed server.
    try {
      const lbTest = await pool.query(
        `SELECT p.id, p.first_name, p.last_name, p.graduation_year,
                SUM(s.goals) AS value,
                RANK() OVER (ORDER BY SUM(s.goals) DESC) AS rnk
         FROM season_totals s
         JOIN players p ON p.id = s.player_id
         GROUP BY p.id, p.first_name, p.last_name, p.graduation_year
         HAVING SUM(s.goals) > 0
         ORDER BY value DESC
         LIMIT 5`
      );
      leaderboardTest = { rowCount: lbTest.rows.length, rows: lbTest.rows };
    } catch (lbErr) {
      leaderboardTest = { error: lbErr.message, code: lbErr.code };
    }

    // Runs the exact period_label lookup query used for the "years
    // active" feature, to see directly whether the 4 Legacy records are
    // being found and matched correctly.
    try {
      const labelTest = await pool.query(
        `SELECT s.player_id, p.first_name, p.last_name, s.period_label,
                s.goals, s.assists, s.ground_balls
         FROM season_stat_summaries s
         JOIN players p ON p.id = s.player_id
         WHERE s.season_year IS NULL AND s.period_label IS NOT NULL`
      );
      periodLabelTest = { rowCount: labelTest.rows.length, rows: labelTest.rows };
    } catch (labelErr) {
      periodLabelTest = { error: labelErr.message, code: labelErr.code };
    }
    // Runs the EXACT query the Coaching Stats page uses, to see directly
    // whether the new program_seasons table/data is actually reachable
    // from this deployed code.
    try {
      const csTest = await pool.query(`
        SELECT head_coach,
               array_agg(season_year ORDER BY season_year) AS years,
               COUNT(*) AS seasons,
               SUM(regular_wins) AS reg_w, SUM(regular_losses) AS reg_l,
               SUM(playoff_wins) AS po_w, SUM(playoff_losses) AS po_l,
               SUM(total_wins) AS tot_w, SUM(total_losses) AS tot_l
        FROM program_seasons
        WHERE head_coach IS NOT NULL
        GROUP BY head_coach
      `);
      coachingStatsTest = { rowCount: csTest.rows.length, rows: csTest.rows };
    } catch (csErr) {
      coachingStatsTest = { error: csErr.message, code: csErr.code };
    }
  } catch (err) {
    error = {
      message: err.message,
      code: err.code,
      detail: err.detail,
      stack: err.stack,
    };
  }

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: 32, fontFamily: 'monospace' }}>
      <h1>Database Connection Diagnostic</h1>
      {result && (
        <div style={{ background: '#dcfce7', padding: 16, borderRadius: 8 }}>
          <p><strong>✅ Connection succeeded.</strong></p>
          <p>Server time: {String(result.server_time)}</p>
          <p>Connected to database: {result.db_name}</p>
        </div>
      )}
      {counts && (
        <div style={{ background: '#e0f2fe', padding: 16, borderRadius: 8, marginTop: 16 }}>
          <p><strong>Table row counts:</strong></p>
          <ul>
            <li>teams: {counts.teams}</li>
            <li>players: {counts.players}</li>
            <li>games: {counts.games}</li>
            <li>game_stat_lines: {counts.game_stat_lines}</li>
            <li>career_totals (game_type=regular): {counts.career_totals_regular_rows}</li>
          </ul>
          <p><strong>Most recent games:</strong></p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(counts.recentGames, null, 2)}</pre>
        </div>
      )}
      {leaderboardTest && (
        <div style={{ background: '#fef9c3', padding: 16, borderRadius: 8, marginTop: 16 }}>
          <p><strong>Leaderboard "goals" query test (top 5):</strong></p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(leaderboardTest, null, 2)}</pre>
        </div>
      )}
      {periodLabelTest && (
        <div style={{ background: '#fce7f3', padding: 16, borderRadius: 8, marginTop: 16 }}>
          <p><strong>Legacy period_label lookup test:</strong></p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(periodLabelTest, null, 2)}</pre>
        </div>
      )}
      {coachingStatsTest && (
        <div style={{ background: '#dbeafe', padding: 16, borderRadius: 8, marginTop: 16 }}>
          <p><strong>Coaching Stats query test:</strong></p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(coachingStatsTest, null, 2)}</pre>
        </div>
      )}
      {error && (
        <div style={{ background: '#fee2e2', padding: 16, borderRadius: 8 }}>
          <p><strong>❌ Connection failed.</strong></p>
          <p><strong>Message:</strong> {error.message}</p>
          {error.code && <p><strong>Code:</strong> {error.code}</p>}
          {error.detail && <p><strong>Detail:</strong> {error.detail}</p>}
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 16 }}>{error.stack}</pre>
        </div>
      )}
    </main>
  );
}
