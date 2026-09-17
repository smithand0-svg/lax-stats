import Link from 'next/link';
import { pool } from '@/lib/db';
import ViewToggle from '@/components/ViewToggle';
import { resolveView, gameTypeCondition } from '@/lib/viewFilter';

export const dynamic = 'force-dynamic';

// Team-level totals are computed by summing every player's stat line for
// a game — there's no separate "team stats" table. This only works for
// games with real per-game detail (2015+ live Hudl imports going
// forward); the pre-2015 season-summary data has no game-level rows to
// sum, so team stats necessarily start from whenever real games get
// imported rather than having any historical depth. That's a real,
// known gap — the original data never captured team-level scoring
// separately from individual player stats.
const TEAM_STAT_COLUMNS = [
  { key: 'goals', label: 'Points Scored' },
  { key: 'ground_balls', label: 'Ground Balls' },
  { key: 'caused_turnovers', label: 'Caused Turnovers' },
  { key: 'faceoff_wins', label: 'Faceoff Wins' },
  { key: 'saves', label: 'Saves' },
  { key: 'goals_against', label: 'Points Allowed' },
];

async function getTeamGameTotals(view) {
  const { rows } = await pool.query(
    `SELECT g.id, g.opponent, g.game_date, g.season_year, g.game_type,
            ${TEAM_STAT_COLUMNS.map((s) => `SUM(gsl.${s.key}) AS ${s.key}`).join(', ')}
     FROM games g
     JOIN game_stat_lines gsl ON gsl.game_id = g.id
     WHERE ${gameTypeCondition(view, 'g')}
     GROUP BY g.id, g.opponent, g.game_date, g.season_year, g.game_type`
  );
  return rows;
}

function rankBoard(rows, key) {
  const withValue = rows.map((r) => ({ ...r, value: Number(r[key]) })).filter((r) => r.value > 0);
  withValue.sort((a, b) => b.value - a.value);
  let rank = 0;
  let lastValue = null;
  withValue.forEach((r, i) => {
    if (r.value !== lastValue) {
      rank = i + 1;
      lastValue = r.value;
    }
    r.rnk = rank;
  });
  return withValue.filter((r) => r.rnk <= 10);
}

export default async function TeamStatsPage({ searchParams }) {
  const { view: rawView } = await searchParams;
  const view = resolveView(rawView);

  const gameRows = await getTeamGameTotals(view);

  // Season totals: sum every game's team total within a season_year.
  const bySeasonMap = {};
  gameRows.forEach((g) => {
    const key = g.season_year;
    if (!bySeasonMap[key]) {
      bySeasonMap[key] = { season_year: g.season_year };
      TEAM_STAT_COLUMNS.forEach((s) => (bySeasonMap[key][s.key] = 0));
    }
    TEAM_STAT_COLUMNS.forEach((s) => (bySeasonMap[key][s.key] += Number(g[s.key])));
  });
  const seasonRows = Object.values(bySeasonMap);

  const gameBoards = {};
  const seasonBoards = {};
  TEAM_STAT_COLUMNS.forEach((s) => {
    gameBoards[s.key] = rankBoard(gameRows, s.key);
    seasonBoards[s.key] = rankBoard(seasonRows, s.key);
  });

  const hasAnyData = gameRows.length > 0;

  return (
    <main className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-1">Team Stats</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        Computed from individual player stats in every game with per-game detail
      </p>
      <ViewToggle basePath="/team-stats" currentView={view} />

      {!hasAnyData && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-4 mb-8 text-sm">
          <p className="font-medium mb-1">No team-level data yet.</p>
          <p className="text-gray-600 dark:text-gray-400">
            Team stats are computed from real per-game data, which is only available for games imported through
            the live Hudl importer — this doesn&apos;t exist for historical seasons (that data only has player
            totals, not team totals, for older years). This page will fill in naturally as more games are
            imported going forward.
          </p>
        </div>
      )}

      <h2 className="text-xl font-bold mt-4 mb-4">Single Game</h2>
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {TEAM_STAT_COLUMNS.map((stat) => (
          <div key={stat.key}>
            <h3 className="text-lg font-semibold mb-2 border-b pb-1">{stat.label}</h3>
            <ol className="space-y-1 text-sm">
              {gameBoards[stat.key].map((g, idx, arr) => {
                const tiedCount = arr.filter((r) => r.rnk === g.rnk).length;
                const rankLabel = tiedCount > 1 ? `T-${g.rnk}` : String(g.rnk);
                return (
                  <li key={g.id} className="flex justify-between">
                    <span>
                      {rankLabel}. vs {g.opponent}{' '}
                      <span className="text-gray-400 dark:text-gray-500 text-xs">({g.season_year})</span>
                    </span>
                    <span className="font-medium">{g.value}</span>
                  </li>
                );
              })}
              {gameBoards[stat.key].length === 0 && <li className="text-gray-400">No data yet</li>}
            </ol>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-4">Single Season</h2>
      <div className="grid md:grid-cols-2 gap-8">
        {TEAM_STAT_COLUMNS.map((stat) => (
          <div key={stat.key}>
            <h3 className="text-lg font-semibold mb-2 border-b pb-1">{stat.label}</h3>
            <ol className="space-y-1 text-sm">
              {seasonBoards[stat.key].map((s, idx, arr) => {
                const tiedCount = arr.filter((r) => r.rnk === s.rnk).length;
                const rankLabel = tiedCount > 1 ? `T-${s.rnk}` : String(s.rnk);
                return (
                  <li key={s.season_year} className="flex justify-between">
                    <span>
                      {rankLabel}.{' '}
                      <Link href={`/seasons/${s.season_year}`} className="hover:underline">
                        {s.season_year}
                      </Link>
                    </span>
                    <span className="font-medium">{s.value}</span>
                  </li>
                );
              })}
              {seasonBoards[stat.key].length === 0 && <li className="text-gray-400">No data yet</li>}
            </ol>
          </div>
        ))}
      </div>
    </main>
  );
}
