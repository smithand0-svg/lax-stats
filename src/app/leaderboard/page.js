import Link from 'next/link';
import { pool } from '@/lib/db';
import ViewToggle from '@/components/ViewToggle';
import { resolveView, gameTypeCondition } from '@/lib/viewFilter';

// This page reads live data that changes every time a game is imported —
// it must be rendered fresh on each request, not baked in at build time.
export const dynamic = 'force-dynamic';

const STAT_COLUMNS = [
  { key: 'goals', label: 'Goals' },
  { key: 'assists', label: 'Assists' },
  { key: 'points', label: 'Points' },
  { key: 'shots', label: 'Shots' },
  { key: 'ground_balls', label: 'Ground Balls' },
  { key: 'caused_turnovers', label: 'Caused Turnovers' },
  { key: 'faceoff_wins', label: 'Faceoff Wins' },
  { key: 'saves', label: 'Saves' },
  // "Shots Against" isn't a raw column — it's the total shots a goalie
  // faced, i.e. saves + goals allowed. Computed, not summed directly.
  { key: 'shots_against', label: 'Shots Against', compute: (r) => Number(r.saves) + Number(r.goals_against) },
];

// Rate-based leaderboards (a percentage, not a raw count), each with a
// minimum-attempts threshold — matching Andy's own records convention.
// The threshold is intentionally different per view: playoff sample
// sizes are naturally much smaller than a combined/regular career, so
// his own playoff-specific sheet uses lower minimums (30 attempts / 25
// shots against) than the combined view (100 / 160) — applying the
// combined threshold to playoff-only numbers would wrongly exclude
// everyone.
const RATE_STATS = [
  {
    key: 'fo_pct',
    label: 'Faceoff %',
    numerator: (r) => Number(r.faceoff_wins),
    denominator: (r) => Number(r.faceoff_wins) + Number(r.faceoff_losses),
    minAttempts: { combined: 100, regular: 100, playoff: 30 },
    extraLabels: ['FOW', 'Attempts'],
    extraValues: (r) => [Number(r.faceoff_wins), Number(r.faceoff_wins) + Number(r.faceoff_losses)],
  },
  {
    key: 'save_pct',
    label: 'Save %',
    numerator: (r) => Number(r.saves),
    denominator: (r) => Number(r.saves) + Number(r.goals_against),
    minAttempts: { combined: 160, regular: 160, playoff: 25 },
    extraLabels: ['Saves', 'Goals Against'],
    extraValues: (r) => [Number(r.saves), Number(r.goals_against)],
  },
];

const ALL_STAT_SUM = `(goals+assists+shots+shots_on_goal+ground_balls+turnovers+caused_turnovers+faceoff_wins+faceoff_losses+saves+goals_against+personal_fouls+technical_fouls)`;
const ALL_STAT_SUM_COALESCED = `(COALESCE(goals,0)+COALESCE(assists,0)+COALESCE(shots,0)+COALESCE(shots_on_goal,0)+COALESCE(ground_balls,0)+COALESCE(turnovers,0)+COALESCE(caused_turnovers,0)+COALESCE(faceoff_wins,0)+COALESCE(faceoff_losses,0)+COALESCE(saves,0)+COALESCE(goals_against,0)+COALESCE(personal_fouls,0)+COALESCE(technical_fouls,0))`;

// The actual set of years the program ever had a season (e.g. excludes
// 2020, cancelled for COVID). A player missing a year that's ALSO absent
// here isn't a personal gap — it's just a year nobody played — so range
// display shouldn't break on it (e.g. 2019-2021, not "2019, 2021").
async function getProgramYears() {
  const { rows } = await pool.query(
    `SELECT DISTINCT season_year FROM season_totals WHERE season_year IS NOT NULL ORDER BY season_year`
  );
  return rows.map((r) => r.season_year);
}

// "Years active" = years this player was a contributing varsity member —
// logging even one stat in ANY category that year counts, regardless of
// which specific leaderboard is being displayed. Computed once and reused
// across every stat column, rather than recomputed per-stat (a player's
// active years don't change depending on which board you're looking at).
async function getActiveYearsByPlayer() {
  const map = {};

  const { rows: yearRows } = await pool.query(
    `SELECT player_id, season_year FROM (
       SELECT player_id, season_year, SUM(${ALL_STAT_SUM.replace(/\b(\w+)\b(?=[),+])/g, 's.$1')}) AS total_activity
       FROM season_totals s
       GROUP BY player_id, season_year
     ) yearly
     WHERE total_activity > 0 AND season_year IS NOT NULL`
  );
  yearRows.forEach((r) => {
    (map[r.player_id] = map[r.player_id] || []).push(r.season_year);
  });

  // Undated pre-Hudl "Legacy" rows with a known period_label (cross-
  // referenced against Andy's own historical records) contribute their
  // label's years too.
  const { rows: labelRows } = await pool.query(
    `SELECT player_id, period_label FROM season_stat_summaries
     WHERE season_year IS NULL AND period_label IS NOT NULL AND ${ALL_STAT_SUM_COALESCED} > 0`
  );
  labelRows.forEach((r) => {
    (map[r.player_id] = map[r.player_id] || []).push(...parseLabelToYears(r.period_label));
  });

  return map;
}

async function getAllTopPlayers(view) {
  // Fetches every player's totals for every stat column in ONE query,
  // then computes each stat's top-10 ranking in JS — rather than firing
  // separate queries per leaderboard column on every page load. This app
  // runs on a shared host with a hard, low ceiling on total processes;
  // cutting query count directly reduces how many database connections a
  // single page view can open at once.
  //
  // Fetches faceoff_losses and goals_against too, even though neither is
  // its own simple leaderboard column — both are needed as the
  // denominator halves of the Faceoff % and Save % rate stats below.
  const { rows } = await pool.query(
    `SELECT p.id, p.first_name, p.last_name, p.graduation_year,
            SUM(s.goals) AS goals, SUM(s.assists) AS assists, SUM(s.points) AS points,
            SUM(s.shots) AS shots, SUM(s.ground_balls) AS ground_balls,
            SUM(s.caused_turnovers) AS caused_turnovers, SUM(s.faceoff_wins) AS faceoff_wins,
            SUM(s.faceoff_losses) AS faceoff_losses, SUM(s.saves) AS saves,
            SUM(s.goals_against) AS goals_against
     FROM season_totals s
     JOIN players p ON p.id = s.player_id
     WHERE ${gameTypeCondition(view)}
     GROUP BY p.id, p.first_name, p.last_name, p.graduation_year`
  );

  function rankBoard(withValue) {
    withValue.sort((a, b) => Number(b.value) - Number(a.value));
    let rank = 0;
    let lastValue = null;
    withValue.forEach((r, i) => {
      if (Number(r.value) !== lastValue) {
        rank = i + 1;
        lastValue = Number(r.value);
      }
      r.rnk = rank;
    });
    return withValue.filter((r) => r.rnk <= 10);
  }

  const boards = {};
  STAT_COLUMNS.forEach(({ key, compute }) => {
    const withValue = rows
      .map((r) => ({ ...r, value: compute ? compute(r) : Number(r[key]) }))
      .filter((r) => r.value > 0);
    boards[key] = rankBoard(withValue);
  });

  const rateBoards = {};
  RATE_STATS.forEach(({ key, numerator, denominator, minAttempts }) => {
    const threshold = minAttempts[view];
    const withValue = rows
      .map((r) => {
        const denom = denominator(r);
        return { ...r, denom, value: denom > 0 ? (numerator(r) / denom) * 100 : 0 };
      })
      .filter((r) => r.denom >= threshold);
    rateBoards[key] = rankBoard(withValue);
  });

  return { boards, rateBoards };
}

// Parses a simple "YYYY" or "YYYY-YYYY" label into an array of individual
// years, so it can be merged with real dated years before range-formatting.
function parseLabelToYears(label) {
  const m = label && label.match(/^(\d{4})(?:-(\d{4}))?$/);
  if (!m) return [];
  const start = parseInt(m[1], 10);
  const end = m[2] ? parseInt(m[2], 10) : start;
  const years = [];
  for (let y = start; y <= end; y++) years.push(y);
  return years;
}

// Consolidates a sorted list of years into ranges: years collapse into
// "2018-2020" when consecutive AMONG YEARS THE PROGRAM ACTUALLY PLAYED
// (so a year nobody played, like COVID-cancelled 2020, doesn't break a
// range); a genuine personal gap starts a new range, joined by a comma.
function formatYearRanges(years, programYears) {
  if (!years || years.length === 0) return null;
  const sorted = [...new Set(years.map(Number))].sort((a, b) => a - b);
  const prog = [...new Set(programYears.map(Number))].sort((a, b) => a - b);

  function nextProgramYear(y) {
    const idx = prog.indexOf(y);
    return idx >= 0 && idx + 1 < prog.length ? prog[idx + 1] : y + 1;
  }

  const ranges = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === nextProgramYear(end)) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = end = sorted[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(', ');
}

export default async function LeaderboardPage({ searchParams }) {
  const { view: rawView } = await searchParams;
  const view = resolveView(rawView);

  const [programYears, activeYearsByPlayer, { boards, rateBoards }] = await Promise.all([
    getProgramYears(),
    getActiveYearsByPlayer(),
    getAllTopPlayers(view),
  ]);

  function firstActiveYear(playerId) {
    const years = activeYearsByPlayer[playerId];
    return years && years.length > 0 ? Math.min(...years) : 9999;
  }

  function yearsDisplay(playerId) {
    const years = activeYearsByPlayer[playerId];
    return (years && formatYearRanges(years, programYears)) || '—';
  }

  // "Current season" mirrors Team Stats (TM-16): the most recent season
  // year with any live data, inferred from programYears until TM-17/TM-24
  // (finalize/advance) exist to mark it explicitly.
  //
  // A career row here isn't a single season_year like a Team Stats game
  // or season row -- it's a range of years (activeYearsByPlayer[id]),
  // which yearsDisplay formats into a string like "2024-2026". Highlight
  // membership MUST be checked against that underlying array with
  // .includes(), not against the formatted range string or its endpoint --
  // a player active 2024-2026 is still active THIS season and should
  // highlight exactly like a player active only in 2026 would, even
  // though their displayed range text differs.
  const currentSeasonYear = programYears.length > 0 ? Math.max(...programYears) : null;
  const CURRENT_SEASON_CLASS = 'bg-amber-100 dark:bg-amber-700/60 -mx-1 px-1 rounded';
  function isCurrentSeasonPlayer(playerId) {
    const years = activeYearsByPlayer[playerId];
    return currentSeasonYear !== null && !!years && years.includes(currentSeasonYear);
  }

  // Tie-break sort (oldest record shown first) happens here in JS, since
  // "years active" is computed separately from the stats query.
  [...Object.values(boards), ...Object.values(rateBoards)].forEach((board) => {
    board.sort((a, b) => Number(b.value) - Number(a.value) || firstActiveYear(a.id) - firstActiveYear(b.id));
  });

  const subtitle =
    view === 'regular'
      ? 'Regular season only, career totals'
      : view === 'playoff'
      ? 'Playoff only, career totals'
      : 'All games (regular season + playoffs), career totals';

  return (
    <main className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-1">SJJ Lacrosse — All-Time Leaders</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-4">{subtitle}</p>
      <ViewToggle basePath="/leaderboard" currentView={view} />
      {view === 'regular' && (
        <p className="text-xs text-gray-400 dark:text-gray-500 -mt-4 mb-6">
          Note: for years before playoff data was tracked, &quot;Regular Season&quot; totals may include playoff
          performances that weren&apos;t recorded separately.
        </p>
      )}

      {currentSeasonYear !== null && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
          <span className={`${CURRENT_SEASON_CLASS} font-medium`}>Highlighted</span> players are still active in the{' '}
          {currentSeasonYear} season, still in progress — career totals and rankings may shift as it continues.
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {STAT_COLUMNS.map((stat) => (
          <div key={stat.key}>
            <h2 className="text-lg font-semibold mb-2 border-b pb-1">{stat.label}</h2>
            <ol className="space-y-1">
              {boards[stat.key].map((row, idx, arr) => {
                const tiedCount = arr.filter((r) => r.rnk === row.rnk).length;
                const rankLabel = tiedCount > 1 ? `T-${row.rnk}` : String(row.rnk);
                return (
                  <li
                    key={row.id}
                    className={`flex justify-between text-sm ${
                      isCurrentSeasonPlayer(row.id) ? CURRENT_SEASON_CLASS : ''
                    }`}
                  >
                    <span>
                      <span className="text-gray-400 dark:text-gray-500 w-9 inline-block">{rankLabel}.</span>{' '}
                      <Link href={`/players/${row.id}`} replace className="hover:underline">
                        {row.first_name} {row.last_name}
                        {row.graduation_year ? ` '${String(row.graduation_year).slice(2)}` : ''}
                      </Link>
                      <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">
                        ({yearsDisplay(row.id)})
                      </span>
                    </span>
                    <span className="font-medium">{row.value}</span>
                  </li>
                );
              })}
              {boards[stat.key].length === 0 && <li className="text-sm text-gray-400">No data yet</li>}
            </ol>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold mt-12 mb-1">Rate Leaders</h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
        Minimum attempts required, so a small sample size can&apos;t outrank a full career.
      </p>
      <div className="grid md:grid-cols-2 gap-8">
        {RATE_STATS.map((stat) => (
          <div key={stat.key}>
            <h2 className="text-lg font-semibold mb-1 border-b pb-1">{stat.label}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Minimum {stat.minAttempts[view]} attempts</p>
            <ol className="space-y-1">
              {rateBoards[stat.key].map((row, idx, arr) => {
                const tiedCount = arr.filter((r) => r.rnk === row.rnk).length;
                const rankLabel = tiedCount > 1 ? `T-${row.rnk}` : String(row.rnk);
                const [extra1, extra2] = stat.extraValues(row);
                return (
                  <li
                    key={row.id}
                    className={`flex justify-between text-sm ${
                      isCurrentSeasonPlayer(row.id) ? CURRENT_SEASON_CLASS : ''
                    }`}
                  >
                    <span>
                      <span className="text-gray-400 dark:text-gray-500 w-9 inline-block">{rankLabel}.</span>{' '}
                      <Link href={`/players/${row.id}`} replace className="hover:underline">
                        {row.first_name} {row.last_name}
                        {row.graduation_year ? ` '${String(row.graduation_year).slice(2)}` : ''}
                      </Link>
                      <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">
                        ({yearsDisplay(row.id)}) — {stat.extraLabels[0]}: {extra1}, {stat.extraLabels[1]}: {extra2}
                      </span>
                    </span>
                    <span className="font-medium">{row.value.toFixed(1)}%</span>
                  </li>
                );
              })}
              {rateBoards[stat.key].length === 0 && (
                <li className="text-sm text-gray-400">No qualifying players yet</li>
              )}
            </ol>
          </div>
        ))}
      </div>
    </main>
  );
}
