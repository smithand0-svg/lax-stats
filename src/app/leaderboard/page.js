import Link from 'next/link';
import { pool } from '@/lib/db';
import ViewToggle from '@/components/ViewToggle';
import ScopeToggle, { resolveScope } from '@/components/ScopeToggle';
import { resolveView, gameTypeCondition } from '@/lib/viewFilter';
import { getOpponentLookup, makeCanonicalizer } from '@/lib/opponentLookup';
import { getPlayerLookup, makePlayerResolver } from '@/lib/playerLookup';
import { ROUND_LABELS } from '@/lib/roundLabels';

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

// Rate-based leaderboards (a percentage, not a raw count). Each has its
// own minimum-qualifier PER (scope, view) cell -- Andy's own convention,
// carried over exactly as he specified (2026-09-21):
//   - FO% thresholds are ATTEMPTS everywhere except the Playoff Game and
//     Playoff Season cells, which are WINS instead (a smaller, noisier
//     sample makes raw win count the more meaningful bar there than an
//     attempts count would be). `metric` says which of numerator()/
//     denominator() a cell checks.
//   - Save% has no Game-tier board at all -- a single-game shutout is
//     its own dedicated board below, not a rate stat.
//   - The existing (pre-TM-19) thresholds turned out to already BE the
//     Career-tier numbers Andy wants, so Career is unchanged from what
//     shipped before this ticket.
const RATE_STATS = [
  {
    key: 'fo_pct',
    label: 'Faceoff %',
    numerator: (r) => Number(r.faceoff_wins),
    denominator: (r) => Number(r.faceoff_wins) + Number(r.faceoff_losses),
    extraLabels: ['FOW', 'Attempts'],
    extraValues: (r) => [Number(r.faceoff_wins), Number(r.faceoff_wins) + Number(r.faceoff_losses)],
    minQualifier: {
      game: {
        combined: { metric: 'denominator', value: 10 },
        regular: { metric: 'denominator', value: 10 },
        playoff: { metric: 'numerator', value: 7 },
      },
      season: {
        combined: { metric: 'denominator', value: 100 },
        regular: { metric: 'denominator', value: 100 },
        playoff: { metric: 'numerator', value: 10 },
      },
      career: {
        combined: { metric: 'denominator', value: 100 },
        regular: { metric: 'denominator', value: 100 },
        playoff: { metric: 'denominator', value: 30 },
      },
    },
  },
  {
    key: 'save_pct',
    label: 'Save %',
    numerator: (r) => Number(r.saves),
    denominator: (r) => Number(r.saves) + Number(r.goals_against),
    extraLabels: ['Saves', 'Goals Against'],
    extraValues: (r) => [Number(r.saves), Number(r.goals_against)],
    minQualifier: {
      // No Game tier -- single-game goalie excellence is the Shutouts
      // board below, not a rate-stat leaderboard.
      season: {
        combined: { metric: 'denominator', value: 80 },
        regular: { metric: 'denominator', value: 80 },
        playoff: { metric: 'denominator', value: 25 },
      },
      career: {
        combined: { metric: 'denominator', value: 160 },
        regular: { metric: 'denominator', value: 160 },
        playoff: { metric: 'denominator', value: 25 },
      },
    },
  },
];

// Deliberate, explicitly-named exceptions to a rate stat's normal
// qualifying minimum for one specific (scope, view) cell -- Andy's call,
// kept as a short, visible, reasoned list rather than folded into a
// lowered threshold that would apply to everyone. Checked AFTER the
// normal minimum filter, so it only ever adds a row back in, never
// removes one.
const MANUAL_QUALIFYING_RECORDS = [
  {
    statKey: 'fo_pct',
    scope: 'game',
    view: 'combined',
    playerName: 'Owen Winkler',
    opponent: 'Rocky River',
    gameDate: '2024-05-28',
    reason:
      "7/7 faceoffs, Sweet 16 (round of 16), 2-1 final -- doesn't meet the Combined-view Game minimum of 10 " +
      'attempts, but Andy calls this a true exception: a 7/7 in a one-possession playoff game is not the same ' +
      'thing as a 7/7 that happened because the other team barely contested the X. Already qualifies naturally ' +
      "under the Playoff view (7 wins meets that view's 7-win minimum), so this entry only matters for Combined.",
  },
];

function isManuallyQualified(row, statKey, scope, view) {
  return MANUAL_QUALIFYING_RECORDS.some(
    (m) =>
      m.statKey === statKey &&
      m.scope === scope &&
      m.view === view &&
      row.playerName &&
      row.playerName.toLowerCase() === m.playerName.toLowerCase() &&
      row.opponent === m.opponent &&
      row.game_date === m.gameDate
  );
}

// --- Static individual GAME-level records -----------------------------
// One row per notable player-game, carrying every stat category at once
// (mirrors the shape of a live game_stat_lines row) rather than a
// separate hand-typed list per stat -- Andy's curated top-10 lists will
// populate this once fed. game_date is REQUIRED on every entry: TM-19's
// design rule is matching a static record against live data by player +
// opponent + DATE specifically (not just player + opponent + season),
// since the same player can face the same opponent more than once in a
// season (a regular-season game and a rematch in the playoffs) with
// different stat lines each time -- season-only matching could silently
// merge or drop the wrong one.
const STATIC_INDIVIDUAL_GAME_LINES = [
  // { player: 'Chris Nixon', graduationYear: 2004, opponent: 'Wooster College',
  //   season_year: 2004, game_date: '2004-06-02', round: 4, game_type: 'playoff',
  //   goals: 5, assists: 4 },
];

// --- Static SHUTOUTS -----------------------------------------------
// Unlike the game-line records above, a shutout is keyed by opponent +
// season only (no exact date given/needed here -- lower collision risk
// for a single discrete achievement, and this is exactly the shape
// Andy's own existing sheet already uses, see the shutouts screenshot
// from 2026-09-21). A shutout can credit MORE THAN ONE goalie -- two
// entries below are combined shutouts, e.g. a starter + backup who
// combined for the clean sheet -- so `players` is always an array, even
// for a solo shutout, and `saves` is the ONE combined total for the
// game, not per-player.
const STATIC_SHUTOUTS = [
  { players: ['Ian Horner'], opponent: 'Walsh', season_year: 2023, saves: 12, game_type: 'regular' },
  { players: ['Ian Horner'], opponent: 'Bay', season_year: 2023, saves: 9, game_type: 'regular' },
  { players: ['Ian Horner', 'Avery Jackson'], opponent: 'Gahanna Lincoln', season_year: 2021, saves: 3, game_type: 'regular' },
  { players: ['Ian Horner'], opponent: 'Benedictine', season_year: 2023, saves: 3, game_type: 'regular' },
  { players: ['Noah Houpt', 'Austin Honisko'], opponent: 'Central Catholic', season_year: 2016, saves: 2, game_type: 'regular' },
  { players: ['Ryan Pierce'], opponent: 'Bowling Green', season_year: 2019, saves: 1, game_type: 'regular' },
  // TODO: Andy's source sheet has playoff-specific caveats/minimums for
  // this board that haven't been specified yet -- until then, the
  // Playoff view shows the same full, uncapped list as Combined/Regular
  // (filtered to game_type: 'playoff' entries only), with no additional
  // minimum applied. Revisit once confirmed.
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

function checkQualifier(row, qualifier, numerator, denominator) {
  if (!qualifier) return false;
  const amount = qualifier.metric === 'numerator' ? numerator(row) : denominator(row);
  return amount >= qualifier.value;
}

// --- CAREER tier (unchanged from pre-TM-19/TM-15 behavior) ------------
async function getCareerBoards(view) {
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

  const boards = {};
  STAT_COLUMNS.forEach(({ key, compute }) => {
    const withValue = rows
      .map((r) => ({ ...r, value: compute ? compute(r) : Number(r[key]) }))
      .filter((r) => r.value > 0);
    boards[key] = rankBoard(withValue);
  });

  const rateBoards = {};
  RATE_STATS.forEach(({ key, numerator, denominator, minQualifier }) => {
    const qualifier = minQualifier.career && minQualifier.career[view];
    if (!qualifier) return;
    const withValue = rows
      .map((r) => {
        const denom = denominator(r);
        return { ...r, value: denom > 0 ? (numerator(r) / denom) * 100 : 0 };
      })
      .filter((r) => checkQualifier(r, qualifier, numerator, denominator));
    rateBoards[key] = rankBoard(withValue);
  });

  return { boards, rateBoards };
}

// --- SEASON tier: top 10 individual (player, season) performances -----
// Reuses season_totals exactly as the Career tier does, just grouped one
// level less coarsely (by player AND season_year, instead of collapsing
// every year together) -- the view's already-correct legacy
// regular/playoff split (see db/001_init_schema.sql's season_totals
// VIEW) means no new merge logic is needed here at all.
async function getSeasonBoards(view) {
  const { rows } = await pool.query(
    `SELECT p.id, p.first_name, p.last_name, p.graduation_year, s.season_year,
            SUM(s.goals) AS goals, SUM(s.assists) AS assists, SUM(s.points) AS points,
            SUM(s.shots) AS shots, SUM(s.ground_balls) AS ground_balls,
            SUM(s.caused_turnovers) AS caused_turnovers, SUM(s.faceoff_wins) AS faceoff_wins,
            SUM(s.faceoff_losses) AS faceoff_losses, SUM(s.saves) AS saves,
            SUM(s.goals_against) AS goals_against
     FROM season_totals s
     JOIN players p ON p.id = s.player_id
     WHERE ${gameTypeCondition(view)}
     GROUP BY p.id, p.first_name, p.last_name, p.graduation_year, s.season_year`
  );

  const boards = {};
  STAT_COLUMNS.forEach(({ key, compute }) => {
    const withValue = rows
      .map((r) => ({ ...r, value: compute ? compute(r) : Number(r[key]) }))
      .filter((r) => r.value > 0);
    boards[key] = rankBoard(withValue);
  });

  const rateBoards = {};
  RATE_STATS.forEach(({ key, numerator, denominator, minQualifier }) => {
    const qualifier = minQualifier.season && minQualifier.season[view];
    if (!qualifier) return;
    const withValue = rows
      .map((r) => {
        const denom = denominator(r);
        return { ...r, value: denom > 0 ? (numerator(r) / denom) * 100 : 0 };
      })
      .filter((r) => checkQualifier(r, qualifier, numerator, denominator) || isManuallyQualified(r, key, 'season', view));
    rateBoards[key] = rankBoard(withValue);
  });

  return { boards, rateBoards };
}

// --- GAME tier: the actual point of TM-19 ------------------------------
// "Asserted baseline, live can override" -- same design rule as TM-16,
// applied to individuals from day one instead of needing a second fix
// later. A static record is dropped for a given STAT only when a live
// row demonstrably covers that EXACT game: same player (resolved
// identity, not raw name string), same opponent (canonical, not raw
// string), same game_date, and a live value that equals or exceeds the
// static one. Never wholesale by year, and never even by player+opponent
// alone -- a player can face the same team twice in a season.
async function getGameBoards(view, canonicalizeOpponent, resolvePlayer) {
  const { rows: liveRaw } = await pool.query(
    `SELECT p.id AS player_id, p.first_name, p.last_name, p.graduation_year,
            g.opponent, g.season_year, g.game_date, g.round, g.game_type,
            gsl.goals, gsl.assists, gsl.shots, gsl.ground_balls, gsl.caused_turnovers,
            gsl.faceoff_wins, gsl.faceoff_losses, gsl.saves, gsl.goals_against
     FROM game_stat_lines gsl
     JOIN games g ON g.id = gsl.game_id
     JOIN players p ON p.id = gsl.player_id
     WHERE g.team_id = (SELECT id FROM teams WHERE slug = 'sjj')
       AND ${gameTypeCondition(view, 'g')}`
  );

  const liveRows = liveRaw.map((r) => ({
    ...r,
    opponent: canonicalizeOpponent(r.opponent),
    playerName: `${r.first_name} ${r.last_name}`,
    game_date: r.game_date instanceof Date ? r.game_date.toISOString().slice(0, 10) : r.game_date,
  }));

  const staticFiltered = STATIC_INDIVIDUAL_GAME_LINES.filter((r) => view === 'combined' || r.game_type === view);
  const staticRows = staticFiltered.map((r) => {
    const match = resolvePlayer(...splitName(r.player), r.graduationYear);
    return {
      ...r,
      player_id: match ? match.id : `static-${r.player}-${r.game_date}`,
      first_name: match ? match.first_name : r.player.split(' ')[0],
      last_name: match ? match.last_name : r.player.split(' ').slice(1).join(' '),
      graduation_year: match ? match.graduation_year : r.graduationYear,
      playerName: r.player,
      opponent: canonicalizeOpponent(r.opponent),
      isStatic: true,
      resolvedPlayer: !!match,
    };
  });

  function isCoveredByLive(staticRow, key) {
    const staticValue = staticRow[key];
    if (staticValue === undefined || staticValue === null) return false;
    return liveRows.some(
      (live) =>
        live.playerName.toLowerCase() === staticRow.playerName.toLowerCase() &&
        live.opponent === staticRow.opponent &&
        live.game_date === staticRow.game_date &&
        Number(live[key] || 0) >= staticValue
    );
  }

  const boards = {};
  STAT_COLUMNS.forEach(({ key, compute }) => {
    const liveWithValue = liveRows
      .map((r) => ({ ...r, value: compute ? compute(r) : Number(r[key] || 0) }))
      .filter((r) => r.value > 0);

    // Static entries not covered by live, deduped against EACH OTHER by
    // player+opponent+date+value too (same class of gap TM-16 found at
    // the team level -- two hand-typed rows for the same real game
    // shouldn't both survive just because neither is "live").
    const staticSurvivors = new Map();
    staticRows.forEach((r) => {
      const value = compute ? compute(r) : Number(r[key] || 0);
      if (!(value > 0) || isCoveredByLive(r, key)) return;
      const dedupeKey = `${r.playerName.toLowerCase()}::${r.opponent}::${r.game_date}`;
      const existing = staticSurvivors.get(dedupeKey);
      if (!existing || value > existing.value) {
        staticSurvivors.set(dedupeKey, { ...r, value });
      }
    });

    boards[key] = rankBoard([...liveWithValue, ...staticSurvivors.values()]);
  });

  const rateBoards = {};
  const allRows = [...liveRows, ...staticRows];
  RATE_STATS.forEach(({ key, numerator, denominator, minQualifier }) => {
    const qualifier = minQualifier.game && minQualifier.game[view];
    if (!qualifier) return; // e.g. save_pct has no Game tier at all
    const withValue = allRows
      .map((r) => {
        const denom = denominator(r);
        return { ...r, value: denom > 0 ? (numerator(r) / denom) * 100 : 0 };
      })
      .filter((r) => checkQualifier(r, qualifier, numerator, denominator) || isManuallyQualified(r, key, 'game', view));
    rateBoards[key] = rankBoard(withValue);
  });

  return { boards, rateBoards };
}

// --- SHUTOUTS: a list, not a ranked count ------------------------------
// A live shutout is just any game_stat_lines row with goals_against = 0
// for a completed game -- credits every goalie who appeared in that game
// with goals_against = 0 (naturally handles a combined shutout between a
// starter and a backup, same as the static data below). Matched against
// static entries by opponent + season only (no exact date on the static
// side -- see the comment on STATIC_SHUTOUTS above).
async function getShutouts(view, canonicalizeOpponent, resolvePlayer) {
  const { rows: liveRaw } = await pool.query(
    `SELECT p.id AS player_id, p.first_name, p.last_name,
            g.opponent, g.season_year, g.game_date, g.round, g.game_type, gsl.saves
     FROM game_stat_lines gsl
     JOIN games g ON g.id = gsl.game_id
     JOIN players p ON p.id = gsl.player_id
     WHERE g.team_id = (SELECT id FROM teams WHERE slug = 'sjj')
       AND gsl.goals_against = 0
       AND ${gameTypeCondition(view, 'g')}`
  );

  // Live rows group by game (a combined shutout = 2+ goalie rows for the
  // same game_id) -- group by opponent+date so they render as one entry.
  const liveByGame = new Map();
  liveRaw.forEach((r) => {
    const opponent = canonicalizeOpponent(r.opponent);
    const dateKey = r.game_date instanceof Date ? r.game_date.toISOString().slice(0, 10) : r.game_date;
    const gameKey = `${opponent}::${dateKey}`;
    const existing = liveByGame.get(gameKey) || {
      players: [],
      opponent,
      season_year: r.season_year,
      game_date: dateKey,
      round: r.round,
      game_type: r.game_type,
      saves: 0,
    };
    existing.players.push(`${r.first_name} ${r.last_name}`);
    existing.saves += Number(r.saves || 0);
    liveByGame.set(gameKey, existing);
  });
  const liveShutouts = [...liveByGame.values()];

  const staticFiltered = STATIC_SHUTOUTS.filter((r) => view === 'combined' || r.game_type === view);
  const staticShutouts = staticFiltered
    .map((r) => ({ ...r, opponent: canonicalizeOpponent(r.opponent) }))
    .filter(
      (r) =>
        !liveShutouts.some(
          (live) => live.opponent === r.opponent && live.season_year === r.season_year && live.saves >= r.saves
        )
    );

  return [...liveShutouts, ...staticShutouts].sort((a, b) => b.saves - a.saves || a.season_year - b.season_year);
}

function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/);
  return [parts[0] || '', parts.slice(1).join(' ')];
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

function roundSuffix(row) {
  if (row.game_type !== 'playoff' || !row.round) return '';
  return `, ${ROUND_LABELS[row.round] || `Round of ${row.round}`}`;
}

export default async function LeaderboardPage({ searchParams }) {
  const { view: rawView, scope: rawScope } = await searchParams;
  const view = resolveView(rawView);
  const scope = resolveScope(rawScope);

  const [programYears, activeYearsByPlayer, opponentLookup, playerLookup] = await Promise.all([
    getProgramYears(),
    getActiveYearsByPlayer(),
    getOpponentLookup(),
    getPlayerLookup(),
  ]);
  const canonicalizeOpponent = makeCanonicalizer(opponentLookup);
  const resolvePlayer = makePlayerResolver(playerLookup);

  let boards = {};
  let rateBoards = {};
  let shutouts = [];
  if (scope === 'career') {
    ({ boards, rateBoards } = await getCareerBoards(view));
  } else if (scope === 'season') {
    ({ boards, rateBoards } = await getSeasonBoards(view));
  } else {
    [{ boards, rateBoards } = { boards: {}, rateBoards: {} }, shutouts] = await Promise.all([
      getGameBoards(view, canonicalizeOpponent, resolvePlayer),
      getShutouts(view, canonicalizeOpponent, resolvePlayer),
    ]);
  }

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
  // A CAREER row's membership is checked against the player's raw active-
  // years array with .includes(), not the formatted display range string
  // -- a player active 2024-2026 highlights exactly like one active only
  // in 2026 would. A SEASON or GAME row already names one specific
  // season/game, so it's just a direct equality check instead.
  const currentSeasonYear = programYears.length > 0 ? Math.max(...programYears) : null;
  const CURRENT_SEASON_CLASS = 'bg-amber-100 dark:bg-amber-700/60 -mx-1 px-1 rounded';
  function isCurrentSeasonRow(row) {
    if (currentSeasonYear === null) return false;
    if (scope === 'career') {
      const years = activeYearsByPlayer[row.id];
      return !!years && years.includes(currentSeasonYear);
    }
    return Number(row.season_year) === currentSeasonYear;
  }

  // Tie-break sort (oldest record shown first, site-wide convention) --
  // by first active year for career rows, by the specific season/game
  // date otherwise.
  function tieBreak(a, b) {
    if (scope === 'career') return firstActiveYear(a.id) - firstActiveYear(b.id);
    if (scope === 'season') return Number(a.season_year) - Number(b.season_year);
    return (a.game_date || '9999-99-99').localeCompare(b.game_date || '9999-99-99');
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
    if (scope === 'career') return <>({yearsDisplay(row.id)})</>;
    if (scope === 'season') return <>({row.season_year})</>;
    return (
      <>
        (vs {row.opponent}, {row.season_year}
        {roundSuffix(row)})
      </>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-8">
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

      {scope === 'game' && (
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
                  const [extra1, extra2] = stat.extraValues(row);
                  return (
                    <li
                      key={`${row.id || row.player_id}-${row.season_year || ''}-${row.game_date || ''}`}
                      className={`flex justify-between text-sm ${isCurrentSeasonRow(row) ? CURRENT_SEASON_CLASS : ''}`}
                    >
                      <span>
                        <span className="text-gray-400 dark:text-gray-500 w-9 inline-block">{rankLabel}.</span>{' '}
                        <PlayerName row={row} />
                        <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">
                          <RowContext row={row} /> — {stat.extraLabels[0]}: {extra1}, {stat.extraLabels[1]}: {extra2}
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
