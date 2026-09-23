import { pool } from '@/lib/db';
import FinalizeButton from '@/components/FinalizeButton';
import AdvanceSeasonButton from '@/components/AdvanceSeasonButton';
import { BASE_PATH } from '@/lib/basePath';
import { getUncountedGames } from '@/lib/gameResults';

export const dynamic = 'force-dynamic';

async function getSeasons() {
  const { rows } = await pool.query(
    `SELECT season_year, head_coach, division, total_wins, total_losses, finalized_at,
            playoff_result, special_note, brothers_cup, league_name, league_finish, auto_record, team_id
     FROM program_seasons
     WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
     ORDER BY season_year DESC`
  );
  return rows;
}

// TM-24: teams.current_season_year is the explicit pointer -- this is
// what Advance moves, and what TM-16's amber highlighting on Team Stats
// and the Leaderboard reads instead of inferring from live data.
async function getCurrentSeason() {
  const { rows } = await pool.query(
    `SELECT t.current_season_year, ps.head_coach, ps.division
     FROM teams t
     LEFT JOIN program_seasons ps ON ps.team_id = t.id AND ps.season_year = t.current_season_year
     WHERE t.slug = 'sjj'`
  );
  return rows[0] || { current_season_year: null, head_coach: null };
}

export default async function AdminSeasonsPage() {
  const [seasons, currentSeason] = await Promise.all([getSeasons(), getCurrentSeason()]);

  // TM-36: for seasons whose record is calculated from games, list any
  // game that currently counts as neither a win nor a loss (no score
  // yet, usually a missing team-totals import, or a tied score), so a
  // gap never silently shrinks the record.
  const uncounted = {};
  await Promise.all(
    seasons
      .filter((s) => s.auto_record)
      .map(async (s) => {
        uncounted[s.season_year] = await getUncountedGames(s.team_id, s.season_year);
      })
  );

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="flex justify-between items-start mb-1">
        <h1 className="text-2xl font-bold">Season Finalization</h1>
        <div className="flex items-center gap-4">
          <a href={`${BASE_PATH}/admin/import`} className="text-sm text-gray-500 dark:text-gray-400 underline">
            Import Game Stats
          </a>
          <a href={`${BASE_PATH}/admin/awards`} className="text-sm text-gray-500 dark:text-gray-400 underline">
            Season Awards
          </a>
          <a href={`${BASE_PATH}/admin/college-commitments`} className="text-sm text-gray-500 dark:text-gray-400 underline">
            College Commitments
          </a>
          <a href={`${BASE_PATH}/admin/staff`} className="text-sm text-gray-500 dark:text-gray-400 underline">
            Coaching Staff
          </a>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Finalizing a season locks it against admin imports (both individual-stats and team-stats) for the whole
        season -- regular season and playoffs together. It does not change anything else on the site (coach
        tenure, current-season pointers, etc.). Reversible: unfinalize a season to make a correction, then
        re-finalize when you're done.
      </p>

      <div className="border rounded p-4 mb-8 border-gray-200 dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {currentSeason.current_season_year !== null ? (
            <>
              Current season is <span className="font-medium">{currentSeason.current_season_year}</span>
              {currentSeason.head_coach ? <> ({currentSeason.head_coach})</> : ''}. Advancing credits{' '}
              {currentSeason.head_coach || 'the head coach'} another season (or records a coach change) and
              moves the amber &quot;in progress&quot; highlighting on Team Stats and the Leaderboard to the new
              year -- separate from Finalizing, and not date-gated.
            </>
          ) : (
            'No current season set.'
          )}
        </p>
        {currentSeason.current_season_year !== null && (
          <AdvanceSeasonButton
            currentYear={currentSeason.current_season_year}
            currentHeadCoach={currentSeason.head_coach}
            currentDivision={currentSeason.division}
          />
        )}
      </div>
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
                  <span
                    className="ml-2 text-xs text-gray-400"
                    title={s.auto_record ? 'Calculated from imported game results' : 'Hand-entered'}
                  >
                    {s.auto_record ? 'auto' : 'manual'}
                  </span>
                  {(uncounted[s.season_year] || []).length > 0 && (
                    <div className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      Not counted:{' '}
                      {uncounted[s.season_year]
                        .map((g) =>
                          `${g.opponent}${g.game_date ? ` (${new Date(g.game_date).toISOString().slice(5, 10)})` : ''}${
                            g.goals_for === null || g.goals_against === null ? ', no score' : `, tied ${g.goals_for}-${g.goals_against}`
                          }`
                        )
                        .join('; ')}
                    </div>
                  )}
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
                  <FinalizeButton
                    seasonYear={s.season_year}
                    finalized={finalized}
                    details={{
                      playoff_result: s.playoff_result,
                      special_note: s.special_note,
                      brothers_cup: s.brothers_cup,
                      league_finish: s.league_finish,
                    }}
                    hasLeague={!!s.league_name}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
