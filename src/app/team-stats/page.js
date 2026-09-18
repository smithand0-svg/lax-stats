import Link from 'next/link';
import { pool } from '@/lib/db';
import { gameTypeCondition } from '@/lib/viewFilter';

export const dynamic = 'force-dynamic';

// Team Stats intentionally tracks only the categories Andy curates by
// hand in his own "All Team Stats" / "Playoff Team Stats" sheets —
// Points, Goals, Assists, and Goals Against. Ground Balls, Caused
// Turnovers, Faceoff Wins, and Saves are tracked at the player level
// but NOT here, since there's no historical per-game depth for them
// at the team level (a future addition, not an oversight).
//
// Points isn't a stored column at the game-line level — it's derived
// (goals + assists) after the query, same convention as individual
// player stats.
const SQL_STAT_KEYS = ['goals', 'assists', 'goals_against'];

const DISPLAY_STATS = [
  { key: 'points', label: 'Points' },
  { key: 'goals', label: 'Goals' },
  { key: 'assists', label: 'Assists' },
  { key: 'goals_against', label: 'Goals Against' },
];

// Goals Against is the one stat where a LOWER number is the better
// record (fewest goals allowed), so it ranks ascending everywhere else
// ranks descending.
const FEWER_IS_BETTER = new Set(['goals_against']);

// This page has its own two-option selector rather than the shared
// three-way Combined/Regular/Playoff toggle used elsewhere. Andy's two
// source sheets are "All Team Stats" (every game, regular season AND
// playoffs together — the "World Record") and "Playoff Team Stats"
// (playoff games only — the "Olympic Record"). There's no separate
// regular-season-only historical record kept, so 'regular' isn't
// offered as an option here.
const TEAM_STATS_VIEWS = [
  { key: 'combined', label: 'All Games' },
  { key: 'playoff', label: 'Playoffs Only' },
];

function resolveTeamStatsView(rawView) {
  return rawView === 'playoff' ? 'playoff' : 'combined';
}

// Minimum games played in a season for it to qualify for a Season
// Average ranking, so one hot game early in a season can't masquerade
// as a per-game average record. Not specified on the source sheets
// (except one playoff footnote using the same number) — 2 is a
// reasonable starting default, easy to adjust.
const MIN_GP_FOR_AVERAGE = 2;

// --- Static historical baselines, transcribed from the source sheets ---
// Any season_year here that also appears in the live-computed data is
// dropped automatically (see mergeSeasonStatic/mergeGameStatic below) —
// so as real game data accumulates for the current season, it replaces
// the manually-tracked placeholder rather than duplicating it.
const STATIC_GAME_RECORDS = {
  combined: {
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
    goals_against: [], // no per-game record kept on the "All Team Stats" sheet
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
  combined: {
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

// Season Average records: { season_year, avg, gp } — avg is the
// authoritative value straight from the sheet (not recomputed from
// total/gp, since the sheet's own rounding is what Andy expects to see).
const STATIC_SEASON_AVG_RECORDS = {
  combined: {
    points: [
      { season_year: 2019, avg: 19.5, gp: 18 },
      { season_year: 2021, avg: 19.35, gp: 17 },
      { season_year: 2022, avg: 18.22, gp: 23 },
      { season_year: 2025, avg: 17.05, gp: 19 },
      { season_year: 2026, avg: 17.0, gp: 19 },
      { season_year: 2024, avg: 16.18, gp: 22 },
      { season_year: 2016, avg: 16.0, gp: 19 },
      { season_year: 2023, avg: 15.95, gp: 20 },
      { season_year: 2015, avg: 15.83, gp: 18 },
      { season_year: 2018, avg: 15.3, gp: 20 },
    ],
    goals: [
      { season_year: 2019, avg: 12.72, gp: 18 },
      { season_year: 2015, avg: 11.83, gp: 18 },
      { season_year: 2021, avg: 11.82, gp: 17 },
      { season_year: 2004, avg: 10.94, gp: 17 },
      { season_year: 2022, avg: 10.83, gp: 23 },
      { season_year: 2006, avg: 10.58, gp: 19 },
      { season_year: 2009, avg: 10.5, gp: 22 },
      { season_year: 2016, avg: 10.32, gp: 19 },
      { season_year: 2026, avg: 10.21, gp: 19 },
      { season_year: 2007, avg: 10.14, gp: 21 },
    ],
    assists: [
      { season_year: 2021, avg: 7.53, gp: 17 },
      { season_year: 2022, avg: 7.39, gp: 23 },
      { season_year: 2025, avg: 7.16, gp: 19 },
      { season_year: 2026, avg: 6.79, gp: 19 },
      { season_year: 2019, avg: 6.78, gp: 18 },
      { season_year: 2024, avg: 6.59, gp: 22 },
      { season_year: 2023, avg: 6.2, gp: 20 },
      { season_year: 2018, avg: 5.9, gp: 20 },
      { season_year: 2016, avg: 5.68, gp: 19 },
      { season_year: 2015, avg: 4.94, gp: 18 },
      { season_year: 2013, avg: 4.53, gp: 17 },
    ],
    goals_against: [
      { season_year: 2004, avg: 5.41, gp: 17 },
      { season_year: 2023, avg: 5.55, gp: 20 },
      { season_year: 2025, avg: 5.95, gp: 19 },
      { season_year: 2005, avg: 6.14, gp: 22 },
      { season_year: 2008, avg: 6.55, gp: 20 },
      { season_year: 2022, avg: 6.87, gp: 23 },
      { season_year: 2016, avg: 7.16, gp: 19 },
      { season_year: 2026, avg: 7.47, gp: 19 },
      { season_year: 2019, avg: 7.72, gp: 18 },
      { season_year: 2013, avg: 7.88, gp: 17 },
    ],
  },
  playoff: {
    points: [
      { season_year: 2019, avg: 21.333, gp: 3 },
      { season_year: 2022, avg: 20.4, gp: 5 },
      { season_year: 2023, avg: 19.25, gp: 4 },
      { season_year: 2021, avg: 15.333, gp: 3 },
      { season_year: 2026, avg: 15.333, gp: 3 },
      { season_year: 2025, avg: 14.5, gp: 2 },
      { season_year: 2016, avg: 13.5, gp: 2 },
      { season_year: 2009, avg: 13.0, gp: 2 },
      { season_year: 2015, avg: 13.0, gp: 2 },
      { season_year: 2024, avg: 12.4, gp: 5 },
    ],
    goals: [
      { season_year: 2009, avg: 13.0, gp: 2 },
      { season_year: 2019, avg: 13.0, gp: 3 },
      { season_year: 2023, avg: 11.75, gp: 4 },
      { season_year: 2022, avg: 11.6, gp: 5 },
      { season_year: 2010, avg: 11.5, gp: 2 },
      { season_year: 2004, avg: 11.5, gp: 4 },
      { season_year: 2021, avg: 11.0, gp: 3 },
      { season_year: 2025, avg: 9.0, gp: 2 },
      { season_year: 2015, avg: 8.5, gp: 2 },
    ],
    assists: [
      { season_year: 2022, avg: 8.8, gp: 5 },
      { season_year: 2019, avg: 8.333, gp: 3 },
      { season_year: 2023, avg: 7.5, gp: 4 },
      { season_year: 2026, avg: 7.0, gp: 3 },
      { season_year: 2016, avg: 5.5, gp: 2 },
      { season_year: 2025, avg: 5.5, gp: 2 },
      { season_year: 2015, avg: 4.5, gp: 2 },
      { season_year: 2024, avg: 4.333, gp: 6 },
      { season_year: 2021, avg: 4.333, gp: 3 },
      { season_year: 2018, avg: 3.5, gp: 2 },
    ],
    goals_against: [
      { season_year: 2023, avg: 2.25, gp: 4 },
      { season_year: 2021, avg: 5.0, gp: 3 },
      { season_year: 2005, avg: 6.333, gp: 3 },
      { season_year: 2019, avg: 6.333, gp: 3 },
      { season_year: 2011, avg: 6.5, gp: 2 },
      { season_year: 2024, avg: 6.5, gp: 6 },
      { season_year: 2003, avg: 7.0, gp: 1 },
      { season_year: 2008, avg: 7.0, gp: 1 },
      { season_year: 2026, avg: 7.0, gp: 3 },
      { season_year: 2004, avg: 7.25, gp: 4 },
    ],
  },
};

async function getTeamGameTotals(view) {
  const { rows } = await pool.query(
    `SELECT g.id, g.opponent, g.game_date, g.season_year, g.game_type,
            ${SQL_STAT_KEYS.map((k) => `SUM(gsl.${k}) AS ${k}`).join(', ')}
     FROM games g
     JOIN game_stat_lines gsl ON gsl.game_id = g.id
     WHERE ${gameTypeCondition(view, 'g')}
     GROUP BY g.id, g.opponent, g.game_date, g.season_year, g.game_type`
  );
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

// Average boards use a differently-shaped static source (avg + gp
// directly, not a raw total), and both live and static entries are
// filtered by MIN_GP_FOR_AVERAGE before ranking.
function mergeSeasonAverageStatic(liveAvgRows, staticRows, key) {
  const liveYears = new Set(liveAvgRows.map((r) => r.season_year));
  const extra = (staticRows || [])
    .filter((r) => !liveYears.has(r.season_year) && r.gp >= MIN_GP_FOR_AVERAGE)
    .map((r) => ({ season_year: r.season_year, [key]: r.avg, gp: r.gp, isStatic: true }));
  return [...liveAvgRows.filter((r) => r.gp >= MIN_GP_FOR_AVERAGE), ...extra];
}

export default async function TeamStatsPage({ searchParams }) {
  const { view: rawView } = await searchParams;
  const view = resolveTeamStatsView(rawView);

  const gameRows = await getTeamGameTotals(view);
  const staticGame = STATIC_GAME_RECORDS[view] || {};
  const staticSeason = STATIC_SEASON_RECORDS[view] || {};
  const staticSeasonAvg = STATIC_SEASON_AVG_RECORDS[view] || {};

  // Season totals + games-played count, from live per-game rows.
  const bySeasonMap = {};
  gameRows.forEach((g) => {
    const key = g.season_year;
    if (!bySeasonMap[key]) {
      bySeasonMap[key] = { season_year: g.season_year, gp: 0 };
      DISPLAY_STATS.forEach((s) => (bySeasonMap[key][s.key] = 0));
    }
    bySeasonMap[key].gp += 1;
    DISPLAY_STATS.forEach((s) => (bySeasonMap[key][s.key] += Number(g[s.key] || 0)));
  });
  const seasonRows = Object.values(bySeasonMap);

  const gameBoards = {};
  const seasonBoards = {};
  const seasonAvgBoards = {};
  DISPLAY_STATS.forEach((s) => {
    gameBoards[s.key] = rankBoard(mergeGameStatic(gameRows, staticGame[s.key], s.key), s.key);
    seasonBoards[s.key] = rankBoard(mergeSeasonStatic(seasonRows, staticSeason[s.key], s.key), s.key);

    const liveAvgRows = seasonRows.map((r) => ({
      season_year: r.season_year,
      gp: r.gp,
      [s.key]: r.gp > 0 ? r[s.key] / r.gp : 0,
    }));
    seasonAvgBoards[s.key] = rankBoard(
      mergeSeasonAverageStatic(liveAvgRows, staticSeasonAvg[s.key], s.key),
      s.key
    );
  });

  const hasAnyLiveData = gameRows.length > 0;
  const hasAnyStaticData = Object.values(staticGame).some((a) => a && a.length > 0);

  return (
    <main className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-1">Team Stats</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        Live game data combined with historical program records
      </p>

      <div className="flex gap-2 mb-1">
        {TEAM_STATS_VIEWS.map((v) => (
          <Link
            key={v.key}
            href={`/team-stats?view=${v.key}`}
            replace
            className={
              view === v.key
                ? 'text-sm px-3 py-1 rounded bg-slate-800 text-white'
                : 'text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
            }
          >
            {v.label}
          </Link>
        ))}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
        {view === 'combined'
          ? 'Every game, regular season and playoffs together.'
          : 'Playoff games only — a separate record book from the all-games mark above.'}
      </p>

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
      <div className="grid md:grid-cols-2 gap-8 mb-12">
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

      <h2 className="text-xl font-bold mb-1">Single Season Average</h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        Minimum {MIN_GP_FOR_AVERAGE} games played to qualify
      </p>
      <div className="grid md:grid-cols-2 gap-8">
        {DISPLAY_STATS.map((stat) => (
          <div key={stat.key}>
            <h3 className="text-lg font-semibold mb-2 border-b pb-1">{stat.label}</h3>
            <ol className="space-y-1 text-sm">
              {seasonAvgBoards[stat.key].map((s, idx, arr) => {
                const tiedCount = arr.filter((r) => r.rnk === s.rnk).length;
                const rankLabel = tiedCount > 1 ? `T-${s.rnk}` : String(s.rnk);
                return (
                  <li key={s.season_year} className="flex justify-between">
                    <span>
                      {rankLabel}.{' '}
                      <Link href={`/seasons/${s.season_year}`} replace className="hover:underline">
                        {s.season_year}
                      </Link>{' '}
                      <span className="text-gray-400 dark:text-gray-500 text-xs">({s.gp} GP)</span>
                    </span>
                    <span className="font-medium">{s.value.toFixed(2)}</span>
                  </li>
                );
              })}
              {seasonAvgBoards[stat.key].length === 0 && <li className="text-gray-400">No data yet</li>}
            </ol>
          </div>
        ))}
      </div>
    </main>
  );
}
