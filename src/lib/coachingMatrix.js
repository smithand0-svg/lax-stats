// TM-43: a head coach's opponent-by-opponent record (Coaching Matrix).
//
// Historic + new, with no overlap:
//   - Baseline: Andy's spreadsheet, as-is, for every season through 2026
//     (src/lib/coachingMatrixBaseline.js).
//   - Live: every game in a season flagged auto_record (2027 on),
//     credited to that season's head coach, using the same game-result
//     definition as the calculated Season History records (gameResults).
// A season is either hand-kept or auto_record, never both, so the two
// sources can't double count.
import { pool } from '@/lib/db';
import { GAME_SCORES_SQL } from '@/lib/gameResults';
import { getOpponentLookup, makeCanonicalizer } from '@/lib/opponentLookup';
import { COACHING_MATRIX_BASELINE } from '@/lib/coachingMatrixBaseline';

async function getLiveRows(headCoach) {
  const { rows } = await pool.query(
    `WITH gs AS (${GAME_SCORES_SQL})
     SELECT gs.opponent,
       COUNT(*) FILTER (WHERE gs.game_type = 'regular' AND gs.goals_for > gs.goals_against) AS rw,
       COUNT(*) FILTER (WHERE gs.game_type = 'regular' AND gs.goals_for < gs.goals_against) AS rl,
       COUNT(*) FILTER (WHERE gs.game_type = 'playoff' AND gs.goals_for > gs.goals_against) AS pw,
       COUNT(*) FILTER (WHERE gs.game_type = 'playoff' AND gs.goals_for < gs.goals_against) AS pl
     FROM gs
     JOIN program_seasons ps ON ps.team_id = $1 AND ps.season_year = gs.season_year
     WHERE ps.auto_record AND ps.head_coach = $2
     GROUP BY gs.opponent`,
    [await sjjTeamId(), headCoach]
  );
  return rows.map((r) => ({ opponent: r.opponent, rw: +r.rw, rl: +r.rl, pw: +r.pw, pl: +r.pl }));
}

async function sjjTeamId() {
  const { rows } = await pool.query(`SELECT id FROM teams WHERE slug = 'sjj'`);
  return rows[0]?.id ?? null;
}

// Returns null when this coach has neither baseline rows nor live games
// (e.g. an assistant who never head coached, or a pre-2007 head coach
// whose source data has no opponent detail).
export async function getCoachingMatrix(headCoach) {
  const baseline = COACHING_MATRIX_BASELINE.filter(([coach]) => coach === headCoach);
  const [live, lookup] = await Promise.all([getLiveRows(headCoach), getOpponentLookup()]);
  if (baseline.length === 0 && live.length === 0) {
    // A real head coach with no opponent-level detail (Jim Reed, Chad
    // Fredericks, Mike Degens, Brad Lay) gets a note, matching the
    // spreadsheet's "detailed data unavailable". Anyone who never head
    // coached gets no section at all.
    const { rows } = await pool.query(
      `SELECT 1 FROM program_seasons WHERE team_id = $1 AND head_coach = $2 LIMIT 1`,
      [await sjjTeamId(), headCoach]
    );
    return rows.length > 0 ? { rows: [], totals: null, noDetail: true } : null;
  }

  // Merge by canonical opponent (exact name or known alias only, never
  // fuzzy), so a spreadsheet spelling and the live import's spelling of
  // the same school land on one row.
  const canonicalize = makeCanonicalizer(lookup);
  const byOpponent = new Map();
  const add = (opponent, rw, rl, pw, pl) => {
    const name = canonicalize(opponent);
    const row = byOpponent.get(name) || { opponent: name, rw: 0, rl: 0, pw: 0, pl: 0 };
    row.rw += rw; row.rl += rl; row.pw += pw; row.pl += pl;
    byOpponent.set(name, row);
  };
  baseline.forEach(([, opponent, rw, rl, pw, pl]) => add(opponent, rw, rl, pw, pl));
  live.forEach((r) => add(r.opponent, r.rw, r.rl, r.pw, r.pl));

  const rows = [...byOpponent.values()].sort((a, b) => a.opponent.localeCompare(b.opponent));
  const totals = rows.reduce(
    (t, r) => ({ rw: t.rw + r.rw, rl: t.rl + r.rl, pw: t.pw + r.pw, pl: t.pl + r.pl }),
    { rw: 0, rl: 0, pw: 0, pl: 0 }
  );
  return { rows, totals };
}
