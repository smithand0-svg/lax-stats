import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pool } from '@/lib/db';
import { getCoachingMatrix } from '@/lib/coachingMatrix';

export const dynamic = 'force-dynamic';

// Standard tournament-bracket terminology has one correct order --
// unlike the award-tier ambiguity elsewhere in this app, this doesn't
// need Andy's judgment call, just the actual bracket structure. Add a
// new label here if a future season's playoff_result introduces one
// (e.g. a round between these).
const PLAYOFF_RESULT_RANK = { 'Sweet 16': 1, 'Elite 8': 2, 'Final 4': 3, 'State Finals': 4 };

async function getStaffMember(id) {
  const { rows } = await pool.query(
    `SELECT id, first_name, last_name, bio FROM staff
     WHERE id = $1 AND team_id = (SELECT id FROM teams WHERE slug = 'sjj')`,
    [id]
  );
  return rows[0] || null;
}

async function getAllRoles(id) {
  const { rows } = await pool.query(
    `SELECT id, season_year, team_level, role FROM staff_seasons
     WHERE staff_id = $1 ORDER BY season_year DESC`,
    [id]
  );
  return rows;
}

// Varsity-only, per TM-40's design: a coach's record reflects the
// team's result for any season they held a Varsity-level role (Head
// Coach or Assistant both count -- it's the team's record either way).
// JV-only seasons never factor into this. DISTINCT season_year guards
// against double-counting if someone somehow held two Varsity roles
// in the same season.
async function getVarsitySeasons(id) {
  const { rows } = await pool.query(
    `SELECT DISTINCT ps.season_year, ps.division, ps.regular_wins, ps.regular_losses,
            ps.playoff_wins, ps.playoff_losses, ps.total_wins, ps.total_losses,
            ps.playoff_result, ps.league_finish, ps.special_note
     FROM program_seasons ps
     JOIN staff_seasons ss ON ss.season_year = ps.season_year AND ss.team_level = 'Varsity'
     WHERE ss.staff_id = $1 AND ps.team_id = (SELECT id FROM teams WHERE slug = 'sjj')
     ORDER BY ps.season_year ASC`,
    [id]
  );
  return rows;
}

async function getHonors(id) {
  const { rows } = await pool.query(
    `SELECT id, season_year, honor_source, honor_label, position FROM season_honors
     WHERE staff_id = $1 AND recipient_type = 'staff' ORDER BY season_year ASC`,
    [id]
  );
  return rows;
}

function winPct(w, l) {
  const total = w + l;
  return total > 0 ? w / total : null;
}

function fmtPct(p) {
  return p === null ? '—' : p.toFixed(3).replace(/^0/, '');
}

export default async function CoachPage({ params }) {
  const { id } = await params;
  const person = await getStaffMember(id);
  if (!person) notFound();

  // TM-43: the head-to-head matrix is a HEAD COACH record (the tenure
  // the spreadsheet tracks), keyed by program_seasons.head_coach, which
  // staff names were backfilled from (db/035).
  const [roles, varsitySeasons, honors, matrix] = await Promise.all([
    getAllRoles(id),
    getVarsitySeasons(id),
    getHonors(id),
    getCoachingMatrix(`${person.first_name} ${person.last_name}`),
  ]);

  const careerRegularW = varsitySeasons.reduce((s, y) => s + y.regular_wins, 0);
  const careerRegularL = varsitySeasons.reduce((s, y) => s + y.regular_losses, 0);
  const careerPlayoffW = varsitySeasons.reduce((s, y) => s + y.playoff_wins, 0);
  const careerPlayoffL = varsitySeasons.reduce((s, y) => s + y.playoff_losses, 0);
  const careerTotalW = varsitySeasons.reduce((s, y) => s + y.total_wins, 0);
  const careerTotalL = varsitySeasons.reduce((s, y) => s + y.total_losses, 0);

  const bestRegular = varsitySeasons
    .map((y) => ({ year: y.season_year, pct: winPct(y.regular_wins, y.regular_losses) }))
    .filter((y) => y.pct !== null)
    .sort((a, b) => b.pct - a.pct)[0];

  const bestPlayoff = varsitySeasons
    .map((y) => ({ year: y.season_year, pct: winPct(y.playoff_wins, y.playoff_losses) }))
    .filter((y) => y.pct !== null)
    .sort((a, b) => b.pct - a.pct)[0];

  const rankedFinishes = varsitySeasons
    .filter((y) => y.playoff_result)
    .map((y) => ({ year: y.season_year, result: y.playoff_result, rank: PLAYOFF_RESULT_RANK[y.playoff_result] ?? 0 }))
    .sort((a, b) => b.rank - a.rank);
  const deepestFinish = rankedFinishes[0];
  const deepestFinishYears = deepestFinish
    ? rankedFinishes.filter((r) => r.result === deepestFinish.result).map((r) => r.year)
    : [];

  return (
    <main className="max-w-4xl mx-auto p-8">
      <Link href="/coaching-stats" className="text-sm text-gray-500 dark:text-gray-400 underline">
        ← Coaching Stats
      </Link>
      <h1 className="text-3xl font-bold mt-2 mb-1">{person.first_name} {person.last_name}</h1>
      {roles.length > 0 && (
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {[...new Set(roles.map((r) => r.role))].join(', ')}
        </p>
      )}

      {varsitySeasons.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-2 border-b pb-1">Varsity Career Record</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <div className="border rounded p-3 border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">Regular Season</p>
              <p className="text-xl font-bold">{careerRegularW}-{careerRegularL}</p>
            </div>
            <div className="border rounded p-3 border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">Playoffs</p>
              <p className="text-xl font-bold">{careerPlayoffW}-{careerPlayoffL}</p>
            </div>
            <div className="border rounded p-3 border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">Combined</p>
              <p className="text-xl font-bold">{careerTotalW}-{careerTotalL}</p>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-2 border-b pb-1">Best Marks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="border rounded p-3 border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">Best Regular Season Record</p>
              <p className="text-lg font-bold">{bestRegular ? `${fmtPct(bestRegular.pct)} (${bestRegular.year})` : '—'}</p>
            </div>
            <div className="border rounded p-3 border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">Best Playoff Record</p>
              <p className="text-lg font-bold">{bestPlayoff ? `${fmtPct(bestPlayoff.pct)} (${bestPlayoff.year})` : '—'}</p>
            </div>
            <div className="border rounded p-3 border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">Deepest Playoff Finish</p>
              <p className="text-lg font-bold">
                {deepestFinish ? `${deepestFinish.result} (${deepestFinishYears.join(', ')})` : '—'}
              </p>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-2 border-b pb-1">Season by Season (Varsity)</h2>
          <div className="overflow-x-auto mb-8">
            <table className="text-sm border-collapse w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Season</th>
                  <th className="pr-4">Div</th>
                  <th className="pr-4">Regular</th>
                  <th className="pr-4">Playoffs</th>
                  <th className="pr-4">Combined</th>
                  <th className="pr-4">Result</th>
                </tr>
              </thead>
              <tbody>
                {varsitySeasons.map((y) => (
                  <tr key={y.season_year} className="border-b border-gray-100 dark:border-gray-900">
                    <td className="py-1.5 pr-4">
                      <Link href={`/seasons/${y.season_year}`} className="underline">{y.season_year}</Link>
                    </td>
                    <td className="pr-4 text-gray-500 dark:text-gray-400">{y.division ?? ''}</td>
                    <td className="pr-4">{y.regular_wins}-{y.regular_losses}</td>
                    <td className="pr-4">{y.playoff_wins}-{y.playoff_losses}</td>
                    <td className="pr-4">{y.total_wins}-{y.total_losses}</td>
                    <td className="pr-4 text-gray-500 dark:text-gray-400">
                      {y.playoff_result || ''}{y.special_note ? ` (${y.special_note})` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {matrix && (
        <>
          <h2 className="text-lg font-semibold mb-1 border-b pb-1">Head-to-Head as Head Coach</h2>
          {matrix.noDetail ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Detailed opponent data unavailable.</p>
          ) : (
          <>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
            Record against every opponent faced as head coach. Win % is over all games.
          </p>
          {matrix.coverage && (
            <p className="text-sm bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded px-3 py-2 mb-3">
              Opponent records cover {matrix.coverage.span} only ({matrix.coverage.covered} of{' '}
              {matrix.coverage.total} seasons as head coach). Other seasons don&apos;t have game-by-game results, so the
              Total below is not a career record.
            </p>
          )}
          <div className="overflow-x-auto mb-8">
            <table className="text-sm border-collapse w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Opponent</th>
                  <th className="py-2 pr-4">Overall</th>
                  <th className="py-2 pr-4">Win %</th>
                  <th className="py-2 pr-4">Regular</th>
                  <th className="py-2 pr-4">Playoffs</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...matrix.rows,
                  {
                    opponent: matrix.coverage ? `Total (${matrix.coverage.span})` : 'Total',
                    ...matrix.totals,
                    isTotal: true,
                  },
                ].map((r) => (
                  <tr
                    key={r.opponent + (r.isTotal ? '-total' : '')}
                    className={`border-b border-gray-100 dark:border-gray-800 ${r.isTotal ? 'font-semibold' : ''}`}
                  >
                    <td className="py-1.5 pr-4">{r.opponent}</td>
                    <td className="py-1.5 pr-4">{r.rw + r.pw}-{r.rl + r.pl}</td>
                    <td className="py-1.5 pr-4">{fmtPct(winPct(r.rw + r.pw, r.rl + r.pl))}</td>
                    <td className="py-1.5 pr-4 text-gray-600 dark:text-gray-400">
                      {r.rw + r.rl > 0 ? `${r.rw}-${r.rl}` : '—'}
                    </td>
                    <td className="py-1.5 pr-4 text-gray-600 dark:text-gray-400">
                      {r.pw + r.pl > 0 ? `${r.pw}-${r.pl}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
          )}
        </>
      )}

      {roles.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-2 border-b pb-1">Roles Held</h2>
          <table className="text-sm w-full mb-8">
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 dark:border-gray-900">
                  <td className="py-1.5 pr-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">{r.season_year}</td>
                  <td className="py-1.5 pr-4 whitespace-nowrap">{r.team_level}</td>
                  <td className="py-1.5">{r.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {honors.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-2 border-b pb-1">Honors</h2>
          <div className="space-y-1 text-sm mb-8">
            {honors.map((h) => (
              <div key={h.id}>
                <span className="text-gray-500 dark:text-gray-400">{h.season_year}</span> — {h.honor_source}: {h.honor_label}
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="text-lg font-semibold mb-2 border-b pb-1">Bio</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {person.bio || 'No bio on file yet.'}
      </p>
    </main>
  );
}
