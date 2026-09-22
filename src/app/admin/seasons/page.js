import { pool } from '@/lib/db';
import FinalizeButton from '@/components/FinalizeButton';
import { BASE_PATH } from '@/lib/basePath';

export const dynamic = 'force-dynamic';

async function getSeasons() {
  const { rows } = await pool.query(
    `SELECT season_year, head_coach, division, total_wins, total_losses, finalized_at
     FROM program_seasons
     WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
     ORDER BY season_year DESC`
  );
  return rows;
}

export default async function AdminSeasonsPage() {
  const seasons = await getSeasons();

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="flex justify-between items-start mb-1">
        <h1 className="text-2xl font-bold">Season Finalization</h1>
        <a href={`${BASE_PATH}/admin/import`} className="text-sm text-gray-500 dark:text-gray-400 underline">
          Import Game Stats
        </a>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Finalizing a season locks it against admin imports (both individual-stats and team-stats) for the whole
        season -- regular season and playoffs together. It does not change anything else on the site (coach
        tenure, current-season pointers, etc.). Reversible: unfinalize a season to make a correction, then
        re-finalize when you're done.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="pb-2 pr-4">Year</th>
            <th className="pb-2 pr-4">Coach</th>
            <th className="pb-2 pr-4">Record</th>
            <th className="pb-2 pr-4">Status</th>
            <th className="pb-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {seasons.map((s) => {
            const finalized = !!s.finalized_at;
            return (
              <tr key={s.season_year} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-4 font-medium">{s.season_year}</td>
                <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">{s.head_coach || '—'}</td>
                <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">
                  {s.total_wins}-{s.total_losses}
                </td>
                <td className="py-2 pr-4">
                  {finalized ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                      Finalized {new Date(s.finalized_at).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      Open
                    </span>
                  )}
                </td>
                <td className="py-2">
                  <FinalizeButton seasonYear={s.season_year} finalized={finalized} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
