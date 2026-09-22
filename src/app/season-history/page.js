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
  const { rows } = await pool.query(
    `SELECT * FROM program_seasons ORDER BY season_year ASC`
  );

  return (
    <main className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-1">Season History</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Program record since 1990</p>

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
                <td className="pr-4 font-medium">{row.season_year}</td>
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
