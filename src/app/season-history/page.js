import Link from 'next/link';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

// TM-24: "Team #" is a pure display formula, no stored column needed --
// season_year - 1989, verified against Andy's own numbers (1990 = Team
// 1, 2027 = Team 38).
const FIRST_SEASON_YEAR = 1990;
function teamNumber(seasonYear) {
  return seasonYear - (FIRST_SEASON_YEAR - 1);
}

export default async function SeasonHistoryPage() {
  const [{ rows }, { rows: statYears }] = await Promise.all([
    pool.query(`SELECT * FROM program_seasons ORDER BY season_year ASC`),
    // TM-29: years that have a season stats page (/seasons/[year]), so
    // Year by Year can link each one. Years with no player stats on
    // record stay plain text rather than linking to an empty page.
    pool.query(`SELECT DISTINCT season_year FROM season_totals WHERE season_year IS NOT NULL`),
  ]);
  const hasStats = new Set(statYears.map((r) => Number(r.season_year)));

  return (
    <main className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-1">Year by Year</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Program record since 1990. Select a year to see that season&apos;s player stats.</p>

      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Team #</th>
              <th className="pr-4">Year</th>
              <th className="pr-4">Head Coach</th>
              <th className="pr-4">Div</th>
              <th className="pr-4">Regular</th>
              <th className="pr-4">League</th>
              <th className="pr-4">Playoffs</th>
              <th className="pr-4">Total</th>
              <th className="pr-4">Brothers Cup</th>
              <th className="pr-4">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.season_year} className="border-b">
                <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">{teamNumber(row.season_year)}</td>
                <td className="pr-4 font-medium">
                  {hasStats.has(Number(row.season_year)) ? (
                    <Link href={`/seasons/${row.season_year}`} className="underline decoration-sjj-gold decoration-2 underline-offset-4">
                      {row.season_year}
                    </Link>
                  ) : (
                    row.season_year
                  )}
                </td>
                <td className="pr-4">{row.head_coach || '—'}</td>
                <td className="pr-4">{row.division ?? '—'}</td>
                <td className="pr-4">
                  {row.regular_wins}-{row.regular_losses}
                </td>
                <td className="pr-4">
                  {row.league_name
                    ? `${row.league_name}${
                        row.league_wins !== null ? ` ${row.league_wins}-${row.league_losses}` : ''
                      }${row.league_finish ? ` (${row.league_finish})` : ''}`
                    : '—'}
                </td>
                <td className="pr-4">
                  {row.playoff_wins}-{row.playoff_losses}
                  {row.playoff_result ? ` (${row.playoff_result})` : ''}
                </td>
                <td className="pr-4 font-medium">
                  {row.total_wins}-{row.total_losses}
                </td>
                <td className="pr-4">{row.brothers_cup || '—'}</td>
                <td className="pr-4 text-gray-500 dark:text-gray-400">{row.special_note || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
