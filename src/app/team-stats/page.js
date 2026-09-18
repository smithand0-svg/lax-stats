import Link from 'next/link';
import { pool } from '@/lib/db';
import ViewToggle from '@/components/ViewToggle';
import { resolveView, gameTypeCondition } from '@/lib/viewFilter';

export const dynamic = 'force-dynamic';

// Team-level game/season totals are computed by summing every player's
// stat line for a game — there's no separate "team stats" table. This
// only works for games with real per-game detail (2015+ live Hudl
// imports going forward); the pre-2015 season-summary data has no
// game-level rows to sum. To fill that historical gap, curated
// records transcribed from Andy's own "All Team Stats" / "Playoff
// Team Stats" tracking sheets are merged in below as static baselines.
//
// These are real columns summed directly via SQL.
const SQL_STAT_KEYS = [
  'goals',
  'assists',
  'ground_balls',
  'caused_turnovers',
  'faceoff_wins',
  'saves',
  'goals_against',
];

// Points isn't a stored column at the game-line level — it's derived
// (goals + assists) after the query, same convention as individual
// player stats. This is the full list of what's actually displayed,
// in display order.
const DISPLAY_STATS = [
  { key: 'points', label: 'Points' },
  { key: 'goals', label: 'Goals' },
  { key: 'assists', label: 'Assists' },
  { key: 'ground_balls', label: 'Ground Balls' },
  { key: 'caused_turnovers', label: 'Caused Turnovers' },
  { key: 'faceoff_wins', label: 'Faceoff Wins' },
  { key: 'saves', label: 'Saves' },
  { key: 'goals_against', label: 'Goals Against' },
];

// --- Static historical baselines, transcribed from the source sheets ---
// Only Points / Goals / Assists / Goals Against have curated historical
// entries; Ground Balls, Caused Turnovers, Faceoff Wins, and Saves are
// live-only for now (no historical tracking exists for those at the
// team level).
//
// Any season_year here that also appears in the live-computed data is
// dropped automatically (see mergeSeasonStatic/mergeGameStatic below) —
// so as real game data accumulates for the current season, it replaces
// the manually-tracked placeholder rather than duplicating it.
const STATIC_GAME_RECORDS = {
  regular: {
    points: [
      { opponent: 'Ottawa Hills', season_year: 2026, value: 37 },
      { opponent: 'Sylvania Northview', season_year: 2026, value: 37 },
      { opponent: 'Gahanna Lincoln', season_year: 2021, value: 36 },
      { opponent: 'Anthony Wayne', season_year: 2023, value: 36 },
      { opponent: 'De La Salle Collegiate', season_year: 2024, value: 36 },
      { opponent: 'Bowling Green', season_year: 2025, value: 36 },
      { opponent: 'U of D Jesuit', season_year: 2025, value: 36 },
      { opponent: 'Benedictine', season_year: 2023, value: 34 },
      { opponent: 'Benedictine', season_year: 2022, value: 33 },
      { opponent: 'Stow Monroe', season_year: 2015, value: 31 },
      { opponent: 'Central Catholic', season_year: 2016, value: 31 },
    ],
    goals: [
      { opponent: 'Ottawa Hills', season_year: 2026, value: 24 },
      { opponent: 'Central Catholic', season_year: 2015, value: 23 },
      { opponent: 'De La Salle Collegiate', season_year: 2024, value: 22 },
      { opponent: 'Bowling Green', season_year: 2019, value: 21 },
      { opponent: 'Gahanna Lincoln', season_year: 2021, value: 21 },
      { opponent: 'U of D Jesuit', season_year: 2025, value: 21 },
      { opponent: 'Central Catholic', season_year: 2016, value: 20 },
      { opponent: 'Benedictine', season_year: 2023, value: 20 },
      { opponent: 'Bowling Green', season_year: 2025, value: 20 },
      { opponent: 'Northview', season_year: 2026, value: 20 },
    ],
    assists: [
      { opponent: 'Anthony Wayne', season_year: 2023, value: 17 },
      { opponent: 'Sylvania Northview', season_year: 2026, value: 17 },
      { opponent: 'Bowling Green', season_year: 2025, value: 16 },
      { opponent: 'Gahanna Lincoln', season_year: 2021, value: 15 },
      { opponent: 'U of D Jesuit', season_year: 2025, value: 15 },
      { opponent: 'Benedictine', season_year: 2022, value: 14 },
      { opponent: 'Benedictine', season_year: 2023, value: 14 },
      { opponent: 'De La Salle Collegiate', season_year: 2024, value: 14 },
      { opponent: 'Southview', season_year: 2021, value: 13 },
      { opponent: 'Revere', season_year: 2024, value: 13 },
      { opponent: 'Westlake', season_year: 2024, value: 13 },
    ],
    goals_against: [], // no per-game record tracked for regular season
  },
  playoff: {
    points: [
      { opponent: 'Benedictine Cleveland', season_year: 2023, value: 34 },
      { opponent: 'Benedictine Cleveland', season_year: 2022, value: 33 },
      { opponent: 'Sylvania Southview', season_year: 2019, value: 25 },
      { opponent: 'St Francis DeSales - Toledo', season_year: 2022, value: 23 },
      { opponent: 'Benedictine Cleveland', season_year: 2021, value: 22 },
      { opponent: 'Padua Franciscan', season_year: 2026, value: 22 },
      { opponent: 'Holy Name', season_year: 2022, value: 21 },
      { opponent: 'Holy Name', season_year: 2022, value: 21 },
      { opponent: 'Rocky River', season_year: 2023, value: 19 },
      { opponent: 'Ottawa Hills', season_year: 2025, value: 19 },
    ],
    goals: [
      { opponent: 'Benedictine Cleveland', season_year: 2023, value: 20 },
      { opponent: 'Benedictine Cleveland', season_year: 2022, value: 19 },
      { opponent: 'Kent Roosevelt', season_year: 2004, value: 18 },
      { opponent: 'Benedictine Cleveland', season_year: 2021, value: 17 },
      { opponent: 'Sylvania Southview', season_year: 2019, value: 15 },
      { opponent: 'St Francis DeSales - Toledo', season_year: 2022, value: 15 },
      { opponent: 'Westerville North', season_year: 2009, value: 14 },
      { opponent: 'Rocky River', season_year: 2023, value: 13 },
      { opponent: 'Sylvania Northview', season_year: 2011, value: 13 },
      { opponent: 'Perrysburg', season_year: 2005, value: 13 },
    ],
    assists: [
      { opponent: 'Benedictine Cleveland', season_year: 2023, value: 14 },
      { opponent: 'Benedictine Cleveland', season_year: 2022, value: 14 },
      { opponent: 'Holy Name', season_year: 2022, value: 11 },
      { opponent: 'Padua Franciscan', season_year: 2026, value: 11 },
      { opponent: 'Sylvania Southview', season_year: 2019, value: 10 },
      { opponent: 'Westlake OH', season_year: 2019, value: 10 },
      { opponent: 'St Francis DeSales - Toledo', season_year: 2022, value: 8 },
      { opponent: 'St Francis DeSales - Toledo', season_year: 2026, value: 8 },
      { opponent: 'Sylvania Southview', season_year: 2024, value: 7 },
      { opponent: 'Walsh Jesuit', season_year: 2023, value: 7 },
      { opponent: 'Ottawa Hills', season_year: 2022, value: 7 },
      { opponent: 'Perrysburg', season_year: 2016, value: 7 },
      { opponent: 'Ottawa Hills', season_year: 2025, value: 7 },
    ],
    goals_against: [
      { opponent: 'Benedictine Cleveland', season_year: 2023, value: 0 },
      { opponent: 'Walsh Jesuit', season_year: 2023, value: 0 },
      { opponent: 'Sylvania Southview', season_year: 2019, value: 1 },
      { opponent: 'Benedictine Cleveland', season_year: 2021, value: 1 },
      { opponent: 'Rocky River', season_year: 2024, value: 1 },
      { opponent: 'Benedictine Cleveland', season_year: 2022, value: 2 },
      { opponent: 'Holy Name', season_year: 2022, value: 3 },
      { opponent: 'Perrysburg', season_year: 2015, value: 3 },
      { opponent: 'Brunswick', season_year: 2012, value: 3 },
      { opponent: 'Rocky River', season_year: 2023, value: 4 },
    ],
  },
};

const STATIC_SEASON_RECORDS = {
  regular: {
    points: [
      { season_year: 2022, value: 419 },
      { season_year: 2024, value: 356 },
      { season_year: 2019, value: 351 },
      { season_year: 2021, value: 329 },
      { season_year: 2025, value: 324 },
      { season_year: 2026, value: 323 },
      { season_year: 2023, value: 319 },
      { season_year: 2018, value: 306 },
      { season_year: 2016, value: 304 },
      { season_year: 2015, value: 285 },
    ],
    goals: [
      { season_year: 2022, value: 249 },
      { season_year: 2009, value: 231 },
      { season_year: 2019, value: 229 },
      { season_year: 2005, value: 218 },
      { season_year: 2007, value: 213 },
      { season_year: 2015, value: 213 },
      { season_year: 2024, value: 211 },
      { season_year: 2006, value: 201 },
      { season_year: 2021, value: 201 },
      { season_year: 2016, value: 196 },
    ],
    assists: [
      { season_year: 2022, value: 170 },
      { season_year: 2024, value: 145 },
      { season_year: 2025, value: 136 },
      { season_year: 2026, value: 129 },
      { season_year: 2021, value: 128 },
      { season_year: 2023, value: 124 },
      { season_year: 2019, value: 122 },
      { season_year: 2018, value: 118 },
      { season_year: 2016, value: 108 },
      { season_year: 2015, value: 89 },
    ],
    // Goals Against is a "fewer is better" record — see FEWER_IS_BETTER below.
    goals_against: [
      { season_year: 2004, value: 82 },
      { season_year: 2023, value: 111 },
      { season_year: 2025, value: 113 },
      { season_year: 2002, value: 127 },
      { season_year: 2008, value: 131 },
      { season_year: 2013, value: 134 },
      { season_year: 2005, value: 135 },
      { season_year: 2016, value: 136 },
      { season_year: 2021, value: 136 },
      { season_year: 2003, value: 136 },
    ],
  },
  playoff: {
    points: [
      { season_year: 2022, value: 102 },
      { season_year: 2023, value: 77 },
      { season_year: 2019, value: 64 },
      { season_year: 2024, value: 62 },
      { season_year: 2004, value: 46 },
      { season_year: 2021, value: 46 },
      { season_year: 2026, value: 46 },
      { season_year: 2025, value: 29 },
      { season_year: 2016, value: 27 },
      { season_year: 2009, value: 26 },
      { season_year: 2015, value: 26 },
    ],
    goals: [
      { season_year: 2022, value: 58 },
      { season_year: 2023, value: 47 },
      { season_year: 2004, value: 46 },
      { season_year: 2024, value: 42 },
      { season_year: 2019, value: 39 },
      { season_year: 2021, value: 33 },
      { season_year: 2009, value: 26 },
      { season_year: 2005, value: 25 },
      { season_year: 2026, value: 25 },
      { season_year: 2010, value: 23 },
    ],
    assists: [
      { season_year: 2022, value: 44 },
      { season_year: 2023, value: 30 },
      { season_year: 2024, value: 26 },
      { season_year: 2019, value: 25 },
      { season_year: 2026, value: 21 },
      { season_year: 2021, value: 13 },
      { season_year: 2016, value: 11 },
      { season_year: 2025, value: 11 },
      { season_year: 2015, value: 9 },
      { season_year: 2018, value: 7 },
    ],
    goals_against: [
      { season_year: 2023, value: 9 },
      { season_year: 2011, value: 13 },
      { season_year: 2021, value: 15 },
      { season_year: 2015, value: 17 },
      { season_year: 2010, value: 18 },
      { season_year: 2013, value: 18 },
      { season_year: 2018, value: 18 },
      { season_year: 2025, value: 18 },
      { season_year: 2005, value: 19 },
      { season_year: 2019, value: 19 },
    ],
  },
};

// Goals Against is the one stat where a LOWER number is the better
// record (fewest goals allowed), so it ranks in ascending order.
const FEWER_IS_BETTER = new Set(['goals_against']);

async function getTeamGameTotals(view) {
  const { rows } = await pool.query(
    `SELECT g.id, g.opponent, g.game_date, g.season_year, g.game_type,
            ${SQL_STAT_KEYS.map((k) => `SUM(gsl.${k}) AS ${k}`).join(', ')}
     FROM games g
     JOIN game_stat_lines gsl ON gsl.game_id = g.id
     WHERE ${gameTypeCondition(view, 'g')}
     GROUP BY g.id, g.opponent, g.game_date, g.season_year, g.game_type`
  );
  // Points isn't a stored column — derive it here, same as the
  // individual player stat convention.
  return rows.map((r) => ({ ...r, points: Number(r.goals) + Number(r.assists) }));
}

function rankBoard(rows, key) {
  const fewerIsBetter = FEWER_IS_BETTER.has(key);
  const withValue = rows
    .map((r) => ({ ...r, value: Number(r[key]) }))
    .filter((r) => (fewerIsBetter ? r.value >= 0 : r.value > 0));
  withValue.sort((a, b) => (fewerIsBetter ? a.value - b.value : b.value - a.value));
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

// Merges live rows with static historical rows for one stat, dropping
// any static entry whose season_year is already covered by live data
// (so the current in-progress season's real number takes over from
// the manually-tracked placeholder instead of duplicating it).
function mergeGameStatic(liveRows, staticRows, key) {
  const liveYears = new Set(liveRows.map((r) => r.season_year));
  const extra = (staticRows || [])
    .filter((r) => !liveYears.has(r.season_year))
    .map((r, i) => ({
      id: `static-game-${key}-${i}`,
      opponent: r.opponent,
      season_year: r.season_year,
      [key]: r.value,
      isStatic: true,
    }));
  return [...liveRows, ...extra];
}

function mergeSeasonStatic(liveRows, staticRows, key) {
  const liveYears = new Set(liveRows.map((r) => r.season_year));
  const extra = (staticRows || [])
    .filter((r) => !liveYears.has(r.season_year))
    .map((r) => ({ season_year: r.season_year, [key]: r.value, isStatic: true }));
  return [...liveRows, ...extra];
}

export default async function TeamStatsPage({ searchParams }) {
  const { view: rawView } = await searchParams;
  const view = resolveView(rawView);

  const gameRows = await getTeamGameTotals(view);
  const staticGame = STATIC_GAME_RECORDS[view] || {};
  const staticSeason = STATIC_SEASON_RECORDS[view] || {};

  // Season totals: sum every game's team total within a season_year.
  const bySeasonMap = {};
  gameRows.forEach((g) => {
    const key = g.season_year;
    if (!bySeasonMap[key]) {
      bySeasonMap[key] = { season_year: g.season_year };
      DISPLAY_STATS.forEach((s) => (bySeasonMap[key][s.key] = 0));
    }
    DISPLAY_STATS.forEach((s) => (bySeasonMap[key][s.key] += Number(g[s.key] || 0)));
  });
  const seasonRows = Object.values(bySeasonMap);

  const gameBoards = {};
  const seasonBoards = {};
  DISPLAY_STATS.forEach((s) => {
    gameBoards[s.key] = rankBoard(mergeGameStatic(gameRows, staticGame[s.key], s.key), s.key);
    seasonBoards[s.key] = rankBoard(mergeSeasonStatic(seasonRows, staticSeason[s.key], s.key), s.key);
  });

  const hasAnyLiveData = gameRows.length > 0;
  const hasAnyStaticData = Object.values(staticGame).some((a) => a && a.length > 0) ||
    Object.values(staticSeason).some((a) => a && a.length > 0);

  return (
    <main className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-1">Team Stats</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        Live game data combined with historical program records
      </p>
      <ViewToggle basePath="/team-stats" currentView={view} />

      {!hasAnyLiveData && !hasAnyStaticData && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-4 mb-8 text-sm">
          <p className="font-medium mb-1">No team-level data yet.</p>
          <p className="text-gray-600 dark:text-gray-400">
            Team stats are computed from real per-game data, which is only available for games imported through
            the live Hudl importer. This page will fill in naturally as more games are imported going forward.
          </p>
        </div>
      )}

      {hasAnyLiveData && hasAnyStaticData && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">
          Historical records shown alongside live data as they&apos;re tracked; the current season&apos;s
          in-progress totals are included and may lead a category before the season is complete.
        </p>
      )}

      <h2 className="text-xl font-bold mt-4 mb-4">Single Game</h2>
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {DISPLAY_STATS.map((stat) => (
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
        {DISPLAY_STATS.map((stat) => (
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
                      <Link href={`/seasons/${s.season_year}`} replace className="hover:underline">
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
