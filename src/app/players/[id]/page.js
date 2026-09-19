import { notFound } from 'next/navigation';
import { pool } from '@/lib/db';
import ViewToggle from '@/components/ViewToggle';
import { resolveView, gameTypeCondition } from '@/lib/viewFilter';

export const dynamic = 'force-dynamic';

const STAT_LABELS = [
  { key: 'goals', label: 'Goals' },
  { key: 'assists', label: 'Assists' },
  { key: 'points', label: 'Points' },
  { key: 'shots', label: 'Shots' },
  { key: 'shots_on_goal', label: 'Shots on Goal' },
  { key: 'ground_balls', label: 'Ground Balls' },
  { key: 'turnovers', label: 'Turnovers' },
  { key: 'caused_turnovers', label: 'Caused Turnovers' },
  { key: 'faceoff_wins', label: 'Faceoff Wins' },
  { key: 'faceoff_losses', label: 'Faceoff Losses' },
  { key: 'saves', label: 'Saves' },
  { key: 'goals_against', label: 'Goals Against' },
];

async function getPlayer(id) {
  const { rows } = await pool.query(
    `SELECT id, first_name, last_name, graduation_year, is_legacy FROM players WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function getCareerTotals(id, view) {
  const { rows } = await pool.query(
    `SELECT ${STAT_LABELS.map((s) => `SUM(${s.key}) AS ${s.key}`).join(', ')}
     FROM season_totals s WHERE player_id = $1 AND ${gameTypeCondition(view)}`,
    [id]
  );
  return rows[0];
}

async function getSeasonBreakdown(id, view) {
  const { rows } = await pool.query(
    `SELECT season_year, ${STAT_LABELS.map((s) => `SUM(${s.key}) AS ${s.key}`).join(', ')}
     FROM season_totals s WHERE player_id = $1 AND ${gameTypeCondition(view)}
     GROUP BY season_year
     HAVING ${STAT_LABELS.map((s) => `SUM(${s.key})`).join('+')} > 0
     ORDER BY season_year ASC NULLS FIRST`,
    [id]
  );
  return rows;
}

async function getHonors(id) {
  const { rows } = await pool.query(
    `SELECT * FROM player_honors WHERE player_id = $1 ORDER BY honor_year ASC NULLS LAST`,
    [id]
  );
  return rows;
}

const HONOR_LABELS = {
  college_commitment: 'College Commitment',
  all_american: 'All-American',
  academic_all_american: 'Academic All-American',
  collegiate_all_american: 'Collegiate All-American',
};

function formatHonor(h) {
  if (h.honor_type === 'college_commitment') {
    return `${h.honor_year} — ${h.position}, ${h.division} ${h.school}`;
  }
  if (h.honor_type === 'collegiate_all_american') {
    return `${h.honor_year} — ${h.position}, ${h.division} ${h.school}${h.note ? ` (${h.note})` : ''}`;
  }
  return h.position ? `${h.honor_year} — ${h.position}` : String(h.honor_year);
}

export default async function PlayerProfilePage({ params, searchParams }) {
  const { id } = await params;
  const { view: rawView } = await searchParams;
  const view = resolveView(rawView);

  const player = await getPlayer(id);
  if (!player) notFound();

  const honors = await getHonors(id);

  // Career totals under "combined" always determine which stat columns
  // are shown, so switching the toggle doesn't make columns jump around
  // (e.g. a faceoff specialist whose wins were all in the playoffs still
  // sees a Faceoff Wins column on Regular Season view — just showing 0).
  const combinedCareer = await getCareerTotals(id, 'combined');
  const relevantStats = STAT_LABELS.filter((s) => Number(combinedCareer[s.key]) > 0);

  const [career, seasons] =
    view === 'combined'
      ? [combinedCareer, await getSeasonBreakdown(id, view)]
      : await Promise.all([getCareerTotals(id, view), getSeasonBreakdown(id, view)]);

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold">
        {player.first_name} {player.last_name}
        {player.graduation_year ? ` '${String(player.graduation_year).slice(2)}` : ''}
      </h1>
      {player.is_legacy && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          This player&apos;s records were imported from historical program archives.
        </p>
      )}

      {honors.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {honors.map((h) => (
            <span
              key={h.id}
              className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-2 py-1 rounded"
              title={formatHonor(h)}
            >
              {h.honor_type === 'college_commitment'
                ? `College Commitment: ${h.school} (${h.honor_year})`
                : `${HONOR_LABELS[h.honor_type]} (${h.honor_year})`}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4">
        <ViewToggle basePath={`/players/${id}`} currentView={view} />
      </div>

      <h2 className="text-lg font-semibold mt-4 mb-2 border-b pb-1">Career Totals</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {relevantStats.map((s) => (
          <div key={s.key} className="border rounded p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
            <div className="text-xl font-semibold">{career[s.key] || 0}</div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-10 mb-2 border-b pb-1">Season by Season</h2>
      {seasons.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No {view} data recorded.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Season</th>
                {relevantStats.map((s) => (
                  <th key={s.key} className="pr-4">{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {seasons.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2 pr-4 font-medium">{row.season_year ?? 'Legacy'}</td>
                  {relevantStats.map((s) => (
                    <td key={s.key} className="pr-4">{row[s.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
