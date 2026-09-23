import Link from 'next/link';
import ViewToggle from '@/components/ViewToggle';
import ScopeToggle, { resolveScope } from '@/components/ScopeToggle';
import { resolveView } from '@/lib/viewFilter';
import { getOpponentLookup, makeCanonicalizer } from '@/lib/opponentLookup';
import { getPlayerLookup, makePlayerResolver } from '@/lib/playerLookup';
import {
  STAT_COLUMNS,
  RATE_STATS,
  getProgramYears,
  getCurrentSeasonYear,
  getActiveYearsByPlayer,
  getCareerBoards,
  getSeasonBoards,
  getGameBoards,
  getShutouts,
  formatYearRanges,
  roundSuffix,
  rateExtraText,
} from '@/lib/leaderboardData';

// This page reads live data that changes every time a game is imported —
// it must be rendered fresh on each request, not baked in at build time.
export const dynamic = 'force-dynamic';

export default async function LeaderboardPage({ searchParams }) {
  const { view: rawView, scope: rawScope } = await searchParams;
  const view = resolveView(rawView);
  const scope = resolveScope(rawScope);

  const [programYears, activeYearsByPlayer, opponentLookup, playerLookup, currentSeasonYear] = await Promise.all([
    getProgramYears(),
    getActiveYearsByPlayer(),
    getOpponentLookup(),
    getPlayerLookup(),
    getCurrentSeasonYear(),
  ]);
  const canonicalizeOpponent = makeCanonicalizer(opponentLookup);
  const resolvePlayer = makePlayerResolver(playerLookup);

  let boards = {};
  let rateBoards = {};
  let shutouts = [];
  if (scope === 'career') {
    ({ boards, rateBoards } = await getCareerBoards(view, resolvePlayer));
  } else if (scope === 'season') {
    ({ boards, rateBoards } = await getSeasonBoards(view, resolvePlayer));
  } else {
    [{ boards, rateBoards } = { boards: {}, rateBoards: {} }, shutouts] = await Promise.all([
      getGameBoards(view, canonicalizeOpponent, resolvePlayer),
      getShutouts(view, canonicalizeOpponent, resolvePlayer),
    ]);
  }

  function firstActiveYear(row) {
    const years = activeYearsByPlayer[row.id];
    if (years && years.length > 0) return Math.min(...years);
    if (row.isStatic && row.firstYear) return row.firstYear;
    return 9999;
  }

  function yearsDisplay(playerId) {
    const years = activeYearsByPlayer[playerId];
    return (years && formatYearRanges(years, programYears)) || '—';
  }

  // "Current season" mirrors Team Stats (TM-16): reads the explicit
  // teams.current_season_year pointer (TM-24), moved by the Advance
  // Season admin action -- not inferred from live data.
  //
  // A CAREER row's membership is checked against the player's raw active-
  // years array with .includes(), not the formatted display range string
  // -- a player active 2024-2026 highlights exactly like one active only
  // in 2026 would. A SEASON or GAME row already names one specific
  // season/game, so it's just a direct equality check instead. A static-
  // only career row (no live data at all for this player yet) falls back
  // to its own lastYear.
  const CURRENT_SEASON_CLASS = 'bg-amber-100 dark:bg-amber-700/60 -mx-1 px-1 rounded';
  function isCurrentSeasonRow(row) {
    if (currentSeasonYear === null) return false;
    if (scope === 'career') {
      const years = activeYearsByPlayer[row.id];
      if (years) return years.includes(currentSeasonYear);
      return row.isStatic && row.lastYear === currentSeasonYear;
    }
    return Number(row.season_year) === currentSeasonYear;
  }

  // Tie-break sort (oldest record shown first, site-wide convention) --
  // by first active year for career rows, by season year (then exact
  // date, when known) for game rows.
  //
  // Game rows ALSO sort playoff-before-regular ahead of chronology --
  // this fell out accidentally before (most regular rows have no exact
  // date, so their '9999-99-99' fallback happened to sort after a
  // playoff row's real date within the same year), but Andy confirmed
  // he wants exactly this, so it's made deliberate here: within a tied
  // value, a playoff performance shows before a regular-season one
  // regardless of which year either happened in, then chronological
  // within each of those two groups.
  function tieBreak(a, b) {
    if (scope === 'career') return firstActiveYear(a) - firstActiveYear(b);
    if (scope === 'season') return Number(a.season_year) - Number(b.season_year);
    const typeRank = (r) => (r.game_type === 'playoff' ? 0 : 1);
    return (
      typeRank(a) - typeRank(b) ||
      Number(a.season_year) - Number(b.season_year) ||
      (a.game_date || '9999-99-99').localeCompare(b.game_date || '9999-99-99')
    );
  }
  [...Object.values(boards), ...Object.values(rateBoards)].forEach((board) => {
    board.sort((a, b) => Number(b.value) - Number(a.value) || tieBreak(a, b));
  });

  const scopeLabel = { game: 'single game', season: 'single season', career: 'career' }[scope];
  const subtitle =
    view === 'regular'
      ? `Regular season only, ${scopeLabel} records`
      : view === 'playoff'
      ? `Playoff only, ${scopeLabel} records`
      : `All games (regular season + playoffs), ${scopeLabel} records`;

  // Renders one player's name+link the same way across every scope --
  // static (unresolved) game-tier rows without a matching players row
  // fall back to plain text instead of a broken/guessed link.
  function PlayerName({ row }) {
    if (row.isStatic && !row.resolvedPlayer) {
      return (
        <span>
          {row.playerName}
          {row.graduation_year ? ` '${String(row.graduation_year).slice(2)}` : ''}
        </span>
      );
    }
    return (
      <Link href={`/players/${row.player_id ?? row.id}`} replace className="hover:underline">
        {row.first_name} {row.last_name}
        {row.graduation_year ? ` '${String(row.graduation_year).slice(2)}` : ''}
      </Link>
    );
  }

  // The bit after the name that differs by scope: years-range for
  // career, season year for season, opponent (ALWAYS shown, per Andy)
  // plus round for game.
  function RowContext({ row }) {
    if (scope === 'career') return <>({row.isStatic && row.displayYears ? row.displayYears : yearsDisplay(row.id)})</>;
    if (scope === 'season') return <>({row.season_year})</>;
    return (
      <>
        (vs {row.opponent}, {row.season_year}
        {roundSuffix(row)})
      </>
    );
  }

  return (
    <main key={`${scope}-${view}`} className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-1">SJJ Lacrosse — All-Time Leaders</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-4">{subtitle}</p>
      <ViewToggle basePath="/leaderboard" currentView={view} extraParams={{ scope }} />
      <ScopeToggle basePath="/leaderboard" currentScope={scope} extraParams={{ view }} />
      {view === 'regular' && scope !== 'game' && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
          Note: for years before playoff data was tracked, &quot;Regular Season&quot; totals may include playoff
          performances that weren&apos;t recorded separately.
        </p>
      )}

      {currentSeasonYear !== null && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
          <span className={`${CURRENT_SEASON_CLASS} font-medium`}>Highlighted</span> {scope === 'career' ? 'players' : 'entries'} are
          from the {currentSeasonYear} season, still in progress — {scope === 'career' ? 'career totals and ' : ''}
          rankings may shift as it continues.
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {STAT_COLUMNS.map((stat) => (
          <div key={stat.key}>
            <h2 className="text-lg font-semibold mb-2 border-b pb-1">{stat.label}</h2>
            <ol className="space-y-1">
              {(boards[stat.key] || []).map((row, idx, arr) => {
                const tiedCount = arr.filter((r) => r.rnk === row.rnk).length;
                const rankLabel = tiedCount > 1 ? `T-${row.rnk}` : String(row.rnk);
                return (
                  <li
                    key={`${row.id || row.player_id}-${row.season_year || ''}-${row.game_date || ''}`}
                    className={`flex justify-between text-sm ${isCurrentSeasonRow(row) ? CURRENT_SEASON_CLASS : ''}`}
                  >
                    <span>
                      <span className="text-gray-400 dark:text-gray-500 w-9 inline-block">{rankLabel}.</span>{' '}
                      <PlayerName row={row} />
                      <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">
                        <RowContext row={row} />
                      </span>
                    </span>
                    <span className="font-medium">{row.value}</span>
                  </li>
                );
              })}
              {(!boards[stat.key] || boards[stat.key].length === 0) && (
                <li className="text-sm text-gray-400">No data yet</li>
              )}
            </ol>
          </div>
        ))}
      </div>

      {scope === 'game' && view !== 'playoff' && (
        <>
          <h2 className="text-xl font-bold mt-12 mb-1">Shutouts</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
            Every shutout in program history, regardless of saves needed -- sorted by saves. A shared line credits
            every goalie who combined for that shutout.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-1 pr-4">Shutouts</th>
                <th className="pb-1 pr-4">Opponent</th>
                <th className="pb-1 pr-4">Year</th>
                <th className="pb-1">Saves</th>
              </tr>
            </thead>
            <tbody>
              {shutouts.map((s, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-1 pr-4">{s.players.join(', ')}</td>
                  <td className="py-1 pr-4">
                    {s.opponent}
                    {roundSuffix(s)}
                  </td>
                  <td className="py-1 pr-4">{s.season_year}</td>
                  <td className="py-1">{s.saves}</td>
                </tr>
              ))}
              {shutouts.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-gray-400 py-2">
                    No data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}

      <h2 className="text-xl font-bold mt-12 mb-1">Rate Leaders</h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
        Minimum attempts required, so a small sample size can&apos;t outrank a full career.
      </p>
      <div className="grid md:grid-cols-2 gap-8">
        {RATE_STATS.filter((stat) => stat.minQualifier[scope] && stat.minQualifier[scope][view]).map((stat) => {
          const qualifier = stat.minQualifier[scope][view];
          const unit = qualifier.metric === 'numerator' ? 'wins' : stat.extraLabels[1].toLowerCase();
          return (
            <div key={stat.key}>
              <h2 className="text-lg font-semibold mb-1 border-b pb-1">{stat.label}</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                Minimum {qualifier.value} {unit}
              </p>
              <ol className="space-y-1">
                {(rateBoards[stat.key] || []).map((row, idx, arr) => {
                  const tiedCount = arr.filter((r) => r.rnk === row.rnk).length;
                  const rankLabel = tiedCount > 1 ? `T-${row.rnk}` : String(row.rnk);

                  return (
                    <li
                      key={`${row.id || row.player_id}-${row.season_year || ''}-${row.game_date || ''}`}
                      className={`flex justify-between text-sm ${isCurrentSeasonRow(row) ? CURRENT_SEASON_CLASS : ''}`}
                    >
                      <span>
                        <span className="text-gray-400 dark:text-gray-500 w-9 inline-block">{rankLabel}.</span>{' '}
                        <PlayerName row={row} />
                        <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">
                          <RowContext row={row} /> — {rateExtraText(stat, row)}
                        </span>
                      </span>
                      <span className="font-medium">{row.value.toFixed(1)}%</span>
                    </li>
                  );
                })}
                {(!rateBoards[stat.key] || rateBoards[stat.key].length === 0) && (
                  <li className="text-sm text-gray-400">No qualifying players yet</li>
                )}
              </ol>
            </div>
          );
        })}
      </div>
    </main>
  );
}
