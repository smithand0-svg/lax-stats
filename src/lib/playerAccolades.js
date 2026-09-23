// TM-32: "Accolades" on a player profile -- where this player CURRENTLY
// ranks on the real Leaderboard boards, across every view (Combined /
// Regular / Playoff) and every scope (Single Game / Season / Career).
//
// Deliberately NOT a second ranking system: every rank here comes from the
// exact same board builders the public Leaderboard page uses
// (src/lib/leaderboardData.js), just read deeper for Season and Career.
// That way a player's profile can never disagree with the Leaderboard
// about where he stands.
//
// Depth, per Andy (2026-09-23):
//   - Single Game: top 10, the same cutoff the public Leaderboard shows.
//   - Season and Career: top 25, so a player just outside the public
//     top 10 still sees his 11th-25th place standing on his own page.
import { pool } from '@/lib/db';
import { getOpponentLookup, makeCanonicalizer } from '@/lib/opponentLookup';
import { getPlayerLookup, makePlayerResolver } from '@/lib/playerLookup';
import {
  STAT_COLUMNS,
  RATE_STATS,
  getCareerBoards,
  getSeasonBoards,
  getGameBoards,
  getCurrentSeasonYear,
  roundSuffix,
  rateExtraText,
} from '@/lib/leaderboardData';

export const ACCOLADE_VIEWS = [
  { key: 'combined', label: 'All Games' },
  { key: 'regular', label: 'Regular Season' },
  { key: 'playoff', label: 'Playoffs' },
];

export const ACCOLADE_TIERS = [
  { key: 'game', label: 'Single Game', limit: 10 },
  { key: 'season', label: 'Season', limit: 25 },
  { key: 'career', label: 'Career', limit: 25 },
];

// Same tie-break the Leaderboard page applies at render time, used here
// only to order one player's own multiple entries on the same board
// (e.g. three different 8-assist games): playoff before regular, then
// oldest first.
function entryOrder(a, b) {
  const typeRank = (e) => (e.gameType === 'playoff' ? 0 : 1);
  return (
    a.rank - b.rank ||
    typeRank(a) - typeRank(b) ||
    Number(a.seasonYear || 0) - Number(b.seasonYear || 0) ||
    (a.gameDate || '9999-99-99').localeCompare(b.gameDate || '9999-99-99')
  );
}

function contextFor(scope, row) {
  if (scope === 'career') return null;
  if (scope === 'season') return String(row.season_year);
  return `vs ${row.opponent}, ${row.season_year}${roundSuffix(row)}`;
}

function collectEntries(scope, playerId, boards, rateBoards, currentSeasonYear, activeThisSeason) {
  const pid = String(playerId);
  // An unresolved static row carries a synthetic string id
  // ("static-...") that can never equal a real players.id, so it is
  // excluded naturally -- no guessed attribution.
  const isThisPlayer = (r) => String(r.player_id ?? r.id) === pid;
  const isCurrent = (r) =>
    currentSeasonYear !== null &&
    (scope === 'career' ? activeThisSeason : Number(r.season_year) === currentSeasonYear);

  const entries = [];
  const add = (stat, board, formatValue, extra) => {
    (board || []).forEach((r) => {
      if (!isThisPlayer(r)) return;
      const tied = board.filter((o) => o.rnk === r.rnk).length > 1;
      entries.push({
        statKey: stat.key,
        statLabel: stat.label,
        rank: r.rnk,
        rankLabel: tied ? `T-${r.rnk}` : String(r.rnk),
        value: formatValue(r),
        context: contextFor(scope, r),
        extra: extra ? extra(r) : null,
        seasonYear: r.season_year ?? null,
        gameDate: r.game_date ?? null,
        gameType: r.game_type ?? null,
        isCurrent: isCurrent(r),
      });
    });
  };

  STAT_COLUMNS.forEach((stat) => add(stat, boards[stat.key], (r) => String(r.value)));
  RATE_STATS.forEach((stat) =>
    add(
      stat,
      rateBoards[stat.key],
      (r) => `${Number(r.value).toFixed(1)}%`,
      (r) => rateExtraText(stat, r)
    )
  );

  // Keep the Leaderboard's stat order (Goals, Assists, Points, ... then
  // the rate stats), and within one stat order by rank.
  const statOrder = [...STAT_COLUMNS, ...RATE_STATS].map((s) => s.key);
  entries.sort((a, b) => statOrder.indexOf(a.statKey) - statOrder.indexOf(b.statKey) || entryOrder(a, b));
  return entries;
}

// Returns [{ view, label, tiers: [{ scope, label, limit, entries }] }],
// with empty tiers and empty views already dropped, so a player with no
// ranked performances gets an empty array and the section simply
// doesn't render.
export async function getPlayerAccolades(playerId) {
  const [opponentLookup, playerLookup, currentSeasonYear, activeRes] = await Promise.all([
    getOpponentLookup(),
    getPlayerLookup(),
    getCurrentSeasonYear(),
    pool.query(`SELECT DISTINCT season_year FROM season_totals WHERE player_id = $1 AND season_year IS NOT NULL`, [
      playerId,
    ]),
  ]);
  const canonicalizeOpponent = makeCanonicalizer(opponentLookup);
  const resolvePlayer = makePlayerResolver(playerLookup);
  const activeThisSeason =
    currentSeasonYear !== null && activeRes.rows.some((r) => Number(r.season_year) === currentSeasonYear);

  const builders = {
    game: (view, limit) => getGameBoards(view, canonicalizeOpponent, resolvePlayer, limit),
    season: (view, limit) => getSeasonBoards(view, resolvePlayer, limit),
    career: (view, limit) => getCareerBoards(view, resolvePlayer, limit),
  };

  const cells = ACCOLADE_VIEWS.flatMap((v) => ACCOLADE_TIERS.map((t) => ({ v, t })));
  const results = await Promise.all(cells.map(({ v, t }) => builders[t.key](v.key, t.limit)));

  return ACCOLADE_VIEWS.map((v) => ({
    view: v.key,
    label: v.label,
    tiers: ACCOLADE_TIERS.map((t) => {
      const { boards, rateBoards } = results[cells.findIndex((c) => c.v === v && c.t === t)];
      return {
        scope: t.key,
        label: t.label,
        limit: t.limit,
        entries: collectEntries(t.key, playerId, boards, rateBoards, currentSeasonYear, activeThisSeason),
      };
    }).filter((t) => t.entries.length > 0),
  })).filter((v) => v.tiers.length > 0);
}
