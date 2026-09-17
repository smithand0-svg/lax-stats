import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pool } from '@/lib/db';
import ViewToggle from '@/components/ViewToggle';
import { resolveView, gameTypeCondition } from '@/lib/viewFilter';

export const dynamic = 'force-dynamic';

const STAT_LABELS = [
  { key: 'goals', label: 'G' },
  { key: 'assists', label: 'A' },
  { key: 'points', label: 'Pts' },
  { key: 'ground_balls', label: 'GB' },
  { key: 'caused_turnovers', label: 'CT' },
  { key: 'faceoff_wins', label: 'FOW' },
  { key: 'saves', label: 'SV' },
];

export default async function SeasonPage({ params, searchParams }) {
  const { year } = await params;
  const { view: rawView } = await searchParams;
  const view = resolveView(rawView);
  const isLegacy = year === 'legacy';
  const seasonYear = isLegacy ? null : parseInt(year, 10);
  if (!isLegacy && !Number.isFinite(seasonYear)) notFound();

  // Whether this season EXISTS at all is independent of which toggle is
  // selected — a real season with no playoff games shouldn't 404 just
  // because the Playoff view has nothing to show for it.
  const { rows: existsCheck } = await pool.query(
    `SELECT 1 FROM season_totals WHERE season_year ${isLegacy ? 'IS NULL' : '= $1'} LIMIT 1`,
    isLegacy ? [] : [seasonYear]
  );
  if (existsCheck.length === 0) notFound();

  const { rows } = await pool.query(
    `SELECT p.id, p.first_name, p.last_name, p.graduation_year,
            ${STAT_LABELS.map((s) => `SUM(st.${s.key}) AS ${s.key}`).join(', ')}
     FROM season_totals st
     JOIN players p ON p.id = st.player_id
     WHERE st.season_year ${isLegacy ? 'IS NULL' : '= $1'} AND ${gameTypeCondition(view, 'st')}
     GROUP BY p.id, p.first_name, p.last_name, p.graduation_year
     HAVING ${STAT_LABELS.map((s) => `SUM(st.${s.key})`).join('+')} > 0
     ORDER BY points DESC`,
    isLegacy ? [] : [seasonYear]
  );

  return (
    <main className="max-w-4xl mx-auto p-8">
      <Link href="/seasons" className="text-sm text-gray-500 dark:text-gray-400 underline">
        ← All seasons
      </Link>
      <h1 className="text-3xl font-bold mt-2 mb-4">{isLegacy ? 'Legacy Records' : `${seasonYear} Season`}</h1>
      <ViewToggle basePath={`/seasons/${year}`} currentView={view} />

      {rows.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No {view} data recorded for this season.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Player</th>
                {STAT_LABELS.map((s) => (
                  <th key={s.key} className="pr-4">{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="py-2 pr-4">
                    <Link href={`/players/${row.id}`} className="text-slate-800 dark:text-slate-300 underline">
                      {row.first_name} {row.last_name}
                    </Link>
                  </td>
                  {STAT_LABELS.map((s) => (
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
