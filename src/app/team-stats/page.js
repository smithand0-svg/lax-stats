import Link from 'next/link';
import { pool } from '@/lib/db';
import { gameTypeCondition } from '@/lib/viewFilter';
import { matchOpponent } from '@/lib/opponentMatcher';

export const dynamic = 'force-dynamic';

// Team Stats intentionally tracks only the categories Andy curates by
// hand in his own "All Team Stats" / "Playoff Team Stats" sheets —
// Points, Goals, Assists, and Goals Against. Ground Balls, Caused
// Turnovers, Faceoff Wins, and Saves are tracked at the player level
// but NOT here, since there's no historical per-game depth for them
// at the team level (a future addition, not an oversight).
//
// Points isn't a stored column — it's derived (goals + assists) after
// the query, same convention as individual player stats. It's null on
// a given game whenever either component is null, same NULL-means-
// unknown handling as every other stat here.
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

// Minimum games played in a season for it to qualify for a Single
// Season or Single Season Average ranking, so one hot game (or a
// truncated/partial season) can't masquerade as a full-season record.
// Not specified on the source sheets (except one playoff footnote
// using the same number) — 2 is a reasonable starting default, easy
// to adjust. Applies to both totals and averages, live and static.
const MIN_GP_FOR_SEASON_BOARD = 2;

// Playoff round values are 64/32/16/8/4/2 (games remaining), 2 = championship.
// Named rounds match the labels already used elsewhere on the site (e.g.
// Season History's BC Notes column: Sweet 16, Elite 8, Final 4).
const ROUND_LABELS = {
  64: 'Round of 64',
  32: 'Round of 32',
  16: 'Sweet 16',
  8: 'Elite 8',
  4: 'Final 4',
  2: 'Championship',
};

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
      { opponent: 'Benedictine Cleveland', season_year: 2023, value: 34, date: '2023-05-16', round: 64 },
      { opponent: 'Benedictine Cleveland', season_year: 2022, value: 33, date: '2022-05-17', round: 64 },
      { opponent: 'Sylvania Southview', season_year: 2019, value: 25, date: '2019-05-13', round: 64 },
      { opponent: 'St Francis DeSales - Toledo', season_year: 2022, value: 23, date: '2022-05-23', round: 16 },
      { opponent: 'Benedictine Cleveland', season_year: 2021, value: 22, date: '2021-05-17', round: 64 },
      { opponent: 'Padua Franciscan', season_year: 2026, value: 22, date: '2026-05-20', round: 32 },
      { opponent: 'Holy Name', season_year: 2022, value: 21, date: '2022-05-20', round: 32 },
      { opponent: 'Holy Name', season_year: 2022, value: 21, date: '2022-05-20', round: 32 },
      { opponent: 'Rocky River', season_year: 2023, value: 19, date: '2023-05-19', round: 32 },
      { opponent: 'Ottawa Hills', season_year: 2025, value: 19, date: '2025-05-16', round: 64 },
    ],
    goals: [
      { opponent: 'Benedictine Cleveland', season_year: 2023, value: 20, date: '2023-05-16', round: 64 },
      { opponent: 'Benedictine Cleveland', season_year: 2022, value: 19, date: '2022-05-17', round: 64 },
      { opponent: 'Kent Roosevelt', season_year: 2004, value: 18, date: '2004-06-02', round: 4 },
      { opponent: 'Benedictine Cleveland', season_year: 2021, value: 17, date: '2021-05-17', round: 64 },
      { opponent: 'Sylvania Southview', season_year: 2019, value: 15, date: '2019-05-13', round: 64 },
      { opponent: 'St Francis DeSales - Toledo', season_year: 2022, value: 15, date: '2022-05-23', round: 16 },
      { opponent: 'Westerville North', season_year: 2009, value: 14, date: '2009-05-23', round: 64 },
      { opponent: 'Rocky River', season_year: 2023, value: 13, date: '2023-05-19', round: 32 },
      { opponent: 'Sylvania Northview', season_year: 2011, value: 13, date: '2011-05-19', round: 64 },
      { opponent: 'Perrysburg', season_year: 2005, value: 13, date: '2005-05-21', round: 64 },
    ],
    assists: [
      { opponent: 'Benedictine Cleveland', season_year: 2023, value: 14, date: '2023-05-16', round: 64 },
      { opponent: 'Benedictine Cleveland', season_year: 2022, value: 14, date: '2022-05-17', round: 64 },
      { opponent: 'Holy Name', season_year: 2022, value: 11, date: '2022-05-20', round: 32 },
      { opponent: 'Padua Franciscan', season_year: 2026, value: 11, date: '2026-05-20', round: 32 },
      { opponent: 'Sylvania Southview', season_year: 2019, value: 10, date: '2019-05-13', round: 64 },
      { opponent: 'Westlake OH', season_year: 2019, value: 10, date: '2019-05-16', round: 32 },
      { opponent: 'St Francis DeSales - Toledo', season_year: 2022, value: 8, date: '2022-05-23', round: 16 },
      { opponent: 'St Francis DeSales - Toledo', season_year: 2026, value: 8, date: '2026-05-25', round: 64 },
      { opponent: 'Sylvania Southview', season_year: 2024, value: 7, date: '2024-05-16', round: 64 },
      { opponent: 'Walsh Jesuit', season_year: 2023, value: 7, date: '2023-05-22', round: 16 },
      { opponent: 'Ottawa Hills', season_year: 2022, value: 7, date: '2022-05-26', round: 8 },
      { opponent: 'Perrysburg', season_year: 2016, value: 7, date: '2016-05-19', round: 32 },
      { opponent: 'Ottawa Hills', season_year: 2025, value: 7, date: '2025-05-16', round: 64 },
    ],
    goals_against: [
      { opponent: 'Benedictine Cleveland', season_year: 2023, value: 0, date: '2023-05-16', round: 64 },
      { opponent: 'Walsh Jesuit', season_year: 2023, value: 0, date: '2023-05-22', round: 16 },
      { opponent: 'Sylvania Southview', season_year: 2019, value: 1, date: '2019-05-13', round: 64 },
      { opponent: 'Benedictine Cleveland', season_year: 2021, value: 1, date: '2021-05-17', round: 64 },
      { opponent: 'Rocky River', season_year: 2024, value: 1, date: '2024-05-28', round: 16 },
      { opponent: 'Benedictine Cleveland', season_year: 2022, value: 2, date: '2022-05-17', round: 64 },
      { opponent: 'Holy Name', season_year: 2022, value: 3, date: '2022-05-20', round: 32 },
      { opponent: 'Perrysburg', season_year: 2015, value: 3, date: '2015-05-23', round: 64 },
      { opponent: 'Brunswick', season_year: 2012, value: 3, date: '2012-05-17', round: 64 },
      { opponent: 'Rocky River', season_year: 2023, value: 4, date: '2023-05-19', round: 32 },
    ],
  },
};

const STATIC_SEASON_RECORDS = {
  combined: {
    points: [
      { season_year: 2022, value: 419, gp: 23 },
      { season_year: 2024, value: 356, gp: 22 },
      { season_year: 2019, value: 351, gp: 18 },
      { season_year: 2021, value: 329, gp: 17 },
      { season_year: 2025, value: 324, gp: 19 },
      { season_year: 2026, value: 323, gp: 19 },
      { season_year: 2023, value: 319, gp: 20 },
      { season_year: 2018, value: 306, gp: 20 },
      { season_year: 2016, value: 304, gp: 19 },
      { season_year: 2015, value: 285, gp: 18 },
    ],
    goals: [
      { season_year: 2022, value: 249, gp: 23 },
      { season_year: 2009, value: 231, gp: 22 },
      { season_year: 2019, value: 229, gp: 18 },
      { season_year: 2005, value: 218, gp: 22 },
      { season_year: 2007, value: 213, gp: 21 },
      { season_year: 2015, value: 213, gp: 18 },
      { season_year: 2024, value: 211, gp: 22 },
      { season_year: 2006, value: 201, gp: 19 },
      { season_year: 2021, value: 201, gp: 17 },
      { season_year: 2016, value: 196, gp: 19 },
    ],
    assists: [
      { season_year: 2022, value: 170, gp: 23 },
      { season_year: 2024, value: 145, gp: 22 },
      { season_year: 2025, value: 136, gp: 19 },
      { season_year: 2026, value: 129, gp: 19 },
      { season_year: 2021, value: 128, gp: 17 },
      { season_year: 2023, value: 124, gp: 20 },
      { season_year: 2019, value: 122, gp: 18 },
      { season_year: 2018, value: 118, gp: 20 },
      { season_year: 2016, value: 108, gp: 19 },
      { season_year: 2015, value: 89, gp: 18 },
    ],
    goals_against: [
      { season_year: 2004, value: 82, gp: 17 },
      { season_year: 2023, value: 111, gp: 20 },
      { season_year: 2025, value: 113, gp: 19 },
      { season_year: 2002, value: 127, gp: 16 },
      { season_year: 2008, value: 131, gp: 20 },
      { season_year: 2013, value: 134, gp: 17 },
      { season_year: 2005, value: 135, gp: 22 },
      { season_year: 2016, value: 136, gp: 19 },
      { season_year: 2021, value: 136, gp: 17 },
      { season_year: 2003, value: 136, gp: 14 },
    ],
  },
  playoff: {
    points: [
      { season_year: 2022, value: 102, gp: 5 },
      { season_year: 2023, value: 77, gp: 4 },
      { season_year: 2019, value: 64, gp: 3 },
      { season_year: 2024, value: 62, gp: 5 },
      { season_year: 2004, value: 46, gp: 4 },
      { season_year: 2021, value: 46, gp: 3 },
      { season_year: 2026, value: 46, gp: 3 },
      { season_year: 2025, value: 29, gp: 2 },
      { season_year: 2016, value: 27, gp: 2 },
      { season_year: 2009, value: 26, gp: 2 },
      { season_year: 2015, value: 26, gp: 2 },
    ],
    goals: [
      { season_year: 2022, value: 58, gp: 5 },
      { season_year: 2023, value: 47, gp: 4 },
      { season_year: 2004, value: 46, gp: 4 },
      { season_year: 2024, value: 42, gp: 6 },
      { season_year: 2019, value: 39, gp: 3 },
      { season_year: 2021, value: 33, gp: 3 },
      { season_year: 2009, value: 26, gp: 2 },
      { season_year: 2005, value: 25, gp: 3 },
      { season_year: 2026, value: 25, gp: 3 },
      { season_year: 2010, value: 23, gp: 2 },
    ],
    assists: [
      { season_year: 2022, value: 44, gp: 5 },
      { season_year: 2023, value: 30, gp: 4 },
      { season_year: 2024, value: 26, gp: 6 },
      { season_year: 2019, value: 25, gp: 3 },
      { season_year: 2026, value: 21, gp: 3 },
      { season_year: 2021, value: 13, gp: 3 },
      { season_year: 2016, value: 11, gp: 2 },
      { season_year: 2025, value: 11, gp: 2 },
      { season_year: 2015, value: 9, gp: 2 },
      { season_year: 2018, value: 7, gp: 2 },
    ],
    goals_against: [
      { season_year: 2023, value: 9, gp: 4 },
      { season_year: 2011, value: 13, gp: 2 },
      { season_year: 2021, value: 15, gp: 3 },
      { season_year: 2015, value: 17, gp: 2 },
      { season_year: 2010, value: 18, gp: 2 },
      { season_year: 2013, value: 18, gp: 2 },
      { season_year: 2018, value: 18, gp: 2 },
      { season_year: 2025, value: 18, gp: 2 },
      { season_year: 2005, value: 19, gp: 3 },
      { season_year: 2019, value: 19, gp: 3 },
    ],
  },
};

// Season Average records: { season_year, avg, total, gp } — mirrors
// the sheet's full column set (Year | Avg | raw season total | GP).
// avg is the authoritative value straight from the sheet (not
// recomputed from total/gp, since the sheet's own rounding is what
// Andy expects to see).
const STATIC_SEASON_AVG_RECORDS = {
  combined: {
    points: [
      { season_year: 2019, avg: 19.5, total: 351, gp: 18 },
      { season_year: 2021, avg: 19.35, total: 329, gp: 17 },
      { season_year: 2022, avg: 18.22, total: 419, gp: 23 },
      { season_year: 2025, avg: 17.05, total: 324, gp: 19 },
      { season_year: 2026, avg: 17.0, total: 323, gp: 19 },
      { season_year: 2024, avg: 16.18, total: 356, gp: 22 },
      { season_year: 2016, avg: 16.0, total: 304, gp: 19 },
      { season_year: 2023, avg: 15.95, total: 319, gp: 20 },
      { season_year: 2015, avg: 15.83, total: 285, gp: 18 },
      { season_year: 2018, avg: 15.3, total: 306, gp: 20 },
    ],
    goals: [
      { season_year: 2019, avg: 12.72, total: 229, gp: 18 },
      { season_year: 2015, avg: 11.83, total: 213, gp: 18 },
      { season_year: 2021, avg: 11.82, total: 201, gp: 17 },
      { season_year: 2004, avg: 10.94, total: 186, gp: 17 },
      { season_year: 2022, avg: 10.83, total: 249, gp: 23 },
      { season_year: 2006, avg: 10.58, total: 201, gp: 19 },
      { season_year: 2009, avg: 10.5, total: 231, gp: 22 },
      { season_year: 2016, avg: 10.32, total: 196, gp: 19 },
      { season_year: 2026, avg: 10.21, total: 194, gp: 19 },
      { season_year: 2007, avg: 10.14, total: 213, gp: 21 },
    ],
    assists: [
      { season_year: 2021, avg: 7.53, total: 128, gp: 17 },
      { season_year: 2022, avg: 7.39, total: 170, gp: 23 },
      { season_year: 2025, avg: 7.16, total: 136, gp: 19 },
      { season_year: 2026, avg: 6.79, total: 129, gp: 19 },
      { season_year: 2019, avg: 6.78, total: 122, gp: 18 },
      { season_year: 2024, avg: 6.59, total: 145, gp: 22 },
      { season_year: 2023, avg: 6.2, total: 124, gp: 20 },
      { season_year: 2018, avg: 5.9, total: 118, gp: 20 },
      { season_year: 2016, avg: 5.68, total: 108, gp: 19 },
      { season_year: 2015, avg: 4.94, total: 89, gp: 18 },
      { season_year: 2013, avg: 4.53, total: 77, gp: 17 },
    ],
    goals_against: [
      { season_year: 2004, avg: 5.41, total: 92, gp: 17 },
      { season_year: 2023, avg: 5.55, total: 111, gp: 20 },
      { season_year: 2025, avg: 5.95, total: 113, gp: 19 },
      { season_year: 2005, avg: 6.14, total: 135, gp: 22 },
      { season_year: 2008, avg: 6.55, total: 131, gp: 20 },
      { season_year: 2022, avg: 6.87, total: 158, gp: 23 },
      { season_year: 2016, avg: 7.16, total: 136, gp: 19 },
      { season_year: 2026, avg: 7.47, total: 142, gp: 19 },
      { season_year: 2019, avg: 7.72, total: 139, gp: 18 },
      { season_year: 2013, avg: 7.88, total: 134, gp: 17 },
    ],
  },
  playoff: {
    points: [
      { season_year: 2019, avg: 21.333, total: 64, gp: 3 },
      { season_year: 2022, avg: 20.4, total: 102, gp: 5 },
      { season_year: 2023, avg: 19.25, total: 77, gp: 4 },
      { season_year: 2021, avg: 15.333, total: 46, gp: 3 },
      { season_year: 2026, avg: 15.333, total: 46, gp: 3 },
      { season_year: 2025, avg: 14.5, total: 29, gp: 2 },
      { season_year: 2016, avg: 13.5, total: 27, gp: 2 },
      { season_year: 2009, avg: 13.0, total: 26, gp: 2 },
      { season_year: 2015, avg: 13.0, total: 26, gp: 2 },
      { season_year: 2024, avg: 12.4, total: 62, gp: 5 },
    ],
    goals: [
      { season_year: 2009, avg: 13.0, total: 26, gp: 2 },
      { season_year: 2019, avg: 13.0, total: 39, gp: 3 },
      { season_year: 2023, avg: 11.75, total: 47, gp: 4 },
      { season_year: 2022, avg: 11.6, total: 58, gp: 5 },
      { season_year: 2010, avg: 11.5, total: 23, gp: 2 },
      { season_year: 2004, avg: 11.5, total: 46, gp: 4 },
      { season_year: 2021, avg: 11.0, total: 33, gp: 3 },
      { season_year: 2025, avg: 9.0, total: 18, gp: 2 },
      { season_year: 2015, avg: 8.5, total: 17, gp: 2 },
    ],
    assists: [
      { season_year: 2022, avg: 8.8, total: 44, gp: 5 },
      { season_year: 2019, avg: 8.333, total: 25, gp: 3 },
      { season_year: 2023, avg: 7.5, total: 30, gp: 4 },
      { season_year: 2026, avg: 7.0, total: 21, gp: 3 },
      { season_year: 2016, avg: 5.5, total: 11, gp: 2 },
      { season_year: 2025, avg: 5.5, total: 11, gp: 2 },
      { season_year: 2015, avg: 4.5, total: 9, gp: 2 },
      { season_year: 2024, avg: 4.333, total: 24, gp: 6 },
      { season_year: 2021, avg: 4.333, total: 13, gp: 3 },
      { season_year: 2018, avg: 3.5, total: 7, gp: 2 },
    ],
    goals_against: [
      { season_year: 2023, avg: 2.25, total: 9, gp: 4 },
      { season_year: 2021, avg: 5.0, total: 15, gp: 3 },
      { season_year: 2005, avg: 6.333, total: 19, gp: 3 },
      { season_year: 2019, avg: 6.333, total: 19, gp: 3 },
      { season_year: 2011, avg: 6.5, total: 13, gp: 2 },
      { season_year: 2024, avg: 6.5, total: 39, gp: 6 },
      { season_year: 2003, avg: 7.0, total: 7, gp: 1 },
      { season_year: 2008, avg: 7.0, total: 7, gp: 1 },
      { season_year: 2026, avg: 7.0, total: 21, gp: 3 },
      { season_year: 2004, avg: 7.25, total: 29, gp: 4 },
    ],
  },
};

// team_game_stats is 1:1 with games (one row per game, already team-level
// totals) — no more summing player stat lines. Every stat column there is
// nullable on purpose (NULL = "not tracked for this game", distinct from
// a real 0), which matters a lot for the sparse 2002-2019 historical rows:
// goals_against is reliably present, but assists is frequently NULL. We
// keep that distinction all the way through instead of coercing to 0,
// which would silently understate — or fabricate a false shutout/zero
// record for — a game or season that was never actually tracked for that
// stat.
async function getTeamGameTotals(view) {
  const { rows } = await pool.query(
    `SELECT g.id, g.opponent, g.game_date, g.season_year, g.game_type, g.round,
            tgs.goals, tgs.assists, tgs.goals_against
     FROM games g
     JOIN team_game_stats tgs ON tgs.game_id = g.id
     WHERE ${gameTypeCondition(view, 'g')}`
  );
  return rows.map((r) => {
    const goals = r.goals === null ? null : Number(r.goals);
    const assists = r.assists === null ? null : Number(r.assists);
    const goals_against = r.goals_against === null ? null : Number(r.goals_against);
    return {
      ...r,
      goals,
      assists,
      goals_against,
      points: goals !== null && assists !== null ? goals + assists : null,
    };
  });
}

// Bug found Sep 19 (post-TM-16 fix): the same real opponent is often
// spelled differently between the old static/curated arrays and the
// live database's canonical opponent name (e.g. "Sylvania Northview"
// vs "Northview", "Toledo Central Catholic" vs "Central Catholic").
// mergeGameStatic used to compare opponent names as raw strings, so
// it couldn't recognize these as the same game -- both sides would
// show up as separate top-10 entries. This had always been true of
// the data; it only became visible once the earlier year-wholesale
// bug (which was deleting the static side outright) got fixed.
// Resolving both sides through the same opponents/opponent_aliases
// lookup the admin import picker already uses fixes it at the root.
async function getOpponentLookup() {
  const { rows: opponents } = await pool.query(
    `SELECT o.id, o.name FROM opponents o JOIN teams t ON t.id = o.team_id WHERE t.slug = 'sjj'`
  );
  const { rows: aliases } = await pool.query(
    `SELECT oa.opponent_id AS "opponentId", oa.alias_name AS "aliasName"
     FROM opponent_aliases oa
     JOIN opponents o ON o.id = oa.opponent_id
     JOIN teams t ON t.id = o.team_id
     WHERE t.slug = 'sjj'`
  );
  return { opponents, aliases };
}

function makeCanonicalizer({ opponents, aliases }) {
  const cache = new Map();
  return (name) => {
    if (!name) return name;
    if (cache.has(name)) return cache.get(name);
    // No match (a genuinely one-off historical opponent never run
    // through the picker) falls back to the name as given -- safe,
    // just means it won't dedupe against anything, same as today.
    const canonical = matchOpponent(name, opponents, aliases).canonicalName;
    cache.set(name, canonical);
    return canonical;
  };
}

function rankBoard(rows, key) {
  const fewerIsBetter = FEWER_IS_BETTER.has(key);
  const withValue = rows
    .filter((r) => r[key] !== null && r[key] !== undefined)
    .map((r) => ({ ...r, value: Number(r[key]) }))
    .filter((r) => (fewerIsBetter ? r.value >= 0 : r.value > 0));
  withValue.sort((a, b) => {
    const diff = fewerIsBetter ? a.value - b.value : b.value - a.value;
    // Oldest season first when tied, matching the Leaderboard's own
    // tie-break convention. Rows with no season_year (shouldn't happen
    // in practice) sort last within their tie group.
    return diff !== 0 ? diff : (a.season_year ?? Infinity) - (b.season_year ?? Infinity);
  });
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

function mergeGameStatic(liveRows, staticRows, key, canonicalize) {
  const notCoveredByLive = (staticRows || []).filter((r) => {
    const staticCanonical = canonicalize(r.opponent);
    // Only drop a static record when a live row demonstrably covers
    // it: same opponent (resolved to canonical identity, not raw
    // string -- see getOpponentLookup/makeCanonicalizer above), same
    // season, and a value that equals or exceeds the static one. A
    // live row simply existing for that YEAR is not enough -- that
    // was the original bug: it silently dropped historical records
    // the moment ANY live data existed for their year, whether or
    // not it actually captured that specific game.
    const covered = liveRows.some(
      (live) =>
        live.season_year === r.season_year &&
        canonicalize(live.opponent) === staticCanonical &&
        live[key] !== null &&
        live[key] !== undefined &&
        Number(live[key]) >= r.value
    );
    return !covered;
  });

  // Two static records can ALSO be the same real game under two
  // spellings that were never linked in opponents/opponent_aliases
  // (e.g. "Central Catholic" and "Toledo Central Catholic" both hand-
  // entered for the same 2015/2016 game). The check above only ever
  // compares static-vs-live, so a pair like that would both survive
  // and double up on the board even after this filter. Collapse the
  // remaining static rows by canonical opponent + season here too,
  // keeping the higher value when they don't agree (a same-game
  // duplicate should read as one record, not two close ones).
  const bestByCanonicalKey = new Map();
  notCoveredByLive.forEach((r) => {
    const dedupeKey = `${r.season_year}::${canonicalize(r.opponent)}`;
    const existing = bestByCanonicalKey.get(dedupeKey);
    if (!existing || r.value > existing.value) {
      bestByCanonicalKey.set(dedupeKey, r);
    }
  });

  const extra = [...bestByCanonicalKey.values()].map((r, i) => ({
    id: `static-game-${key}-${i}`,
    opponent: canonicalize(r.opponent),
    season_year: r.season_year,
    game_date: r.date || null,
    round: r.round ?? null,
    [key]: r.value,
    isStatic: true,
  }));
  return [...liveRows, ...extra];
}

function mergeSeasonStatic(liveRows, staticRows, key) {
  const liveYears = new Set(liveRows.map((r) => r.season_year));
  const extra = (staticRows || [])
    .filter((r) => !liveYears.has(r.season_year) && r.gp >= MIN_GP_FOR_SEASON_BOARD)
    .map((r) => ({ season_year: r.season_year, gp: r.gp, [key]: r.value, isStatic: true }));
  return [...liveRows.filter((r) => r.gp >= MIN_GP_FOR_SEASON_BOARD), ...extra];
}

// Average boards use a differently-shaped static source (avg + the
// raw season total + gp, mirroring the sheet's own columns), and both
// live and static entries are filtered by MIN_GP_FOR_SEASON_BOARD first.
function mergeSeasonAverageStatic(liveAvgRows, staticRows, key) {
  const liveYears = new Set(liveAvgRows.map((r) => r.season_year));
  const extra = (staticRows || [])
    .filter((r) => !liveYears.has(r.season_year) && r.gp >= MIN_GP_FOR_SEASON_BOARD)
    .map((r) => ({
      season_year: r.season_year,
      total: r.total,
      gp: r.gp,
      [key]: r.avg,
      isStatic: true,
    }));
  return [...liveAvgRows.filter((r) => r.gp >= MIN_GP_FOR_SEASON_BOARD), ...extra];
}

export default async function TeamStatsPage({ searchParams }) {
  const { view: rawView } = await searchParams;
  const view = resolveTeamStatsView(rawView);

  const [gameRows, opponentLookup] = await Promise.all([getTeamGameTotals(view), getOpponentLookup()]);
  const canonicalize = makeCanonicalizer(opponentLookup);
  const staticGame = STATIC_GAME_RECORDS[view] || {};
  const staticSeason = STATIC_SEASON_RECORDS[view] || {};
  const staticSeasonAvg = STATIC_SEASON_AVG_RECORDS[view] || {};

  // Season totals + games-played count, from live per-game rows. Tracked
  // per-stat: each season also records how many of its games actually had
  // a non-null value for that stat, so a season summed from partial data
  // (e.g. a 2000s season where only some games have assists recorded)
  // never poses as a complete total — it falls back to the curated static
  // record for that stat instead, the same as a season with no live rows
  // at all.
  const bySeasonMap = {};
  gameRows.forEach((g) => {
    const key = g.season_year;
    if (!bySeasonMap[key]) {
      bySeasonMap[key] = { season_year: g.season_year, gp: 0 };
      DISPLAY_STATS.forEach((s) => {
        bySeasonMap[key][s.key] = 0;
        bySeasonMap[key][`${s.key}__knownGp`] = 0;
      });
    }
    bySeasonMap[key].gp += 1;
    DISPLAY_STATS.forEach((s) => {
      const v = g[s.key];
      if (v !== null && v !== undefined) {
        bySeasonMap[key][s.key] += Number(v);
        bySeasonMap[key][`${s.key}__knownGp`] += 1;
      }
    });
  });
  const seasonRows = Object.values(bySeasonMap);

  const gameBoards = {};
  const seasonBoards = {};
  const seasonAvgBoards = {};
  DISPLAY_STATS.forEach((s) => {
    const gameRowsForStat = gameRows.filter((g) => g[s.key] !== null && g[s.key] !== undefined);
    gameBoards[s.key] = rankBoard(mergeGameStatic(gameRowsForStat, staticGame[s.key], s.key, canonicalize), s.key);

    const completeSeasonRows = seasonRows.filter((r) => r[`${s.key}__knownGp`] === r.gp);
    seasonBoards[s.key] = rankBoard(mergeSeasonStatic(completeSeasonRows, staticSeason[s.key], s.key), s.key);

    const liveAvgRows = completeSeasonRows.map((r) => ({
      season_year: r.season_year,
      gp: r.gp,
      total: r[s.key],
      [s.key]: r.gp > 0 ? r[s.key] / r.gp : 0,
    }));
    seasonAvgBoards[s.key] = rankBoard(
      mergeSeasonAverageStatic(liveAvgRows, staticSeasonAvg[s.key], s.key),
      s.key
    );
  });

  const hasAnyLiveData = gameRows.length > 0;
  const hasAnyStaticData = Object.values(staticGame).some((a) => a && a.length > 0);

  // "Current season" for highlighting purposes: the most recent season
  // year with any live game data for this view. There's no explicit
  // finalize/advance mechanism yet (TM-17/TM-24), so this is a
  // heuristic -- once those exist, this should read whatever they mark
  // as the current, not-yet-finalized season instead of inferring it.
  const currentSeasonYear = hasAnyLiveData ? Math.max(...gameRows.map((g) => g.season_year)) : null;
  const isCurrentSeason = (year) => currentSeasonYear !== null && year === currentSeasonYear;
  const CURRENT_SEASON_CLASS = 'bg-amber-100 dark:bg-amber-700/60 -mx-1 px-1 rounded';

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
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          Historical records shown alongside live data as they&apos;re tracked; the current season&apos;s
          in-progress totals are included and may lead a category before the season is complete.
        </p>
      )}

      {currentSeasonYear !== null && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">
          <span className={`${CURRENT_SEASON_CLASS} font-medium`}>Highlighted</span> entries are from the{' '}
          {currentSeasonYear} season, still in progress — rankings there may shift as the season continues.
        </p>
      )}

      <h2 className="text-xl font-bold mt-4 mb-4">Single Game</h2>
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {DISPLAY_STATS.filter((stat) => !(view === 'combined' && stat.key === 'goals_against')).map((stat) => (
          <div key={stat.key}>
            <h3 className="text-lg font-semibold mb-2 border-b pb-1">{stat.label}</h3>
            <ol className="space-y-1 text-sm">
              {gameBoards[stat.key].map((g, idx, arr) => {
                const tiedCount = arr.filter((r) => r.rnk === g.rnk).length;
                const rankLabel = tiedCount > 1 ? `T-${g.rnk}` : String(g.rnk);
                return (
                  <li key={g.id} className={`flex justify-between ${isCurrentSeason(g.season_year) ? CURRENT_SEASON_CLASS : ''}`}>
                    <span>
                      {rankLabel}. vs {g.opponent}{' '}
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        ({g.season_year}
                        {view === 'playoff' && g.round ? `, ${ROUND_LABELS[g.round] || `Round of ${g.round}`}` : ''})
                      </span>
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

      <h2 className="text-xl font-bold mb-1">Single Season</h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        Minimum {MIN_GP_FOR_SEASON_BOARD} games played to qualify
      </p>
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {DISPLAY_STATS.map((stat) => (
          <div key={stat.key}>
            <h3 className="text-lg font-semibold mb-2 border-b pb-1">{stat.label}</h3>
            <ol className="space-y-1 text-sm">
              {seasonBoards[stat.key].map((s, idx, arr) => {
                const tiedCount = arr.filter((r) => r.rnk === s.rnk).length;
                const rankLabel = tiedCount > 1 ? `T-${s.rnk}` : String(s.rnk);
                return (
                  <li key={s.season_year} className={`flex justify-between ${isCurrentSeason(s.season_year) ? CURRENT_SEASON_CLASS : ''}`}>
                    <span>
                      {rankLabel}.{' '}
                      <Link href={`/seasons/${s.season_year}`} replace className="hover:underline">
                        {s.season_year}
                      </Link>{' '}
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        {s.gp != null ? `(${s.gp} GP)` : ''}
                      </span>
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
        Minimum {MIN_GP_FOR_SEASON_BOARD} games played to qualify
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
                  <li key={s.season_year} className={`flex justify-between ${isCurrentSeason(s.season_year) ? CURRENT_SEASON_CLASS : ''}`}>
                    <span>
                      {rankLabel}.{' '}
                      <Link href={`/seasons/${s.season_year}`} replace className="hover:underline">
                        {s.season_year}
                      </Link>{' '}
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        ({s.total} total, {s.gp} GP)
                      </span>
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
