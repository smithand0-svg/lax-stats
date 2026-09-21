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
  // Seeded 2026-09-21: 465 entries from IndividualPlayoffs.xlsx (full
  // per-game box scores, playoffs 2015-2019 + 2021-2024), then merged
  // with Game-tier entries pulled from Andy's two curated PDFs
  // (All_Individual_Stats.pdf = combined view, Playoff_Individual_
  // Stats.pdf = playoff view), including the Best FO% (Game) board's
  // embedded (wins/attempts) counts. 565 entries total.
  //
  // Merging by (player, opponent, season_year) alone is NOT safe when a
  // team faces the same opponent twice in a season (regular + playoff)
  // -- several combined-view PDF entries genuinely conflicted in value
  // with an xlsx-derived playoff row for the same nominal opponent+year
  // (e.g. Nathan Aloi vs Ottawa Hills 2019: 3 goals in the playoff game,
  // 7 in a separate regular-season meeting). Any such conflict was
  // treated as evidence of a second, different game and split into its
  // own row rather than overwritten -- consistent with TM-19's own
  // design rule that opponent+year alone is not enough to identify a
  // specific game. Regular-season rows have no known exact date (the
  // PDFs don't give one), so they're matched by player+opponent+season
  // only, same standard as Andy's own source board.
  //
  // Player-name spellings confirmed by Andy 2026-09-21 (from the era of
  // hand-entering names on an iPad each game): Aiden Reed, Ryan Almester,
  // Matt Padanilam, Jeff Szozda, Drew Dunphy, Dan Martingale, Colin
  // Pigott. Colton Bollenbacher and Daniel Bollenbacher are BROTHERS --
  // two different real players, correctly kept separate. Zachary/Zack
  // Wester (found in the xlsx, not on Andy's original question list)
  // normalized to Zack Wester too, matching the spelling his own PDF
  // already uses for the same player.
  { player: 'Ryan Pierce', graduationYear: 2020, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 4, goals_against: 1 },
  { player: 'Ryan Pierce', graduationYear: 2020, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 16, goals_against: 5 },
  { player: 'Parker Thayer', graduationYear: 2017, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 4, goals_against: 3 },
  { player: 'JD Keller', opponent: 'Avon Lake', season_year: 2018, game_date: '2018-05-14', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 7, goals_against: 6 },
  { player: 'Noah Houpt', graduationYear: 2016, opponent: 'St. Ignatius', season_year: 2015, game_date: '2015-05-28', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 15, goals_against: 14 },
  { player: 'Noah Houpt', graduationYear: 2016, opponent: 'Perrysburg', season_year: 2016, game_date: '2016-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 7, goals_against: 7 },
  { player: 'Noah Houpt', graduationYear: 2016, opponent: 'Olentangy', season_year: 2016, game_date: '2016-05-21', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 11, goals_against: 12 },
  { player: 'JD Keller', opponent: 'St. Francis Toledo', season_year: 2018, game_date: '2018-05-17', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 7, goals_against: 12 },
  { player: 'Ryan Pierce', graduationYear: 2020, opponent: 'Ottawa Hills', season_year: 2019, game_date: '2019-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 5, goals_against: 12 },
  { player: 'Jeff Szozda', graduationYear: 2017, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 0, ground_balls: 0, caused_turnovers: 1, faceoff_wins: 12, faceoff_losses: 4, saves: 0, goals_against: 1 },
  { player: 'Bo Taylor', graduationYear: 2017, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 1 },
  { player: 'Gareth Francis', graduationYear: 2020, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 0, assists: 4, points: 4, shots: 2, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zack Wester', graduationYear: 2016, opponent: 'Perrysburg', season_year: 2016, game_date: '2016-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 4, points: 4, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alex Weinberg', graduationYear: 2019, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 2, assists: 4, points: 6, shots: 5, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nathan Aloi', graduationYear: 2019, opponent: 'Avon Lake', season_year: 2018, game_date: '2018-05-14', game_type: 'playoff', goals: 2, assists: 3, points: 5, shots: 5, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nicholas Cope', graduationYear: 2019, opponent: 'Ottawa Hills', season_year: 2019, game_date: '2019-05-20', game_type: 'playoff', goals: 1, assists: 3, points: 0, shots: 4, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 3, saves: 0, goals_against: 0 },
  { player: 'Ben Uncapher', graduationYear: 2015, opponent: 'St. Ignatius', season_year: 2015, game_date: '2015-05-28', game_type: 'playoff', goals: 0, assists: 2, points: 2, shots: 0, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nicholas Cope', graduationYear: 2019, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 1, assists: 2, points: 3, shots: 2, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 1, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nathan Aloi', graduationYear: 2019, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 4, assists: 2, points: 6, shots: 8, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nathan Aloi', graduationYear: 2019, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 2, assists: 2, points: 4, shots: 10, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zack Wester', graduationYear: 2016, opponent: 'Olentangy', season_year: 2016, game_date: '2016-05-21', game_type: 'playoff', goals: 0, assists: 2, points: 2, shots: 1, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Chandler Bankey', graduationYear: 2019, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 4, assists: 2, points: 6, shots: 6, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Sam Rodgers', graduationYear: 2019, opponent: 'Ottawa Hills', season_year: 2019, game_date: '2019-05-20', round: 16, game_type: 'playoff', goals: 0, assists: 1, points: 0, shots: 1, ground_balls: 5, caused_turnovers: 3, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Chandler Bankey', graduationYear: 2019, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 3, assists: 1, points: 4, shots: 11, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nick Cope', graduationYear: 2019, opponent: 'St. Francis Toledo', season_year: 2018, game_date: '2018-05-17', game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 2, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 1, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Bennett Miller', graduationYear: 2016, opponent: 'Olentangy', season_year: 2016, game_date: '2016-05-21', round: 16, game_type: 'playoff', goals: 6, assists: 1, points: 7, shots: 15, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Jake Newcomer', graduationYear: 2016, opponent: 'Perrysburg', season_year: 2016, game_date: '2016-05-19', round: 32, game_type: 'playoff', goals: 2, assists: 1, points: 3, shots: 10, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Bennett Miller', graduationYear: 2016, opponent: 'Perrysburg', season_year: 2016, game_date: '2016-05-19', round: 32, game_type: 'playoff', goals: 2, assists: 1, points: 3, shots: 10, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nathan Aloi', graduationYear: 2019, opponent: 'Ottawa Hills', season_year: 2019, game_date: '2019-05-20', game_type: 'playoff', goals: 3, assists: 1, points: 0, shots: 9, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Jake Newcomer', graduationYear: 2016, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 1, assists: 1, points: 2, shots: 4, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nathan Aloi', graduationYear: 2019, opponent: 'Perrysburg', season_year: 2016, game_date: '2016-05-19', round: 32, game_type: 'playoff', goals: 1, assists: 1, points: 2, shots: 2, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cam Hinojosa', graduationYear: 2017, opponent: 'Olentangy', season_year: 2016, game_date: '2016-05-21', game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 1, faceoff_losses: 3, saves: 0, goals_against: 0 },
  { player: 'Ryan Almester', graduationYear: 2015, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 3, assists: 1, points: 4, shots: 9, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Bennett Miller', graduationYear: 2016, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 4, assists: 1, points: 5, shots: 9, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alex Hulse', graduationYear: 2017, opponent: 'St. Ignatius', season_year: 2015, game_date: '2015-05-28', game_type: 'playoff', goals: 1, assists: 1, points: 2, shots: 2, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nate Nachtrab', opponent: 'Avon Lake', season_year: 2018, game_date: '2018-05-14', game_type: 'playoff', goals: 1, assists: 1, points: 2, shots: 2, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Gareth Francis', graduationYear: 2020, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 1, assists: 1, points: 2, shots: 3, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Aiden Reed', graduationYear: 2015, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 3, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Chandler Bankey', graduationYear: 2019, opponent: 'St. Francis Toledo', season_year: 2018, game_date: '2018-05-17', game_type: 'playoff', goals: 1, assists: 1, points: 2, shots: 2, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'George Jacob', graduationYear: 2021, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 1, assists: 1, points: 2, shots: 2, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zack Wester', graduationYear: 2016, opponent: 'St. Ignatius', season_year: 2015, game_date: '2015-05-28', game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Andrew Miller', graduationYear: 2021, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Gareth Francis', graduationYear: 2020, opponent: 'St. Francis Toledo', season_year: 2018, game_date: '2018-05-17', game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Sam Rodgers', graduationYear: 2019, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 6, caused_turnovers: 4, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Blaze Whitton', graduationYear: 2020, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 7, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Sam Rodgers', graduationYear: 2019, opponent: 'St. Francis Toledo', season_year: 2018, game_date: '2018-05-17', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 4, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Austen Perkins', graduationYear: 2020, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Blaze Whitton', graduationYear: 2020, opponent: 'Ottawa Hills', season_year: 2019, game_date: '2019-05-20', game_type: 'playoff', goals: 1, assists: 0, points: 0, shots: 4, ground_balls: 2, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Sam Rodgers', graduationYear: 2019, opponent: 'Avon Lake', season_year: 2018, game_date: '2018-05-14', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 4, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Blaze Whitton', graduationYear: 2020, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 4, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nathan Aloi', graduationYear: 2019, opponent: 'St. Francis Toledo', season_year: 2018, game_date: '2018-05-17', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 7, ground_balls: 3, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Eric Toncre', graduationYear: 2019, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Christian King', graduationYear: 2015, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 0, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Eric Toncre', graduationYear: 2019, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nick Cope', graduationYear: 2019, opponent: 'Avon Lake', season_year: 2018, game_date: '2018-05-14', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 2, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 5, faceoff_losses: 2, saves: 0, goals_against: 0 },
  { player: 'Blaze Whitton', graduationYear: 2020, opponent: 'Avon Lake', season_year: 2018, game_date: '2018-05-14', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Drew Dunphy', graduationYear: 2020, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Matthew Stansley', graduationYear: 2019, opponent: 'Ottawa Hills', season_year: 2019, game_date: '2019-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Sam Rodgers', graduationYear: 2019, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 8, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nick Cope', graduationYear: 2019, opponent: 'Perrysburg', season_year: 2016, game_date: '2016-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 6, caused_turnovers: 0, faceoff_wins: 14, faceoff_losses: 2, saves: 0, goals_against: 0 },
  { player: 'Ray Huntzinger', graduationYear: 2018, opponent: 'Perrysburg', season_year: 2016, game_date: '2016-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 6, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Jeff Szozda', graduationYear: 2017, opponent: 'St. Ignatius', season_year: 2015, game_date: '2015-05-28', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 2, ground_balls: 5, caused_turnovers: 0, faceoff_wins: 13, faceoff_losses: 7, saves: 0, goals_against: 0 },
  { player: 'Nick Cope', graduationYear: 2019, opponent: 'Olentangy', season_year: 2016, game_date: '2016-05-21', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 4, caused_turnovers: 0, faceoff_wins: 8, faceoff_losses: 10, saves: 0, goals_against: 0 },
  { player: 'AJ Urbanski', graduationYear: 2017, opponent: 'Perrysburg', season_year: 2016, game_date: '2016-05-19', round: 32, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 3, ground_balls: 4, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Matt Padanilam', graduationYear: 2016, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 4, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Dalton Stolnicki', graduationYear: 2016, opponent: 'Perrysburg', season_year: 2016, game_date: '2016-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 4, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Phil Shook', graduationYear: 2016, opponent: 'Perrysburg', season_year: 2016, game_date: '2016-05-19', round: 32, game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 6, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Colin Pigott', graduationYear: 2015, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 3, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Chandler Bankey', graduationYear: 2019, opponent: 'Perrysburg', season_year: 2016, game_date: '2016-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 2, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Dan Martingale', graduationYear: 2016, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Pierce Morrison', opponent: 'St. Francis Toledo', season_year: 2018, game_date: '2018-05-17', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Hayden Wyper', graduationYear: 2016, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Christian King', graduationYear: 2015, opponent: 'St. Ignatius', season_year: 2015, game_date: '2015-05-28', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Dan Martingale', graduationYear: 2016, opponent: 'Perrysburg', season_year: 2016, game_date: '2016-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Hayden Wyper', graduationYear: 2016, opponent: 'Olentangy', season_year: 2016, game_date: '2016-05-21', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Eric Toncre', graduationYear: 2019, opponent: 'Avon Lake', season_year: 2018, game_date: '2018-05-14', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Bennett Miller', graduationYear: 2016, opponent: 'St. Ignatius', season_year: 2015, game_date: '2015-05-28', game_type: 'playoff', goals: 3, assists: 0, points: 3, shots: 8, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zack Wester', graduationYear: 2016, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 4, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Dan McCartney', graduationYear: 2015, opponent: 'St. Ignatius', season_year: 2015, game_date: '2015-05-28', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 4, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alex Weinberg', opponent: 'St. Francis Toledo', season_year: 2018, game_date: '2018-05-17', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 4, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nicholas Cope', graduationYear: 2019, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 3, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Dan McCartney', graduationYear: 2015, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 2, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Gareth Francis', graduationYear: 2020, opponent: 'Ottawa Hills', season_year: 2019, game_date: '2019-05-20', game_type: 'playoff', goals: 1, assists: 0, points: 0, shots: 2, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Colin Pigott', graduationYear: 2015, opponent: 'St. Ignatius', season_year: 2015, game_date: '2015-05-28', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ray Huntzinger', graduationYear: 2018, opponent: 'Olentangy', season_year: 2016, game_date: '2016-05-21', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Jake Newcomer', graduationYear: 2016, opponent: 'St. Ignatius', season_year: 2015, game_date: '2015-05-28', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Hayden Wyper', graduationYear: 2016, opponent: 'St. Ignatius', season_year: 2015, game_date: '2015-05-28', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ray Huntzinger', graduationYear: 2018, opponent: 'St. Ignatius', season_year: 2015, game_date: '2015-05-28', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nick Wheeler', graduationYear: 2016, opponent: 'Perrysburg', season_year: 2016, game_date: '2016-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Hayden Wyper', graduationYear: 2016, opponent: 'Perrysburg', season_year: 2016, game_date: '2016-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Dalton Stolnicki', graduationYear: 2016, opponent: 'Olentangy', season_year: 2016, game_date: '2016-05-21', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ray Huntzinger', graduationYear: 2018, opponent: 'St. Francis Toledo', season_year: 2018, game_date: '2018-05-17', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'James Bohne', graduationYear: 2020, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ryan Rubel', graduationYear: 2016, opponent: 'Perrysburg', season_year: 2016, game_date: '2016-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 2, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 2, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Blake Spencer', graduationYear: 2017, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 1, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Aiden Gage', graduationYear: 2019, opponent: 'St. Francis Toledo', season_year: 2018, game_date: '2018-05-17', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 9, faceoff_losses: 5, saves: 0, goals_against: 0 },
  { player: 'Aiden Gage', graduationYear: 2019, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 5, faceoff_losses: 5, saves: 0, goals_against: 0 },
  { player: 'Matthew Pfeiffer', graduationYear: 2020, opponent: 'St. Francis Toledo', season_year: 2018, game_date: '2018-05-17', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 1, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Jake Newcomer', graduationYear: 2016, opponent: 'Olentangy', season_year: 2016, game_date: '2016-05-21', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 9, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alex Weinberg', graduationYear: 2019, opponent: 'Ottawa Hills', season_year: 2019, game_date: '2019-05-20', game_type: 'playoff', goals: 3, assists: 0, points: 0, shots: 7, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alex Weinberg', opponent: 'Avon Lake', season_year: 2018, game_date: '2018-05-14', game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 6, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Chandler Bankey', graduationYear: 2019, opponent: 'Ottawa Hills', season_year: 2019, game_date: '2019-05-20', game_type: 'playoff', goals: 3, assists: 0, points: 0, shots: 5, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Joshua Kraus', graduationYear: 2021, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 2, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Blaze Whitton', graduationYear: 2020, opponent: 'St. Francis Toledo', season_year: 2018, game_date: '2018-05-17', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 1, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Aiden Reed', opponent: 'St. Ignatius', season_year: 2015, game_date: '2015-05-28', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ryan Rubel', graduationYear: 2016, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ryan Rubel', graduationYear: 2016, opponent: 'St. Ignatius', season_year: 2015, game_date: '2015-05-28', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Bo Taylor', graduationYear: 2017, opponent: 'St. Ignatius', season_year: 2015, game_date: '2015-05-28', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nick Wheeler', graduationYear: 2016, opponent: 'St. Ignatius', season_year: 2015, game_date: '2015-05-28', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Dan Martingale', graduationYear: 2016, opponent: 'Olentangy', season_year: 2016, game_date: '2016-05-21', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'AJ Urbanski', graduationYear: 2017, opponent: 'Olentangy', season_year: 2016, game_date: '2016-05-21', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Bo Taylor', graduationYear: 2017, opponent: 'Olentangy', season_year: 2016, game_date: '2016-05-21', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Matt Padanilam', graduationYear: 2016, opponent: 'Olentangy', season_year: 2016, game_date: '2016-05-21', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ray Huntzinger', graduationYear: 2018, opponent: 'Avon Lake', season_year: 2018, game_date: '2018-05-14', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Jimmy Bohne', opponent: 'Avon Lake', season_year: 2018, game_date: '2018-05-14', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'CJ Trudell', graduationYear: 2018, opponent: 'St. Francis Toledo', season_year: 2018, game_date: '2018-05-17', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Eric Toncre', graduationYear: 2019, opponent: 'St. Francis Toledo', season_year: 2018, game_date: '2018-05-17', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Jimmy Bohne', opponent: 'St. Francis Toledo', season_year: 2018, game_date: '2018-05-17', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'James Bohne', graduationYear: 2020, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nathan Kyllo', graduationYear: 2020, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Matthew Stansley', graduationYear: 2019, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Colton Bollenbacher', graduationYear: 2021, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'James Bohne', graduationYear: 2020, opponent: 'Ottawa Hills', season_year: 2019, game_date: '2019-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Austen Perkins', graduationYear: 2020, opponent: 'Ottawa Hills', season_year: 2019, game_date: '2019-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cole Kovacs', graduationYear: 2021, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 2, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Matthew Pfeifer', graduationYear: 2020, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 3, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Aiden Gage', graduationYear: 2019, opponent: 'Ottawa Hills', season_year: 2019, game_date: '2019-05-20', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 16, faceoff_losses: 7, saves: 0, goals_against: 0 },
  { player: 'Aiden Gage', graduationYear: 2019, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 6, faceoff_losses: 10, saves: 0, goals_against: 0 },
  { player: 'Matthew Pfeiffer', graduationYear: 2020, opponent: 'Avon Lake', season_year: 2018, game_date: '2018-05-14', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 1, faceoff_losses: 8, saves: 0, goals_against: 0 },
  { player: 'Ryan Almester', graduationYear: 2015, opponent: 'St. Ignatius', season_year: 2015, game_date: '2015-05-28', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 6, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 3, saves: 0, goals_against: 0 },
  { player: 'CJ Trudell', graduationYear: 2018, opponent: 'Avon Lake', season_year: 2018, game_date: '2018-05-14', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 2, saves: 0, goals_against: 0 },
  { player: 'Matthew Pfeifer', graduationYear: 2020, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 2, saves: 0, goals_against: 0 },
  { player: 'Cole Kovacs', graduationYear: 2021, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 3, saves: 0, goals_against: 0 },
  { player: 'Chandler Bankey', graduationYear: 2019, opponent: 'Avon Lake', season_year: 2018, game_date: '2018-05-14', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 6, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'George Jacob', graduationYear: 2021, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 3, assists: 0, points: 3, shots: 5, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nathan Aloi', graduationYear: 2019, opponent: 'Olentangy', season_year: 2016, game_date: '2016-05-21', game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 5, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ethan Miller', graduationYear: 2018, opponent: 'St. Francis Toledo', season_year: 2018, game_date: '2018-05-17', game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 3, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alex Weinberg', graduationYear: 2019, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 3, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'George Jacob', graduationYear: 2021, opponent: 'Ottawa Hills', season_year: 2019, game_date: '2019-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 2, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Joshua Kraus', graduationYear: 2021, opponent: 'Ottawa Hills', season_year: 2019, game_date: '2019-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 2, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Andrew Miller', graduationYear: 2021, opponent: 'Ottawa Hills', season_year: 2019, game_date: '2019-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 2, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ethan Miller', graduationYear: 2018, opponent: 'Avon Lake', season_year: 2018, game_date: '2018-05-14', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Jeffrey Denker', graduationYear: 2020, opponent: 'Sylvania Southview', season_year: 2019, game_date: '2019-05-13', round: 64, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Andrew Miller', graduationYear: 2021, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ben Uncapher', graduationYear: 2015, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alex Hulse', graduationYear: 2017, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nick Wheeler', graduationYear: 2016, opponent: 'Perrysburg', season_year: 2015, game_date: '2015-05-23', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Phil Shook', graduationYear: 2016, opponent: 'Olentangy', season_year: 2016, game_date: '2016-05-21', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Joshua Kraus', graduationYear: 2021, opponent: 'Westlake', season_year: 2019, game_date: '2019-05-16', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nicholas Bowers', opponent: 'Chagrin Falls', season_year: 2022, game_date: '2022-05-31', round: 4, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 8, goals_against: 18 },
  { player: 'Nicholas Bowers', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 17, goals_against: 7 },
  { player: 'Dan Lach', opponent: 'St. Francis Toledo', season_year: 2021, game_date: '2021-05-24', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 14, goals_against: 10 },
  { player: 'Nicholas Bowers', opponent: 'Columbus DeSales', season_year: 2024, game_date: '2024-06-08', round: 2, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 8, goals_against: 15 },
  { player: 'Ian Horner', opponent: 'Olmsted Falls', season_year: 2023, game_date: '2023-05-24', round: 8, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 12, goals_against: 5 },
  { player: 'Nicholas Bowers', opponent: 'Ottawa Hills', season_year: 2022, game_date: '2022-05-26', round: 8, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 7, goals_against: 8 },
  { player: 'Ian Horner', opponent: 'Ottawa Hills', season_year: 2024, game_date: '2024-05-22', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 8, goals_against: 5 },
  { player: 'Ian Horner', opponent: 'Walsh Jesuit', season_year: 2023, game_date: '2023-05-22', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 12, goals_against: 0 },
  { player: 'Ian Horner', opponent: 'Wooster', season_year: 2024, game_date: '2024-05-30', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 5, goals_against: 6 },
  { player: 'Dan Lach', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 4, goals_against: 4 },
  { player: 'Nicholas Bowers', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 5, goals_against: 2 },
  { player: 'Ian Horner', opponent: 'Rocky River', season_year: 2024, game_date: '2024-05-28', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 5, goals_against: 1 },
  { player: 'Ian Horner', opponent: 'Rocky River', season_year: 2023, game_date: '2023-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 2, goals_against: 4 },
  { player: 'Nicholas Bowers', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 3, goals_against: 2 },
  { player: 'Nicholas Bowers', opponent: 'Southview', season_year: 2024, game_date: '2024-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 5 },
  { player: 'Ian Horner', opponent: 'Southview', season_year: 2024, game_date: '2024-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 2, goals_against: 2 },
  { player: 'Ian Horner', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 3, goals_against: 0 },
  { player: 'Ian Horner', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 1, goals_against: 0 },
  { player: 'Dan Lach', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 1 },
  { player: 'Nicholas Bowers', opponent: 'University School', season_year: 2024, game_date: '2024-06-05', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 8, goals_against: 4 },
  { player: 'Ian Horner', opponent: 'University School', season_year: 2024, game_date: '2024-06-05', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 2, goals_against: 1 },
  { player: 'Tyler Meader', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 4, ground_balls: 8, caused_turnovers: 5, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Mason Bowers', opponent: 'Rocky River', season_year: 2024, game_date: '2024-05-28', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 5, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Tyler Meader', opponent: 'Ottawa Hills', season_year: 2022, game_date: '2022-05-26', round: 8, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 2, ground_balls: 7, caused_turnovers: 4, faceoff_wins: 8, faceoff_losses: 10, saves: 0, goals_against: 0 },
  { player: 'Mason Bowers', opponent: 'Ottawa Hills', season_year: 2024, game_date: '2024-05-22', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 4, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zachary Zitkovic', opponent: 'Chagrin Falls', season_year: 2022, game_date: '2022-05-31', round: 4, game_type: 'playoff', goals: 0, assists: 2, points: 2, shots: 0, ground_balls: 1, caused_turnovers: 4, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Drew Dunphy', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 4, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cooper Hoyt', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 4, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Colton Bollenbacher', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 5, caused_turnovers: 3, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Tyler Meader', opponent: 'Olmsted Falls', season_year: 2023, game_date: '2023-05-24', round: 8, game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 13, ground_balls: 4, caused_turnovers: 3, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Declan Loisel', opponent: 'Southview', season_year: 2024, game_date: '2024-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 3, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'George Jacob', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', round: 32, game_type: 'playoff', goals: 4, assists: 0, points: 4, shots: 10, ground_balls: 2, caused_turnovers: 3, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Gage Buck', opponent: 'Ottawa Hills', season_year: 2024, game_date: '2024-05-22', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 3, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cooper Hoyt', opponent: 'Walsh Jesuit', season_year: 2023, game_date: '2023-05-22', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 3, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nico Kruez', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 3, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zachary Zitkovic', opponent: 'Walsh Jesuit', season_year: 2023, game_date: '2023-05-22', round: 16, game_type: 'playoff', goals: 1, assists: 2, points: 3, shots: 2, ground_balls: 1, caused_turnovers: 3, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cooper Hoyt', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 3, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Drew Dunphy', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 3, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Tyler Meader', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 11, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Tyler Meader', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 9, caused_turnovers: 2, faceoff_wins: 11, faceoff_losses: 11, saves: 0, goals_against: 0 },
  { player: 'Anthony Brohl', opponent: 'Rocky River', season_year: 2023, game_date: '2023-05-19', round: 32, game_type: 'playoff', goals: 4, assists: 0, points: 4, shots: 5, ground_balls: 8, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Gage Buck', opponent: 'Southview', season_year: 2024, game_date: '2024-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 8, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Tyler Meader', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 1, ground_balls: 6, caused_turnovers: 2, faceoff_wins: 9, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Cooper Hoyt', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 5, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Mason Bowers', opponent: 'Southview', season_year: 2024, game_date: '2024-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 4, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Adam Colburn', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 4, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Kaden King', opponent: 'Ottawa Hills', season_year: 2022, game_date: '2022-05-26', round: 8, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 4, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Anthony Brohl', opponent: 'Walsh Jesuit', season_year: 2023, game_date: '2023-05-22', round: 16, game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 4, ground_balls: 3, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Drew Duesing', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 4, ground_balls: 3, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Charlie Anderson', opponent: 'Ottawa Hills', season_year: 2022, game_date: '2022-05-26', round: 8, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 3, ground_balls: 3, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Gage Buck', opponent: 'Wooster', season_year: 2024, game_date: '2024-05-30', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 3, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cooper Hoyt', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 3, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Andrew Balcerzak', opponent: 'Southview', season_year: 2024, game_date: '2024-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Kyler Ayers', opponent: 'Ottawa Hills', season_year: 2024, game_date: '2024-05-22', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zachary Zitkovic', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Joshua Lee', opponent: 'Southview', season_year: 2024, game_date: '2024-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 2, ground_balls: 2, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zack Moon', opponent: 'Chagrin Falls', season_year: 2022, game_date: '2022-05-31', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 2, ground_balls: 2, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ryan Smith', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 1, ground_balls: 2, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Kaden King', opponent: 'Rocky River', season_year: 2023, game_date: '2023-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Abe Townley', opponent: 'Chagrin Falls', season_year: 2022, game_date: '2022-05-31', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Jude Dzierwa', opponent: 'Southview', season_year: 2024, game_date: '2024-05-16', round: 64, game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 8, ground_balls: 1, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Joshua Kraus', opponent: 'St. Francis Toledo', season_year: 2021, game_date: '2021-05-24', game_type: 'playoff', goals: 1, assists: 1, points: 2, shots: 3, ground_balls: 1, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Abe Townley', opponent: 'Olmsted Falls', season_year: 2023, game_date: '2023-05-24', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alexander Speer', opponent: 'Rocky River', season_year: 2024, game_date: '2024-05-28', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 3, ground_balls: 0, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Wiklendt', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 1, assists: 2, points: 3, shots: 2, ground_balls: 0, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Abe Townley', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Abe Townley', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Colton Bollenbacher', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Tyler Meader', opponent: 'Walsh Jesuit', season_year: 2023, game_date: '2023-05-22', round: 16, game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 8, ground_balls: 9, caused_turnovers: 1, faceoff_wins: 3, faceoff_losses: 2, saves: 0, goals_against: 0 },
  { player: 'Cooper Hoyt', opponent: 'Ottawa Hills', season_year: 2022, game_date: '2022-05-26', round: 8, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 7, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Adam Colburn', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 6, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Tyler Meader', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 5, ground_balls: 5, caused_turnovers: 1, faceoff_wins: 8, faceoff_losses: 3, saves: 0, goals_against: 0 },
  { player: 'Tyler Meader', opponent: 'Chagrin Falls', season_year: 2022, game_date: '2022-05-31', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 5, caused_turnovers: 1, faceoff_wins: 1, faceoff_losses: 8, saves: 0, goals_against: 0 },
  { player: 'Declan Loisel', opponent: 'Ottawa Hills', season_year: 2024, game_date: '2024-05-22', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 2, ground_balls: 5, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Anthony Brohl', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 5, ground_balls: 4, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zachary Zitkovic', opponent: 'Ottawa Hills', season_year: 2022, game_date: '2022-05-26', round: 8, game_type: 'playoff', goals: 1, assists: 3, points: 4, shots: 4, ground_balls: 4, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Tyler Meader', opponent: 'St. Francis Toledo', season_year: 2021, game_date: '2021-05-24', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 4, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Tyler Meader', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 7, ground_balls: 3, caused_turnovers: 1, faceoff_wins: 2, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Gage Buck', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 4, ground_balls: 3, caused_turnovers: 1, faceoff_wins: 1, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Andrew Miller', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', round: 32, game_type: 'playoff', goals: 3, assists: 0, points: 3, shots: 11, ground_balls: 3, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Joshua Kraus', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 7, ground_balls: 3, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'George Jacob', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 3, assists: 1, points: 4, shots: 6, ground_balls: 3, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Wiklendt', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', round: 32, game_type: 'playoff', goals: 0, assists: 4, points: 4, shots: 4, ground_balls: 3, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Kaden King', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 3, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nico Kruez', opponent: 'Rocky River', season_year: 2023, game_date: '2023-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 0, ground_balls: 3, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Kaden King', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Kaden King', opponent: 'Chagrin Falls', season_year: 2022, game_date: '2022-05-31', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ian Moloney', opponent: 'Southview', season_year: 2024, game_date: '2024-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 1, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Quinn Wiklendt', opponent: 'Southview', season_year: 2024, game_date: '2024-05-16', round: 64, game_type: 'playoff', goals: 1, assists: 5, points: 6, shots: 6, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Wiklendt', opponent: 'Ottawa Hills', season_year: 2022, game_date: '2022-05-26', round: 8, game_type: 'playoff', goals: 1, assists: 1, points: 2, shots: 5, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ryan Smith', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 1, assists: 2, points: 3, shots: 4, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cameron Weinberg', opponent: 'Ottawa Hills', season_year: 2022, game_date: '2022-05-26', round: 8, game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 2, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zack Moon', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 2, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zachary Zitkovic', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 1, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Will Halker', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Noah Lee', opponent: 'Rocky River', season_year: 2024, game_date: '2024-05-28', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Joshua Lee', opponent: 'Wooster', season_year: 2024, game_date: '2024-05-30', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Kaden King', opponent: 'Walsh Jesuit', season_year: 2023, game_date: '2023-05-22', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Miller', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Drew Dunphy', opponent: 'St. Francis Toledo', season_year: 2021, game_date: '2021-05-24', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ian Moloney', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 1, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Jude Dzierwa', opponent: 'Ottawa Hills', season_year: 2024, game_date: '2024-05-22', game_type: 'playoff', goals: 3, assists: 0, points: 3, shots: 7, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Will Bohne', opponent: 'Chagrin Falls', season_year: 2022, game_date: '2022-05-31', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 4, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Strayer', opponent: 'Rocky River', season_year: 2024, game_date: '2024-05-28', round: 16, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 3, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Anthony Brohl', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 3, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Wiklendt', opponent: 'Ottawa Hills', season_year: 2024, game_date: '2024-05-22', game_type: 'playoff', goals: 1, assists: 3, points: 4, shots: 2, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alexander Speer', opponent: 'Rocky River', season_year: 2023, game_date: '2023-05-19', round: 32, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 2, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Gage Buck', opponent: 'Rocky River', season_year: 2024, game_date: '2024-05-28', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 2, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Charlie Anderson', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 2, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nate Miller', opponent: 'Ottawa Hills', season_year: 2022, game_date: '2022-05-26', round: 8, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 1, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 2, saves: 0, goals_against: 0 },
  { player: 'Noah Lee', opponent: 'Ottawa Hills', season_year: 2024, game_date: '2024-05-22', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Joshua Lee', opponent: 'Ottawa Hills', season_year: 2024, game_date: '2024-05-22', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Andrew Heban', opponent: 'Olmsted Falls', season_year: 2023, game_date: '2023-05-24', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nico Kruez', opponent: 'Walsh Jesuit', season_year: 2023, game_date: '2023-05-22', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cooper Hoyt', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cooper Hoyt', opponent: 'St. Francis Toledo', season_year: 2021, game_date: '2021-05-24', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Charlie Anderson', opponent: 'St. Francis Toledo', season_year: 2021, game_date: '2021-05-24', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Wiklendt', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 1, assists: 7, points: 8, shots: 2, ground_balls: 0, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Andrew Balcerzak', opponent: 'Ottawa Hills', season_year: 2024, game_date: '2024-05-22', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Andrew Heban', opponent: 'Walsh Jesuit', season_year: 2023, game_date: '2023-05-22', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Abe Townley', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zack Moon', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Abe Townley', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Gage Knapp', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Will Bohne', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 4, assists: 0, points: 4, shots: 16, ground_balls: 10, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Winkler', opponent: 'Ottawa Hills', season_year: 2024, game_date: '2024-05-22', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 9, caused_turnovers: 0, faceoff_wins: 13, faceoff_losses: 4, saves: 0, goals_against: 0 },
  { player: 'Quinn Wiklendt', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 1, assists: 4, points: 5, shots: 4, ground_balls: 9, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Tyler Meader', opponent: 'Rocky River', season_year: 2023, game_date: '2023-05-19', round: 32, game_type: 'playoff', goals: 4, assists: 0, points: 4, shots: 8, ground_balls: 7, caused_turnovers: 0, faceoff_wins: 2, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Zachary Zitkovic', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 0, assists: 3, points: 3, shots: 3, ground_balls: 7, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Staten', opponent: 'Rocky River', season_year: 2023, game_date: '2023-05-19', round: 32, game_type: 'playoff', goals: 3, assists: 1, points: 4, shots: 8, ground_balls: 6, caused_turnovers: 0, faceoff_wins: 9, faceoff_losses: 3, saves: 0, goals_against: 0 },
  { player: 'Cole Kovacs', opponent: 'St. Francis Toledo', season_year: 2021, game_date: '2021-05-24', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 6, caused_turnovers: 0, faceoff_wins: 9, faceoff_losses: 9, saves: 0, goals_against: 0 },
  { player: 'Quinn Staten', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 1, assists: 3, points: 4, shots: 4, ground_balls: 5, caused_turnovers: 0, faceoff_wins: 9, faceoff_losses: 2, saves: 0, goals_against: 0 },
  { player: 'Zachary Zitkovic', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 7, ground_balls: 5, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Charlie Anderson', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 2, ground_balls: 5, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zachary Zitkovic', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 5, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Winkler', opponent: 'Southview', season_year: 2024, game_date: '2024-05-16', round: 64, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 1, ground_balls: 4, caused_turnovers: 0, faceoff_wins: 13, faceoff_losses: 7, saves: 0, goals_against: 0 },
  { player: 'Cole Kovacs', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 4, caused_turnovers: 0, faceoff_wins: 6, faceoff_losses: 5, saves: 0, goals_against: 0 },
  { player: 'Nate Miller', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 5, ground_balls: 4, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Jude Dzierwa', opponent: 'Rocky River', season_year: 2023, game_date: '2023-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 1, ground_balls: 4, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Miller', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 4, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Kaden King', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 4, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Adam Colburn', opponent: 'Rocky River', season_year: 2023, game_date: '2023-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 4, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nico Kruez', opponent: 'Olmsted Falls', season_year: 2023, game_date: '2023-05-24', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 4, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Winkler', opponent: 'Rocky River', season_year: 2024, game_date: '2024-05-28', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 7, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Staten', opponent: 'Walsh Jesuit', season_year: 2023, game_date: '2023-05-22', round: 16, game_type: 'playoff', goals: 1, assists: 1, points: 2, shots: 5, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 6, faceoff_losses: 2, saves: 0, goals_against: 0 },
  { player: 'Nate Miller', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 2, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 2, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Quinn Staten', opponent: 'Olmsted Falls', season_year: 2023, game_date: '2023-05-24', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 5, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 2, faceoff_losses: 11, saves: 0, goals_against: 0 },
  { player: 'Drew Duesing', opponent: 'Southview', season_year: 2024, game_date: '2024-05-16', round: 64, game_type: 'playoff', goals: 3, assists: 0, points: 3, shots: 11, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Anthony Brohl', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 7, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Drew Duesing', opponent: 'Ottawa Hills', season_year: 2024, game_date: '2024-05-22', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 7, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zack Moon', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 1, assists: 3, points: 4, shots: 3, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cameron Weinberg', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 3, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Brandon Rundquist', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 2, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Jude Dzierwa', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 2, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ian Moloney', opponent: 'Ottawa Hills', season_year: 2024, game_date: '2024-05-22', game_type: 'playoff', goals: 1, assists: 1, points: 2, shots: 1, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Charlie Anderson', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 1, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cooper Hoyt', opponent: 'Rocky River', season_year: 2023, game_date: '2023-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Kyler Ayers', opponent: 'Rocky River', season_year: 2024, game_date: '2024-05-28', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Kaden King', opponent: 'Olmsted Falls', season_year: 2023, game_date: '2023-05-24', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cooper Hoyt', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Colton Bollenbacher', opponent: 'St. Francis Toledo', season_year: 2021, game_date: '2021-05-24', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Kaden King', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Winkler', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 6, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Staten', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 3, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 4, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nate Miller', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 3, faceoff_losses: 2, saves: 0, goals_against: 0 },
  { player: 'Nate Miller', opponent: 'Chagrin Falls', season_year: 2022, game_date: '2022-05-31', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 7, faceoff_losses: 5, saves: 0, goals_against: 0 },
  { player: 'Nate Miller', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 1, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 1, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Nate Miller', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 2, faceoff_losses: 4, saves: 0, goals_against: 0 },
  { player: 'Anthony Brohl', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 6, assists: 2, points: 8, shots: 12, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Will Bohne', opponent: 'Ottawa Hills', season_year: 2022, game_date: '2022-05-26', round: 8, game_type: 'playoff', goals: 2, assists: 1, points: 3, shots: 11, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Will Bohne', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 9, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zachary Zitkovic', opponent: 'Rocky River', season_year: 2023, game_date: '2023-05-19', round: 32, game_type: 'playoff', goals: 1, assists: 2, points: 3, shots: 6, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alexander Speer', opponent: 'Southview', season_year: 2024, game_date: '2024-05-16', round: 64, game_type: 'playoff', goals: 3, assists: 0, points: 3, shots: 6, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alexander Speer', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 5, assists: 7, points: 12, shots: 5, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Anthony Brohl', opponent: 'Olmsted Falls', season_year: 2023, game_date: '2023-05-24', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 5, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alexander Speer', opponent: 'Wooster', season_year: 2024, game_date: '2024-05-30', game_type: 'playoff', goals: 3, assists: 0, points: 3, shots: 4, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Will Bohne', opponent: 'Olmsted Falls', season_year: 2023, game_date: '2023-05-24', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 4, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Wiklendt', opponent: 'Wooster', season_year: 2024, game_date: '2024-05-30', round: 8, game_type: 'playoff', goals: 1, assists: 4, points: 5, shots: 3, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Anthony Brohl', opponent: 'Chagrin Falls', season_year: 2022, game_date: '2022-05-31', game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 3, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Staten', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 3, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Wiklendt', opponent: 'St. Francis Toledo', season_year: 2021, game_date: '2021-05-24', game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 3, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Anthony Brohl', opponent: 'Ottawa Hills', season_year: 2022, game_date: '2022-05-26', round: 8, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 3, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cameron Weinberg', opponent: 'Walsh Jesuit', season_year: 2023, game_date: '2023-05-22', round: 16, game_type: 'playoff', goals: 0, assists: 2, points: 2, shots: 2, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Jude Dzierwa', opponent: 'Walsh Jesuit', season_year: 2023, game_date: '2023-05-22', round: 16, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 1, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zack Moon', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zachary Zitkovic', opponent: 'St. Francis Toledo', season_year: 2021, game_date: '2021-05-24', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Kaden King', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Winkler', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 3, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Winkler', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 1, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Gage Buck', opponent: 'Rocky River', season_year: 2023, game_date: '2023-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 1, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Gage Buck', opponent: 'Chagrin Falls', season_year: 2022, game_date: '2022-05-31', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 1, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Staten', opponent: 'Chagrin Falls', season_year: 2022, game_date: '2022-05-31', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 2, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 1, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Cole Kovacs', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 3, faceoff_losses: 4, saves: 0, goals_against: 0 },
  { player: 'Owen Winkler', opponent: 'Rocky River', season_year: 2023, game_date: '2023-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 1, faceoff_losses: 3, saves: 0, goals_against: 0 },
  { player: 'Andrew Miller', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 7, assists: 0, points: 7, shots: 9, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Staten', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 8, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Will Bohne', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 3, assists: 1, points: 4, shots: 6, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Drew Duesing', opponent: 'Wooster', season_year: 2024, game_date: '2024-05-30', game_type: 'playoff', goals: 1, assists: 2, points: 3, shots: 5, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alexander Speer', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 5, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Drew Duesing', opponent: 'Rocky River', season_year: 2024, game_date: '2024-05-28', round: 16, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 5, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Griffin Lenke', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 4, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alexander Speer', opponent: 'Ottawa Hills', season_year: 2024, game_date: '2024-05-22', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 4, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Griffin Lenke', opponent: 'St. Francis Toledo', season_year: 2021, game_date: '2021-05-24', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 4, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Griffin Lenke', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 4, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Anthony Brohl', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 3, assists: 1, points: 4, shots: 3, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Strayer', opponent: 'Southview', season_year: 2024, game_date: '2024-05-16', round: 64, game_type: 'playoff', goals: 1, assists: 1, points: 2, shots: 3, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Wiklendt', opponent: 'Chagrin Falls', season_year: 2022, game_date: '2022-05-31', game_type: 'playoff', goals: 1, assists: 1, points: 2, shots: 3, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Strayer', opponent: 'Wooster', season_year: 2024, game_date: '2024-05-30', game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 3, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ian Moloney', opponent: 'Wooster', season_year: 2024, game_date: '2024-05-30', game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 3, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alexander Speer', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 3, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Miller', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 3, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cameron Weinberg', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 3, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Staten', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 2, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 4, saves: 0, goals_against: 0 },
  { player: 'Quinn Staten', opponent: 'Ottawa Hills', season_year: 2022, game_date: '2022-05-26', round: 8, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 2, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cameron Weinberg', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 2, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Jude Dzierwa', opponent: 'Wooster', season_year: 2024, game_date: '2024-05-30', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 2, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Drew Duesing', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 1, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Joshua Lee', opponent: 'Rocky River', season_year: 2024, game_date: '2024-05-28', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Declan Loisel', opponent: 'Rocky River', season_year: 2024, game_date: '2024-05-28', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Jude Dzierwa', opponent: 'Rocky River', season_year: 2024, game_date: '2024-05-28', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Jude Dzierwa', opponent: 'Olmsted Falls', season_year: 2023, game_date: '2023-05-24', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zack Moon', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ryan Smith', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Joshua Kraus', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'John Beutel', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ryan Smith', opponent: 'Rocky River', season_year: 2023, game_date: '2023-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cameron Weinberg', opponent: 'Olmsted Falls', season_year: 2023, game_date: '2023-05-24', game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Wiklendt', opponent: 'Olmsted Falls', season_year: 2023, game_date: '2023-05-24', game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Liam Mack', opponent: 'Southview', season_year: 2024, game_date: '2024-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Kyler Ayers', opponent: 'Southview', season_year: 2024, game_date: '2024-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ian Moloney', opponent: 'Rocky River', season_year: 2024, game_date: '2024-05-28', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Noah Lee', opponent: 'Wooster', season_year: 2024, game_date: '2024-05-30', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Mason Bowers', opponent: 'Wooster', season_year: 2024, game_date: '2024-05-30', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Kyler Ayers', opponent: 'Wooster', season_year: 2024, game_date: '2024-05-30', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Andrew Heban', opponent: 'Rocky River', season_year: 2023, game_date: '2023-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cooper Hoyt', opponent: 'Olmsted Falls', season_year: 2023, game_date: '2023-05-24', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Adam Colburn', opponent: 'Walsh Jesuit', season_year: 2023, game_date: '2023-05-22', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Abe Townley', opponent: 'Walsh Jesuit', season_year: 2023, game_date: '2023-05-22', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Maverick Neal', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alexander Speer', opponent: 'Ottawa Hills', season_year: 2022, game_date: '2022-05-26', round: 8, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Jude Dzierwa', opponent: 'Ottawa Hills', season_year: 2022, game_date: '2022-05-26', round: 8, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nico Kruez', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Miller', opponent: 'Chagrin Falls', season_year: 2022, game_date: '2022-05-31', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cooper Hoyt', opponent: 'Chagrin Falls', season_year: 2022, game_date: '2022-05-31', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Andrew Heban', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Staten', opponent: 'St. Francis Toledo', season_year: 2021, game_date: '2021-05-24', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Gage Knapp', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Winkler', opponent: 'Walsh Jesuit', season_year: 2023, game_date: '2023-05-22', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 1, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Gage Buck', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 3, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Gage Buck', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 1, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Owen Winkler', opponent: 'Wooster', season_year: 2024, game_date: '2024-05-30', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 7, faceoff_losses: 11, saves: 0, goals_against: 0 },
  { player: 'Alexander Speer', opponent: 'Walsh Jesuit', season_year: 2023, game_date: '2023-05-22', round: 16, game_type: 'playoff', goals: 4, assists: 1, points: 5, shots: 7, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Wiklendt', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 3, assists: 3, points: 6, shots: 5, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Andrew Miller', opponent: 'St. Francis Toledo', season_year: 2021, game_date: '2021-05-24', game_type: 'playoff', goals: 1, assists: 2, points: 3, shots: 4, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zachary Zitkovic', opponent: 'Olmsted Falls', season_year: 2023, game_date: '2023-05-24', game_type: 'playoff', goals: 1, assists: 1, points: 2, shots: 4, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Will Bohne', opponent: 'St. Francis Toledo', season_year: 2021, game_date: '2021-05-24', game_type: 'playoff', goals: 1, assists: 1, points: 2, shots: 4, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Will Bohne', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 4, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alexander Speer', opponent: 'Olmsted Falls', season_year: 2023, game_date: '2023-05-24', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 4, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Will Bohne', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 3, assists: 0, points: 3, shots: 3, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Charlie Anderson', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 3, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cameron Weinberg', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 1, assists: 1, points: 2, shots: 2, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Drew Duesing', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 1, assists: 1, points: 2, shots: 2, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alex Snyder', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 2, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Jude Dzierwa', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 2, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alexander Speer', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 2, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'George Jacob', opponent: 'St. Francis Toledo', season_year: 2021, game_date: '2021-05-24', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 2, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Strayer', opponent: 'Ottawa Hills', season_year: 2024, game_date: '2024-05-22', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 2, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cameron Weinberg', opponent: 'Rocky River', season_year: 2023, game_date: '2023-05-19', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 2, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Andrew Heban', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 1, assists: 1, points: 2, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Wiklendt', opponent: 'Rocky River', season_year: 2024, game_date: '2024-05-28', round: 16, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zachary Zitkovic', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Charlie Anderson', opponent: 'Chagrin Falls', season_year: 2022, game_date: '2022-05-31', game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Andrew Heban', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Mariano Regalado', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Charlie Anderson', opponent: 'St. Francis Toledo', season_year: 2022, game_date: '2022-05-23', round: 16, game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Zack Moon', opponent: 'St. Francis Toledo', season_year: 2021, game_date: '2021-05-24', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Declan Loisel', opponent: 'Wooster', season_year: 2024, game_date: '2024-05-30', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ryan Smith', opponent: 'Walsh Jesuit', season_year: 2023, game_date: '2023-05-22', round: 16, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Strayer', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Henry Robie', opponent: 'Benedictine', season_year: 2023, game_date: '2023-05-16', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Mason Bowers', opponent: 'Benedictine', season_year: 2022, game_date: '2022-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Drew Duesing', opponent: 'Ottawa Hills', season_year: 2022, game_date: '2022-05-26', round: 8, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nico Kruez', opponent: 'Ottawa Hills', season_year: 2022, game_date: '2022-05-26', round: 8, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ryan Smith', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Mariano Regalado', opponent: 'Holy Name', season_year: 2022, game_date: '2022-05-20', round: 32, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Cameron Weinberg', opponent: 'Chagrin Falls', season_year: 2022, game_date: '2022-05-31', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Drew Duesing', opponent: 'Chagrin Falls', season_year: 2022, game_date: '2022-05-31', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ryan Smith', opponent: 'Benedictine', season_year: 2021, game_date: '2021-05-17', round: 64, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Andrew Heban', opponent: 'Ottawa Hills', season_year: 2022, game_date: '2022-05-26', round: 8, game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Nate Miller', opponent: 'St. Francis Toledo', season_year: 2021, game_date: '2021-05-24', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Quinn Staten', opponent: 'Ottawa Hills', season_year: 2021, game_date: '2021-05-20', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 2, saves: 0, goals_against: 0 },
  { player: 'Mason Bowers', opponent: 'University School', season_year: 2024, game_date: '2024-06-05', round: 4, game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 6, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Joshua Lee', opponent: 'University School', season_year: 2024, game_date: '2024-06-05', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Gage Buck', opponent: 'University School', season_year: 2024, game_date: '2024-06-05', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 4, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Declan Loisel', opponent: 'University School', season_year: 2024, game_date: '2024-06-05', game_type: 'playoff', goals: 0, assists: 1, points: 1, shots: 2, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Kyler Ayers', opponent: 'University School', season_year: 2024, game_date: '2024-06-05', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Noah Lee', opponent: 'University School', season_year: 2024, game_date: '2024-06-05', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Strayer', opponent: 'University School', season_year: 2024, game_date: '2024-06-05', game_type: 'playoff', goals: 3, assists: 0, points: 3, shots: 4, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ian Moloney', opponent: 'University School', season_year: 2024, game_date: '2024-06-05', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 3, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Winkler', opponent: 'University School', season_year: 2024, game_date: '2024-06-05', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 4, faceoff_losses: 11, saves: 0, goals_against: 0 },
  { player: 'Drew Duesing', opponent: 'University School', season_year: 2024, game_date: '2024-06-05', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 6, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alexander Speer', opponent: 'University School', season_year: 2024, game_date: '2024-06-05', game_type: 'playoff', goals: 2, assists: 1, points: 3, shots: 2, ground_balls: 2, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Jude Dzierwa', opponent: 'University School', season_year: 2024, game_date: '2024-06-05', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 5, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Quinn Wiklendt', opponent: 'University School', season_year: 2024, game_date: '2024-06-05', round: 4, game_type: 'playoff', goals: 1, assists: 4, points: 5, shots: 3, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Ian Moloney', opponent: 'Columbus DeSales', season_year: 2024, game_date: '2024-06-08', game_type: 'playoff', goals: 2, assists: 0, points: 2, shots: 2, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 2, saves: 0, goals_against: 0 },
  { player: 'Quinn Wiklendt', opponent: 'Columbus DeSales', season_year: 2024, game_date: '2024-06-08', game_type: 'playoff', goals: 0, assists: 2, points: 2, shots: 1, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Drew Duesing', opponent: 'Columbus DeSales', season_year: 2024, game_date: '2024-06-08', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alexander Speer', opponent: 'Columbus DeSales', season_year: 2024, game_date: '2024-06-08', game_type: 'playoff', goals: 1, assists: 0, points: 1, shots: 3, ground_balls: 1, caused_turnovers: 2, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Rex Grover', opponent: 'Columbus DeSales', season_year: 2024, game_date: '2024-06-08', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 0, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Noah Lee', opponent: 'Columbus DeSales', season_year: 2024, game_date: '2024-06-08', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Strayer', opponent: 'Columbus DeSales', season_year: 2024, game_date: '2024-06-08', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Owen Winkler', opponent: 'Columbus DeSales', season_year: 2024, game_date: '2024-06-08', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 4, caused_turnovers: 0, faceoff_wins: 10, faceoff_losses: 10, saves: 0, goals_against: 0 },
  { player: 'Gage Buck', opponent: 'Columbus DeSales', season_year: 2024, game_date: '2024-06-08', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 1, ground_balls: 3, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 1, saves: 0, goals_against: 0 },
  { player: 'Declan Loisel', opponent: 'Columbus DeSales', season_year: 2024, game_date: '2024-06-08', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Jude Dzierwa', opponent: 'Columbus DeSales', season_year: 2024, game_date: '2024-06-08', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 4, ground_balls: 2, caused_turnovers: 1, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Abe Altorok', opponent: 'Columbus DeSales', season_year: 2024, game_date: '2024-06-08', game_type: 'playoff', goals: 0, assists: 0, points: 0, shots: 0, ground_balls: 1, caused_turnovers: 0, faceoff_wins: 0, faceoff_losses: 0, saves: 0, goals_against: 0 },
  { player: 'Alex Weinberg', opponent: 'Southview', season_year: 2017, game_type: 'regular', goals: 10, points: 10 },
  { player: 'Larry Black', opponent: 'Chagrin/Olentangy', season_year: 2005, game_type: 'regular', goals: 8 },
  { player: 'Bennett Miller', opponent: 'Southview', season_year: 2015, game_type: 'regular', goals: 8, points: 10 },
  { player: 'Bennett Miller', opponent: 'Brunswick', season_year: 2016, game_type: 'regular', goals: 8, assists: 5, points: 10, shots: 16 },
  { player: 'Andrew Miller', opponent: 'Northview', season_year: 2021, game_type: 'regular', goals: 8, shots: 16 },
  { player: 'Alexander Speer', opponent: 'De La Salle Collegiate', season_year: 2024, game_type: 'regular', goals: 8 },
  { player: 'Bennett Miller', opponent: 'Erie McDowell', season_year: 2015, game_type: 'regular', goals: 7 },
  { player: 'Bennett Miller', opponent: 'Central Catholic', season_year: 2016, game_type: 'regular', goals: 7 },
  { player: 'Chandler Bankey', opponent: 'Wadsworth', season_year: 2019, game_type: 'regular', goals: 7, points: 10 },
  { player: 'Nathan Aloi', opponent: 'Ottawa Hills', season_year: 2019, game_type: 'regular', goals: 7, points: 9 },
  { player: 'Anthony Brohl', opponent: 'Perrysburg', season_year: 2023, game_type: 'regular', goals: 7 },
  { player: 'Alexander Speer', opponent: 'Westlake', season_year: 2024, game_type: 'regular', goals: 7 },
  { player: 'Quinn Wiklendt', opponent: 'Southview', season_year: 2021, game_type: 'regular', assists: 8 },
  { player: 'Quinn Wiklendt', opponent: 'Oakwood', season_year: 2022, game_type: 'regular', assists: 8, points: 11 },
  { player: 'Quinn Wiklendt', opponent: 'Westlake', season_year: 2024, game_type: 'regular', assists: 8, points: 9 },
  { player: 'Quinn Wiklendt', opponent: 'Northview', season_year: 2021, game_type: 'regular', assists: 7 },
  { player: 'Quinn Wiklendt', opponent: 'St. Francis', season_year: 2022, game_type: 'regular', assists: 7 },
  { player: 'Quinn Wiklendt', opponent: 'Northview', season_year: 2024, game_type: 'regular', assists: 7, points: 10 },
  { player: 'Quinn Wiklendt', opponent: 'De La Salle Collegiate', season_year: 2024, game_type: 'regular', assists: 7, points: 9 },
  { player: 'Brian Masterson', opponent: 'Dublin Coffman', season_year: 2006, game_type: 'regular', assists: 6, points: 10 },
  { player: 'Chandler Bankey', opponent: 'Southview', season_year: 2017, game_type: 'regular', assists: 5 },
  { player: 'Quinn Wiklendt', opponent: 'Oakwood', season_year: 2021, game_type: 'regular', assists: 5 },
  { player: 'Quinn Wiklendt', opponent: 'Bay', season_year: 2023, game_type: 'regular', assists: 5 },
  { player: 'Quinn Wiklendt', opponent: 'Revere', season_year: 2024, game_type: 'regular', assists: 5 },
  { player: 'Quinn Wiklendt', opponent: 'St. Mary\'s', season_year: 2024, game_type: 'regular', assists: 5 },
  { player: 'Quinn Wiklendt', opponent: 'Perrysburg', season_year: 2024, game_type: 'regular', assists: 5 },
  { player: 'Cameron Weinberg', opponent: 'Bowling Green', season_year: 2025, game_type: 'regular', assists: 5 },
  { player: 'Chris Nixon', opponent: 'Multiple', season_year: 2004, game_type: 'regular', points: 9 },
  { player: 'Alex Weinberg', opponent: 'Bowling Green', season_year: 2019, game_type: 'regular', points: 9 },
  { player: 'Chandler Bankey', opponent: 'Northview', season_year: 2019, game_type: 'regular', points: 9 },
  { player: 'Drew Duesing', opponent: 'Revere', season_year: 2024, game_type: 'regular', points: 9 },
  { player: 'Drew Duesing', opponent: 'Westlake', season_year: 2024, game_type: 'regular', shots: 23 },
  { player: 'Nathan Aloi', opponent: 'Strongsville', season_year: 2018, game_type: 'regular', shots: 17 },
  { player: 'Will Bohne', opponent: 'Southview', season_year: 2021, game_type: 'regular', shots: 17 },
  { player: 'Will Bohne', opponent: 'Shaker Heights', season_year: 2022, game_type: 'regular', shots: 17, ground_balls: 11 },
  { player: 'Bennett Miller', opponent: 'Ottawa Hills', season_year: 2015, game_type: 'regular', shots: 16 },
  { player: 'Bennett Miller', opponent: 'Strongsville', season_year: 2016, game_type: 'regular', shots: 16 },
  { player: 'Will Bohne', opponent: 'St. Francis', season_year: 2022, game_type: 'regular', shots: 16 },
  { player: 'Boyce Stansley', opponent: 'Bowling Green', season_year: 2015, game_type: 'regular', shots: 15 },
  { player: 'Jeff Szozda', opponent: 'Southview', season_year: 2017, game_type: 'regular', faceoff_wins: 21 },
  { player: 'Tyler Zetocha', opponent: 'Sylvania Northview', season_year: 2026, game_type: 'regular', faceoff_wins: 20, faceoff_losses: 0 },
  { player: 'Aiden Gage', opponent: 'Wooster', season_year: 2019, game_type: 'regular', faceoff_wins: 18 },
  { player: 'Nate Miller', opponent: 'Ottawa Hills', season_year: 2022, game_type: 'regular', faceoff_wins: 16 },
  { player: 'Owen Winkler', opponent: 'Revere', season_year: 2024, game_type: 'regular', faceoff_wins: 16 },
  { player: 'Owen Winkler', opponent: 'Detroit Country Day', season_year: 2024, game_type: 'regular', faceoff_wins: 16 },
  { player: 'Tyler Zetocha', opponent: 'Padua Franciscan', season_year: 2026, game_type: 'regular', ground_balls: 13, faceoff_wins: 16 },
  { player: 'Cole Kovacs', opponent: 'Anthony Wayne', season_year: 2021, game_type: 'regular', faceoff_wins: 15 },
  { player: 'Owen Winkler', opponent: 'Southview', season_year: 2024, game_type: 'regular', faceoff_wins: 15 },
  { player: 'Owen Winkler', opponent: 'Westlake', season_year: 2024, game_type: 'regular', faceoff_wins: 15 },
  { player: 'Tyler Zetocha', opponent: 'Ottawa Hills', season_year: 2026, game_type: 'regular', ground_balls: 15 },
  { player: 'James Reed', opponent: 'Cleveland Heights', season_year: 1994, game_type: 'regular', ground_balls: 14 },
  { player: 'Tyler Meader', opponent: 'Multiple', season_year: 2022, game_type: 'regular', ground_balls: 11 },
  { player: 'Will Bohne', opponent: 'Gahanna Lincoln', season_year: 2021, game_type: 'regular', ground_balls: 12 },
  { player: 'Tyler Meader', opponent: 'St. Francis', season_year: 2023, game_type: 'regular', ground_balls: 12, caused_turnovers: 6 },
  { player: 'Sam Rodgers', opponent: 'Westlake', season_year: 2019, game_type: 'regular', ground_balls: 11 },
  { player: 'Sam Rodgers', opponent: 'Brunswick', season_year: 2019, game_type: 'regular', ground_balls: 10 },
  { player: 'Noah Houpt', opponent: 'Shaker Heights', season_year: 2016, game_type: 'regular', saves: 20 },
  { player: 'Parker Thayer', opponent: 'Strongsville', season_year: 2017, game_type: 'regular', saves: 19 },
  { player: 'Nicholas Bowers', opponent: 'Perrysburg', season_year: 2022, game_type: 'regular', saves: 19 },
  { player: 'Mike Reilly', opponent: 'Chagrin Falls', season_year: 2004, game_type: 'regular', saves: 18 },
  { player: 'Braylon Lewis', opponent: 'Anthony Wayne', season_year: 2025, game_type: 'regular', saves: 18 },
  { player: 'Ian Horner', opponent: 'Oakwood', season_year: 2021, game_type: 'regular', saves: 17 },
  { player: 'Nicholas Bowers', opponent: 'St. Francis', season_year: 2022, game_type: 'regular', saves: 17 },
  { player: 'Dan Lach', opponent: 'Walsh Jesuit', season_year: 2021, game_type: 'regular', saves: 16 },
  { player: 'Nicholas Bowers', opponent: 'St. Francis', season_year: 2024, game_type: 'regular', saves: 16 },
  { player: 'Nicholas Bowers', opponent: 'Detroit Catholic Central', season_year: 2024, game_type: 'regular' },
  { player: 'Parker Thayer', opponent: 'Kenston', season_year: 2017, game_type: 'regular' },
  { player: 'Charlie Anderson', opponent: 'Chaminade-Julienne', season_year: 2022, game_type: 'regular' },
  { player: 'Braylon Lewis', opponent: 'Brother Rice', season_year: 2025, game_type: 'regular' },
  { player: 'Noah Houpt', opponent: 'St. Francis', season_year: 2016, game_type: 'regular' },
  { player: 'Mason Bowers', opponent: 'Southview', season_year: 2025, game_type: 'regular', caused_turnovers: 9 },
  { player: 'Jake Pieron', opponent: 'Southview', season_year: 2026, game_type: 'regular', caused_turnovers: 7 },
  { player: 'Jake Pieron', opponent: 'Walsh Jesuit', season_year: 2026, game_type: 'regular', caused_turnovers: 7 },
  { player: 'Sam Rodgers', opponent: 'Gahanna Lincoln', season_year: 2018, game_type: 'regular', caused_turnovers: 6 },
  { player: 'Tyler Meader', opponent: 'Westlake', season_year: 2021, game_type: 'regular', caused_turnovers: 6 },
  { player: 'Tyler Meader', opponent: 'St. Ignatius', season_year: 2022, game_type: 'regular', caused_turnovers: 6 },
  { player: 'Tyler Meader', opponent: 'Southview', season_year: 2022, game_type: 'regular', caused_turnovers: 6 },
  { player: 'Tyler Meader', opponent: 'Bay', season_year: 2022, game_type: 'regular', caused_turnovers: 6 },
  { player: 'Abe Townley', opponent: 'Anthony Wayne', season_year: 2023, game_type: 'regular', caused_turnovers: 6 },
  { player: 'Mason Bowers', opponent: 'U of D Jesuit', season_year: 2024, game_type: 'regular', caused_turnovers: 6 },
  { player: 'Alexander Speer', opponent: 'Ottawa Hills', season_year: 2025, round: 64, game_type: 'playoff', goals: 5, points: 6 },
  { player: 'Drew Duesing', opponent: 'Ottawa Hills', season_year: 2025, round: 64, game_type: 'playoff', goals: 4 },
  { player: 'Caleb DeLong', opponent: 'Rocky River', season_year: 2026, round: 16, game_type: 'playoff', shots: 13 },
  { player: 'Tyler Zetocha', opponent: 'Padua Franciscan', season_year: 2026, round: 32, game_type: 'playoff', ground_balls: 13, faceoff_wins: 16, faceoff_losses: 5 },
  { player: 'Nicholas Cope', opponent: 'Perrysburg', season_year: 2016, round: 32, game_type: 'playoff', faceoff_wins: 14, faceoff_losses: 2 },
  { player: 'Jeff Szozda', opponent: 'St. Ignatius', season_year: 2015, round: 32, game_type: 'playoff', faceoff_wins: 13 },
  { player: 'Tyler Zetocha', opponent: 'Rocky River', season_year: 2026, round: 16, game_type: 'playoff', faceoff_wins: 12 },
  { player: 'Owen Winkler', opponent: 'St. Francis Columbus', season_year: 2024, round: 2, game_type: 'playoff', faceoff_wins: 10 },
  { player: 'Sam Rodgers', opponent: 'Southview', season_year: 2019, round: 64, game_type: 'playoff', ground_balls: 8 },
  { player: 'Dylan Sobb', opponent: 'St. Francis Toledo', season_year: 2026, round: 64, game_type: 'playoff', saves: 12 },
  { player: 'Nicholas Bowers (8)/Ian Horner (2)', opponent: 'University School', season_year: 2024, round: 4, game_type: 'playoff', saves: 10 },
  { player: 'Braylon Lewis', opponent: 'Ottawa Hills', season_year: 2025, round: 64, game_type: 'playoff', saves: 9 },
  { player: 'Braylon Lewis', opponent: 'St. Francis Toledo', season_year: 2025, round: 32, game_type: 'playoff' },
  { player: 'Aiden Gage', opponent: 'Bowling Green', season_year: 2019, game_type: 'regular', faceoff_wins: 11, faceoff_losses: 0 },
  { player: 'Quinn Staten', opponent: 'Northview', season_year: 2021, game_type: 'regular', faceoff_wins: 10, faceoff_losses: 1 },
  { player: 'Jeff Szozda', opponent: 'Central', season_year: 2015, game_type: 'regular', faceoff_wins: 9, faceoff_losses: 1 },
  { player: 'Jeff Szozda', opponent: 'Stow', season_year: 2015, game_type: 'regular', faceoff_wins: 9, faceoff_losses: 1 },
  { player: 'Cole Kovacs', opponent: 'Gahanna Lincoln', season_year: 2021, game_type: 'regular', faceoff_wins: 11, faceoff_losses: 1 },
  { player: 'Quinn Staten', opponent: 'Gahanna Lincoln', season_year: 2021, game_type: 'regular', faceoff_wins: 9, faceoff_losses: 1 },
  { player: 'Jeff Szozda', opponent: 'Perrysburg', season_year: 2016, game_type: 'regular', faceoff_wins: 14, faceoff_losses: 2 },
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
  { players: ['Ian Horner'], opponent: 'Walsh', season_year: 2023, saves: 12, game_type: 'playoff', round: 16 },
  { players: ['Ian Horner'], opponent: 'Bay', season_year: 2023, saves: 9, game_type: 'regular' },
  { players: ['Ian Horner', 'Avery Jackson'], opponent: 'Gahanna Lincoln', season_year: 2021, saves: 3, game_type: 'regular' },
  { players: ['Ian Horner'], opponent: 'Benedictine', season_year: 2023, saves: 3, game_type: 'playoff', round: 64 },
  { players: ['Noah Houpt', 'Austin Honisko'], opponent: 'Central Catholic', season_year: 2016, saves: 2, game_type: 'regular' },
  { players: ['Ryan Pierce'], opponent: 'Bowling Green', season_year: 2019, saves: 1, game_type: 'regular' },
  // Corrected 2026-09-21: the Walsh and Benedictine 2023 shutouts were
  // originally seeded as 'regular' by default assumption -- cross-
  // referencing Playoff_Individual_Stats.pdf's save% board (which marks
  // complete-game shutouts with an asterisk) confirmed both are actually
  // playoff games (Walsh Jesuit round 16, Benedictine round 64), same
  // saves counts exactly. The other four are correctly regular season --
  // neither the opponent nor season appears anywhere in the playoff data.
  //
  // TODO: Andy's source sheet has playoff-specific caveats/minimums for
  // this board that haven't been specified yet -- until then, the
  // Playoff view shows the same full, uncapped list as Combined/Regular
  // (filtered to game_type: 'playoff' entries only), with no additional
  // minimum applied. Revisit once confirmed.
];

// --- Static SEASON and CAREER records -----------------------------
// Seeded 2026-09-21 from the two "Individual Stats" PDFs Andy added to
// the project (All_Individual_Stats.pdf = combined/regular view,
// Playoff_Individual_Stats.pdf = playoff view) -- these are Andy's own
// already-computed, authoritative top-10 boards, not raw data needing
// re-aggregation. Matched against live data by player identity + season
// (Season tier) or player identity alone (Career tier) -- a static entry
// is dropped only when live demonstrably covers or exceeds it, same
// "asserted baseline, live can override" principle as everywhere else
// this session. A handful of name-spelling variants within Andy's own
// PDFs were normalized with high confidence (Aidan/Aiden Gage, Nick/
// Nicholas Bowers, Nick/Nicholas Cope, Sam/Samuel Rodgers, Will/William
// Bohne, Zach/Zack Wester, Zach/Zachary Zitkovic) -- unlike the messier
// IndividualPlayoffs.xlsx names, these were all unambiguous nickname
// variants within one document.
//
// NOT seeded here: Season-tier rate stats (FO%/Save%) and the Combined-
// view Career FO%/Save% boards -- the source PDFs give only the final
// percentage for these, not the underlying attempt/shot counts needed to
// actually verify a qualifying minimum or render "FOW: X, Attempts: Y".
// The one exception is the Playoff-view Career FO% board below, which
// does list exact counts.
const STATIC_SEASON_RECORDS = [
  { player: 'Bennett Miller', stat: 'goals', season_year: 2016, value: 80, game_type: 'combined' },
  { player: 'Will Bohne', stat: 'goals', season_year: 2022, value: 75, game_type: 'combined' },
  { player: 'Andrew Miller', stat: 'goals', season_year: 2021, value: 73, game_type: 'combined' },
  { player: 'Alexander Speer', stat: 'goals', season_year: 2024, value: 64, game_type: 'combined' },
  { player: 'Chandler Bankey', stat: 'goals', season_year: 2019, value: 59, game_type: 'combined' },
  { player: 'Bennett Miller', stat: 'goals', season_year: 2015, value: 56, game_type: 'combined' },
  { player: 'Nathan Aloi', stat: 'goals', season_year: 2019, value: 56, game_type: 'combined' },
  { player: 'Larry Black', stat: 'goals', season_year: 2005, value: 52, game_type: 'combined' },
  { player: 'Connor Martin', stat: 'goals', season_year: 2009, value: 52, game_type: 'combined' },
  { player: 'Alexander Speer', stat: 'goals', season_year: 2025, value: 52, game_type: 'combined' },
  { player: 'Quinn Wiklendt', stat: 'assists', season_year: 2024, value: 84, game_type: 'combined' },
  { player: 'Quinn Wiklendt', stat: 'assists', season_year: 2022, value: 66, game_type: 'combined' },
  { player: 'Quinn Wiklendt', stat: 'assists', season_year: 2021, value: 49, game_type: 'combined' },
  { player: 'Brian Masterson', stat: 'assists', season_year: 2006, value: 47, game_type: 'combined' },
  { player: 'Bennett Miller', stat: 'assists', season_year: 2016, value: 39, game_type: 'combined' },
  { player: 'Zachary Zitkovic', stat: 'assists', season_year: 2022, value: 34, game_type: 'combined' },
  { player: 'Zachary Zitkovic', stat: 'assists', season_year: 2023, value: 32, game_type: 'combined' },
  { player: 'Zack Wester', stat: 'assists', season_year: 2016, value: 29, game_type: 'combined' },
  { player: 'Nathan Aloi', stat: 'assists', season_year: 2018, value: 28, game_type: 'combined' },
  { player: 'Quinn Wiklendt', stat: 'assists', season_year: 2023, value: 28, game_type: 'combined' },
  { player: 'Bennett Miller', stat: 'points', season_year: 2016, value: 119, game_type: 'combined' },
  { player: 'Quinn Wiklendt', stat: 'points', season_year: 2024, value: 101, game_type: 'combined' },
  { player: 'Quinn Wiklendt', stat: 'points', season_year: 2022, value: 95, game_type: 'combined' },
  { player: 'Andrew Miller', stat: 'points', season_year: 2021, value: 88, game_type: 'combined' },
  { player: 'Brian Masterson', stat: 'points', season_year: 2006, value: 84, game_type: 'combined' },
  { player: 'Will Bohne', stat: 'points', season_year: 2022, value: 84, game_type: 'combined' },
  { player: 'Nathan Aloi', stat: 'points', season_year: 2019, value: 83, game_type: 'combined' },
  { player: 'Chandler Bankey', stat: 'points', season_year: 2019, value: 78, game_type: 'combined' },
  { player: 'Chandler Bankey', stat: 'points', season_year: 2018, value: 75, game_type: 'combined' },
  { player: 'Nathan Aloi', stat: 'points', season_year: 2018, value: 74, game_type: 'combined' },
  { player: 'Will Bohne', stat: 'shots', season_year: 2022, value: 245, game_type: 'combined' },
  { player: 'Bennett Miller', stat: 'shots', season_year: 2016, value: 203, game_type: 'combined' },
  { player: 'Drew Duesing', stat: 'shots', season_year: 2024, value: 162, game_type: 'combined' },
  { player: 'Andrew Miller', stat: 'shots', season_year: 2021, value: 152, game_type: 'combined' },
  { player: 'Nathan Aloi', stat: 'shots', season_year: 2019, value: 149, game_type: 'combined' },
  { player: 'Caleb DeLong', stat: 'shots', season_year: 2026, value: 158, game_type: 'combined' },
  { player: 'Nathan Aloi', stat: 'shots', season_year: 2018, value: 145, game_type: 'combined' },
  { player: 'Alexander Speer', stat: 'shots', season_year: 2024, value: 139, game_type: 'combined' },
  { player: 'Chandler Bankey', stat: 'shots', season_year: 2019, value: 128, game_type: 'combined' },
  { player: 'Chandler Bankey', stat: 'shots', season_year: 2020, value: 128, game_type: 'combined' },
  { player: 'Bennett Miller', stat: 'shots', season_year: 2015, value: 126, game_type: 'combined' },
  { player: 'Owen Winkler', stat: 'faceoff_wins', season_year: 2024, value: 207, game_type: 'combined' },
  { player: 'Tyler Zetocha', stat: 'faceoff_wins', season_year: 2026, value: 194, game_type: 'combined' },
  { player: 'Jeff Szozda', stat: 'faceoff_wins', season_year: 2016, value: 176, game_type: 'combined' },
  { player: 'Cole Kovacs', stat: 'faceoff_wins', season_year: 2021, value: 157, game_type: 'combined' },
  { player: 'Aiden Gage', stat: 'faceoff_wins', season_year: 2019, value: 149, game_type: 'combined' },
  { player: 'Tyler Zetocha', stat: 'faceoff_wins', season_year: 2025, value: 142, game_type: 'combined' },
  { player: 'Nate Miller', stat: 'faceoff_wins', season_year: 2022, value: 133, game_type: 'combined' },
  { player: 'Aiden Gage', stat: 'faceoff_wins', season_year: 2018, value: 123, game_type: 'combined' },
  { player: 'Jeff Szozda', stat: 'faceoff_wins', season_year: 2015, value: 106, game_type: 'combined' },
  { player: 'Jeff Szozda', stat: 'faceoff_wins', season_year: 2017, value: 98, game_type: 'combined' },
  { player: 'Tyler Meader', stat: 'ground_balls', season_year: 2022, value: 174, game_type: 'combined' },
  { player: 'James Reed', stat: 'ground_balls', season_year: 1994, value: 135, game_type: 'combined' },
  { player: 'Tyler Meader', stat: 'ground_balls', season_year: 2023, value: 134, game_type: 'combined' },
  { player: 'Tyler Meader', stat: 'ground_balls', season_year: 2021, value: 96, game_type: 'combined' },
  { player: 'Sam Rodgers', stat: 'ground_balls', season_year: 2019, value: 94, game_type: 'combined' },
  { player: 'Tyler Zetocha', stat: 'ground_balls', season_year: 2026, value: 94, game_type: 'combined' },
  { player: 'Gage Buck', stat: 'ground_balls', season_year: 2024, value: 90, game_type: 'combined' },
  { player: 'Will Bohne', stat: 'ground_balls', season_year: 2022, value: 84, game_type: 'combined' },
  { player: 'Caleb DeLong', stat: 'ground_balls', season_year: 2026, value: 82, game_type: 'combined' },
  { player: 'Sam Rodgers', stat: 'ground_balls', season_year: 2018, value: 79, game_type: 'combined' },
  { player: 'Parker Thayer', stat: 'saves', season_year: 2017, value: 197, game_type: 'combined' },
  { player: 'Braylon Lewis', stat: 'saves', season_year: 2025, value: 165, game_type: 'combined' },
  { player: 'Nicholas Bowers', stat: 'saves', season_year: 2024, value: 158, game_type: 'combined' },
  { player: 'Noah Houpt', stat: 'saves', season_year: 2016, value: 157, game_type: 'combined' },
  { player: 'JD Keller', stat: 'saves', season_year: 2018, value: 156, game_type: 'combined' },
  { player: 'Ryan Pierce', stat: 'saves', season_year: 2019, value: 138, game_type: 'combined' },
  { player: 'Nicholas Bowers', stat: 'saves', season_year: 2022, value: 131, game_type: 'combined' },
  { player: 'Dan Lach', stat: 'saves', season_year: 2021, value: 126, game_type: 'combined' },
  { player: 'Connor Mischler', stat: 'saves', season_year: 2013, value: 118, game_type: 'combined' },
  { player: 'Ian Horner', stat: 'saves', season_year: 2023, value: 108, game_type: 'combined' },
  { player: 'Parker Thayer', stat: 'shots_against', season_year: 2017, value: 374, game_type: 'combined' },
  { player: 'JD Keller', stat: 'shots_against', season_year: 2018, value: 329, game_type: 'combined' },
  { player: 'Nicholas Bowers', stat: 'shots_against', season_year: 2024, value: 300, game_type: 'combined' },
  { player: 'Noah Houpt', stat: 'shots_against', season_year: 2016, value: 285, game_type: 'combined' },
  { player: 'Ryan Pierce', stat: 'shots_against', season_year: 2019, value: 276, game_type: 'combined' },
  { player: 'Braylon Lewis', stat: 'shots_against', season_year: 2025, value: 274, game_type: 'combined' },
  { player: 'Dan Lach', stat: 'shots_against', season_year: 2021, value: 249, game_type: 'combined' },
  { player: 'Nicholas Bowers', stat: 'shots_against', season_year: 2022, value: 234, game_type: 'combined' },
  { player: 'Mike Reilly', stat: 'shots_against', season_year: 2004, value: 211, game_type: 'combined' },
  { player: 'Connor Mischler', stat: 'shots_against', season_year: 2013, value: 189, game_type: 'combined' },
  { player: 'Tyler Meader', stat: 'caused_turnovers', season_year: 2022, value: 73, game_type: 'combined' },
  { player: 'Tyler Meader', stat: 'caused_turnovers', season_year: 2023, value: 51, game_type: 'combined' },
  { player: 'Mason Bowers', stat: 'caused_turnovers', season_year: 2024, value: 51, game_type: 'combined' },
  { player: 'Mason Bowers', stat: 'caused_turnovers', season_year: 2025, value: 48, game_type: 'combined' },
  { player: 'Tyler Meader', stat: 'caused_turnovers', season_year: 2021, value: 39, game_type: 'combined' },
  { player: 'Cooper Hoyt', stat: 'caused_turnovers', season_year: 2022, value: 36, game_type: 'combined' },
  { player: 'Sam Rodgers', stat: 'caused_turnovers', season_year: 2018, value: 34, game_type: 'combined' },
  { player: 'Cooper Hoyt', stat: 'caused_turnovers', season_year: 2023, value: 33, game_type: 'combined' },
  { player: 'Abe Townley', stat: 'caused_turnovers', season_year: 2023, value: 33, game_type: 'combined' },
  { player: 'Xander Lewis', stat: 'caused_turnovers', season_year: 2026, value: 33, game_type: 'combined' },
  { player: 'Colton Bollenbacher', stat: 'caused_turnovers', season_year: 2021, value: 30, game_type: 'combined' },
  { player: 'Jake Pieron', stat: 'caused_turnovers', season_year: 2026, value: 30, game_type: 'combined' },
  { player: 'Will Bohne', stat: 'goals', season_year: 2022, value: 13, game_type: 'playoff' },
  { player: 'Anthony Brohl', stat: 'goals', season_year: 2023, value: 13, game_type: 'playoff' },
  { player: 'Andrew Miller', stat: 'goals', season_year: 2021, value: 11, game_type: 'playoff' },
  { player: 'Chandler Bankey', stat: 'goals', season_year: 2019, value: 10, game_type: 'playoff' },
  { player: 'Anthony Brohl', stat: 'goals', season_year: 2022, value: 10, game_type: 'playoff' },
  { player: 'Alexander Speer', stat: 'goals', season_year: 2023, value: 10, game_type: 'playoff' },
  { player: 'Alexander Speer', stat: 'goals', season_year: 2024, value: 10, game_type: 'playoff' },
  { player: 'Nathan Aloi', stat: 'goals', season_year: 2019, value: 9, game_type: 'playoff' },
  { player: 'Tyler Meader', stat: 'goals', season_year: 2023, value: 9, game_type: 'playoff' },
  { player: 'Bennett Miller', stat: 'goals', season_year: 2016, value: 8, game_type: 'playoff' },
  { player: 'George Jacob', stat: 'goals', season_year: 2021, value: 8, game_type: 'playoff' },
  { player: 'Drew Duesing', stat: 'goals', season_year: 2024, value: 8, game_type: 'playoff' },
  { player: 'Quinn Wiklendt', stat: 'assists', season_year: 2024, value: 19, game_type: 'playoff' },
  { player: 'Quinn Wiklendt', stat: 'assists', season_year: 2022, value: 16, game_type: 'playoff' },
  { player: 'Zachary Zitkovic', stat: 'assists', season_year: 2022, value: 10, game_type: 'playoff' },
  { player: 'Alexander Speer', stat: 'assists', season_year: 2023, value: 8, game_type: 'playoff' },
  { player: 'Zack Wester', stat: 'assists', season_year: 2016, value: 6, game_type: 'playoff' },
  { player: 'Quinn Wiklendt', stat: 'assists', season_year: 2021, value: 6, game_type: 'playoff' },
  { player: 'Gareth Francis', stat: 'assists', season_year: 2019, value: 5, game_type: 'playoff' },
  { player: 'Nicholas Cope', stat: 'assists', season_year: 2019, value: 5, game_type: 'playoff' },
  { player: 'Nathan Aloi', stat: 'assists', season_year: 2019, value: 5, game_type: 'playoff' },
  { player: 'Quinn Staten', stat: 'assists', season_year: 2023, value: 5, game_type: 'playoff' },
  { player: 'Quinn Wiklendt', stat: 'points', season_year: 2022, value: 23, game_type: 'playoff' },
  { player: 'Quinn Wiklendt', stat: 'points', season_year: 2024, value: 23, game_type: 'playoff' },
  { player: 'Alexander Speer', stat: 'points', season_year: 2023, value: 18, game_type: 'playoff' },
  { player: 'Will Bohne', stat: 'points', season_year: 2022, value: 15, game_type: 'playoff' },
  { player: 'Anthony Brohl', stat: 'points', season_year: 2023, value: 15, game_type: 'playoff' },
  { player: 'Nathan Aloi', stat: 'points', season_year: 2019, value: 14, game_type: 'playoff' },
  { player: 'Chandler Bankey', stat: 'points', season_year: 2019, value: 13, game_type: 'playoff' },
  { player: 'Andrew Miller', stat: 'points', season_year: 2021, value: 13, game_type: 'playoff' },
  { player: 'Alex Weinberg', stat: 'points', season_year: 2019, value: 11, game_type: 'playoff' },
  { player: 'Anthony Brohl', stat: 'points', season_year: 2022, value: 11, game_type: 'playoff' },
  { player: 'Zachary Zitkovic', stat: 'points', season_year: 2022, value: 11, game_type: 'playoff' },
  { player: 'Will Bohne', stat: 'shots', season_year: 2022, value: 40, game_type: 'playoff' },
  { player: 'Tyler Meader', stat: 'shots', season_year: 2023, value: 36, game_type: 'playoff' },
  { player: 'Drew Duesing', stat: 'shots', season_year: 2024, value: 35, game_type: 'playoff' },
  { player: 'Nathan Aloi', stat: 'shots', season_year: 2019, value: 27, game_type: 'playoff' },
  { player: 'Jude Dzierwa', stat: 'shots', season_year: 2024, value: 27, game_type: 'playoff' },
  { player: 'Anthony Brohl', stat: 'shots', season_year: 2023, value: 26, game_type: 'playoff' },
  { player: 'Caleb DeLong', stat: 'shots', season_year: 2026, value: 26, game_type: 'playoff' },
  { player: 'Bennett Miller', stat: 'shots', season_year: 2016, value: 25, game_type: 'playoff' },
  { player: 'Andrew Miller', stat: 'shots', season_year: 2021, value: 24, game_type: 'playoff' },
  { player: 'Chandler Bankey', stat: 'shots', season_year: 2019, value: 22, game_type: 'playoff' },
  { player: 'Quinn Staten', stat: 'shots', season_year: 2023, value: 22, game_type: 'playoff' },
  { player: 'Alexander Speer', stat: 'shots', season_year: 2024, value: 22, game_type: 'playoff' },
  { player: 'Owen Winkler', stat: 'faceoff_wins', season_year: 2024, value: 54, game_type: 'playoff' },
  { player: 'Tyler Meader', stat: 'faceoff_wins', season_year: 2022, value: 37, game_type: 'playoff' },
  { player: 'Tyler Zetocha', stat: 'faceoff_wins', season_year: 2026, value: 36, game_type: 'playoff' },
  { player: 'Aiden Gage', stat: 'faceoff_wins', season_year: 2019, value: 27, game_type: 'playoff' },
  { player: 'Quinn Staten', stat: 'faceoff_wins', season_year: 2023, value: 26, game_type: 'playoff' },
  { player: 'Jeff Szozda', stat: 'faceoff_wins', season_year: 2015, value: 25, game_type: 'playoff' },
  { player: 'Nicholas Cope', stat: 'faceoff_wins', season_year: 2016, value: 22, game_type: 'playoff' },
  { player: 'Cole Kovacs', stat: 'faceoff_wins', season_year: 2021, value: 18, game_type: 'playoff' },
  { player: 'Tyler Zetocha', stat: 'faceoff_wins', season_year: 2025, value: 12, game_type: 'playoff' },
  { player: 'Nate Miller', stat: 'faceoff_wins', season_year: 2022, value: 10, game_type: 'playoff' },
  { player: 'Tyler Meader', stat: 'ground_balls', season_year: 2022, value: 32, game_type: 'playoff' },
  { player: 'Tyler Zetocha', stat: 'ground_balls', season_year: 2026, value: 25, game_type: 'playoff' },
  { player: 'Tyler Meader', stat: 'ground_balls', season_year: 2021, value: 23, game_type: 'playoff' },
  { player: 'Tyler Meader', stat: 'ground_balls', season_year: 2023, value: 23, game_type: 'playoff' },
  { player: 'Owen Winkler', stat: 'ground_balls', season_year: 2024, value: 22, game_type: 'playoff' },
  { player: 'Gage Buck', stat: 'ground_balls', season_year: 2024, value: 21, game_type: 'playoff' },
  { player: 'Sam Rodgers', stat: 'ground_balls', season_year: 2019, value: 19, game_type: 'playoff' },
  { player: 'Cooper Hoyt', stat: 'ground_balls', season_year: 2022, value: 19, game_type: 'playoff' },
  { player: 'Kaden King', stat: 'ground_balls', season_year: 2022, value: 17, game_type: 'playoff' },
  { player: 'Quinn Staten', stat: 'ground_balls', season_year: 2023, value: 17, game_type: 'playoff' },
  { player: 'Nicholas Bowers', stat: 'saves', season_year: 2022, value: 40, game_type: 'playoff' },
  { player: 'Ian Horner', stat: 'saves', season_year: 2023, value: 29, game_type: 'playoff' },
  { player: 'Ryan Pierce', stat: 'saves', season_year: 2019, value: 25, game_type: 'playoff' },
  { player: 'Ian Horner', stat: 'saves', season_year: 2024, value: 22, game_type: 'playoff' },
  { player: 'Dylan Sobb', stat: 'saves', season_year: 2026, value: 21, game_type: 'playoff' },
  { player: 'Noah Houpt', stat: 'saves', season_year: 2016, value: 18, game_type: 'playoff' },
  { player: 'Dan Lach', stat: 'saves', season_year: 2021, value: 18, game_type: 'playoff' },
  { player: 'Nicholas Bowers', stat: 'saves', season_year: 2024, value: 16, game_type: 'playoff' },
  { player: 'Braylon Lewis', stat: 'saves', season_year: 2025, value: 16, game_type: 'playoff' },
  { player: 'Noah Houpt', stat: 'saves', season_year: 2015, value: 15, game_type: 'playoff' },
  { player: 'Nicholas Bowers', stat: 'shots_against', season_year: 2022, value: 77, game_type: 'playoff' },
  { player: 'Ryan Pierce', stat: 'shots_against', season_year: 2019, value: 43, game_type: 'playoff' },
  { player: 'Dylan Sobb', stat: 'shots_against', season_year: 2026, value: 41, game_type: 'playoff' },
  { player: 'Nicholas Bowers', stat: 'shots_against', season_year: 2024, value: 40, game_type: 'playoff' },
  { player: 'Ian Horner', stat: 'shots_against', season_year: 2023, value: 38, game_type: 'playoff' },
  { player: 'Noah Houpt', stat: 'shots_against', season_year: 2016, value: 37, game_type: 'playoff' },
  { player: 'Ian Horner', stat: 'shots_against', season_year: 2024, value: 37, game_type: 'playoff' },
  { player: 'Braylon Lewis', stat: 'shots_against', season_year: 2025, value: 34, game_type: 'playoff' },
  { player: 'Dan Lach', stat: 'shots_against', season_year: 2021, value: 33, game_type: 'playoff' },
  { player: 'JD Keller', stat: 'shots_against', season_year: 2018, value: 32, game_type: 'playoff' },
  { player: 'Mason Bowers', stat: 'caused_turnovers', season_year: 2024, value: 17, game_type: 'playoff' },
  { player: 'Tyler Meader', stat: 'caused_turnovers', season_year: 2022, value: 10, game_type: 'playoff' },
  { player: 'Gage Buck', stat: 'caused_turnovers', season_year: 2024, value: 9, game_type: 'playoff' },
  { player: 'Cooper Hoyt', stat: 'caused_turnovers', season_year: 2021, value: 8, game_type: 'playoff' },
  { player: 'Tyler Meader', stat: 'caused_turnovers', season_year: 2021, value: 8, game_type: 'playoff' },
  { player: 'Drew Dunphy', stat: 'caused_turnovers', season_year: 2021, value: 8, game_type: 'playoff' },
  { player: 'Sam Rodgers', stat: 'caused_turnovers', season_year: 2019, value: 7, game_type: 'playoff' },
  { player: 'Abe Townley', stat: 'caused_turnovers', season_year: 2022, value: 7, game_type: 'playoff' },
  { player: 'Zachary Zitkovic', stat: 'caused_turnovers', season_year: 2022, value: 6, game_type: 'playoff' },
  { player: 'Colton Bollenbacher', stat: 'caused_turnovers', season_year: 2021, value: 5, game_type: 'playoff' },
];

const STATIC_CAREER_RECORDS = [
  { player: 'Alexander Speer', stat: 'goals', firstYear: 2022, lastYear: 2025, value: 165, game_type: 'combined' },
  { player: 'Nathan Aloi', stat: 'goals', firstYear: 2016, lastYear: 2019, value: 162, game_type: 'combined' },
  { player: 'Bennett Miller', stat: 'goals', firstYear: 2015, lastYear: 2016, value: 136, game_type: 'combined' },
  { player: 'Chandler Bankey', stat: 'goals', firstYear: 2016, lastYear: 2019, value: 130, game_type: 'combined' },
  { player: 'Will Bohne', stat: 'goals', firstYear: 2020, lastYear: 2023, value: 130, game_type: 'combined' },
  { player: 'Connor Martin', stat: 'goals', firstYear: 2007, lastYear: 2009, value: 117, game_type: 'combined' },
  { player: 'Matt Kennedy', stat: 'goals', firstYear: 2003, lastYear: 2006, value: 113, game_type: 'combined' },
  { player: 'Drew Duesing', stat: 'goals', firstYear: 2022, lastYear: 2025, value: 108, game_type: 'combined' },
  { player: 'Alex Weinberg', stat: 'goals', firstYear: 2017, lastYear: 2019, value: 98, game_type: 'combined' },
  { player: 'Owen Strayer', stat: 'goals', firstYear: 2023, lastYear: 2026, value: 88, game_type: 'combined' },
  { player: 'Quinn Wiklendt', stat: 'assists', firstYear: 2021, lastYear: 2024, value: 227, game_type: 'combined' },
  { player: 'Brian Masterson', stat: 'assists', firstYear: 2004, lastYear: 2006, value: 79, game_type: 'combined' },
  { player: 'Nathan Aloi', stat: 'assists', firstYear: 2016, lastYear: 2019, value: 79, game_type: 'combined' },
  { player: 'Chandler Bankey', stat: 'assists', firstYear: 2016, lastYear: 2019, value: 75, game_type: 'combined' },
  { player: 'Zachary Zitkovic', stat: 'assists', firstYear: 2021, lastYear: 2023, value: 67, game_type: 'combined' },
  { player: 'John Emmenecker', stat: 'assists', firstYear: 2012, lastYear: 2013, value: 59, game_type: 'combined' },
  { player: 'Bennett Miller', stat: 'assists', firstYear: 2015, lastYear: 2016, value: 53, game_type: 'combined' },
  { player: 'Nicholas Cope', stat: 'assists', firstYear: 2016, lastYear: 2019, value: 51, game_type: 'combined' },
  { player: 'Alex Weinberg', stat: 'assists', firstYear: 2017, lastYear: 2019, value: 51, game_type: 'combined' },
  { player: 'Connor Martin', stat: 'assists', firstYear: 2007, lastYear: 2009, value: 47, game_type: 'combined' },
  { player: 'Quinn Wiklendt', stat: 'points', firstYear: 2021, lastYear: 2024, value: 296, game_type: 'combined' },
  { player: 'Nathan Aloi', stat: 'points', firstYear: 2016, lastYear: 2019, value: 241, game_type: 'combined' },
  { player: 'Chandler Bankey', stat: 'points', firstYear: 2016, lastYear: 2019, value: 205, game_type: 'combined' },
  { player: 'Alexander Speer', stat: 'points', firstYear: 2022, lastYear: 2025, value: 199, game_type: 'combined' },
  { player: 'Bennett Miller', stat: 'points', firstYear: 2015, lastYear: 2016, value: 189, game_type: 'combined' },
  { player: 'Brian Masterson', stat: 'points', firstYear: 2004, lastYear: 2006, value: 165, game_type: 'combined' },
  { player: 'Connor Martin', stat: 'points', firstYear: 2007, lastYear: 2009, value: 164, game_type: 'combined' },
  { player: 'Will Bohne', stat: 'points', firstYear: 2020, lastYear: 2023, value: 157, game_type: 'combined' },
  { player: 'Drew Duesing', stat: 'points', firstYear: 2022, lastYear: 2025, value: 155, game_type: 'combined' },
  { player: 'Alex Weinberg', stat: 'points', firstYear: 2017, lastYear: 2019, value: 149, game_type: 'combined' },
  { player: 'Will Bohne', stat: 'shots', firstYear: 2020, lastYear: 2023, value: 472, game_type: 'combined' },
  { player: 'Nathan Aloi', stat: 'shots', firstYear: 2016, lastYear: 2019, value: 460, game_type: 'combined' },
  { player: 'Alexander Speer', stat: 'shots', firstYear: 2022, lastYear: 2025, value: 349, game_type: 'combined' },
  { player: 'Chandler Bankey', stat: 'shots', firstYear: 2016, lastYear: 2019, value: 339, game_type: 'combined' },
  { player: 'Bennett Miller', stat: 'shots', firstYear: 2015, lastYear: 2016, value: 329, game_type: 'combined' },
  { player: 'Drew Duesing', stat: 'shots', firstYear: 2022, lastYear: 2025, value: 323, game_type: 'combined' },
  { player: 'Owen Strayer', stat: 'shots', firstYear: 2023, lastYear: 2026, value: 315, game_type: 'combined' },
  { player: 'Alex Weinberg', stat: 'shots', firstYear: 2017, lastYear: 2019, value: 266, game_type: 'combined' },
  { player: 'Quinn Wiklendt', stat: 'shots', firstYear: 2021, lastYear: 2024, value: 235, game_type: 'combined' },
  { player: 'Cameron Weinberg', stat: 'shots', firstYear: 2022, lastYear: 2025, value: 211, game_type: 'combined' },
  { player: 'Jeff Szozda', stat: 'faceoff_wins', firstYear: 2015, lastYear: 2017, value: 380, game_type: 'combined' },
  { player: 'Tyler Zetocha', stat: 'faceoff_wins', firstYear: 2024, lastYear: 2026, value: 339, game_type: 'combined' },
  { player: 'Aiden Gage', stat: 'faceoff_wins', firstYear: 2017, lastYear: 2019, value: 312, game_type: 'combined' },
  { player: 'Owen Winkler', stat: 'faceoff_wins', firstYear: 2022, lastYear: 2024, value: 261, game_type: 'combined' },
  { player: 'Cole Kovacs', stat: 'faceoff_wins', firstYear: 2019, lastYear: 2021, value: 161, game_type: 'combined' },
  { player: 'Quinn Staten', stat: 'faceoff_wins', firstYear: 2021, lastYear: 2023, value: 159, game_type: 'combined' },
  { player: 'Nicholas Cope', stat: 'faceoff_wins', firstYear: 2016, lastYear: 2019, value: 156, game_type: 'combined' },
  { player: 'Nate Miller', stat: 'faceoff_wins', firstYear: 2022, lastYear: 2022, value: 143, game_type: 'combined' },
  { player: 'Tyler Meader', stat: 'faceoff_wins', firstYear: 2021, lastYear: 2022, value: 80, game_type: 'combined' },
  { player: 'Ryan Almester', stat: 'faceoff_wins', firstYear: 2015, lastYear: 2015, value: 66, game_type: 'combined' },
  { player: 'Tyler Meader', stat: 'ground_balls', firstYear: 2021, lastYear: 2023, value: 404, game_type: 'combined' },
  { player: 'Matt Kennedy', stat: 'ground_balls', firstYear: 2003, lastYear: 2006, value: 242, game_type: 'combined' },
  { player: 'Sam Rodgers', stat: 'ground_balls', firstYear: 2016, lastYear: 2019, value: 206, game_type: 'combined' },
  { player: 'Will Bohne', stat: 'ground_balls', firstYear: 2020, lastYear: 2023, value: 197, game_type: 'combined' },
  { player: 'Ray Huntzinger', stat: 'ground_balls', firstYear: 2015, lastYear: 2018, value: 194, game_type: 'combined' },
  { player: 'Nathan Aloi', stat: 'ground_balls', firstYear: 2016, lastYear: 2019, value: 168, game_type: 'combined' },
  { player: 'Ian Moloney', stat: 'ground_balls', firstYear: 2023, lastYear: 2026, value: 163, game_type: 'combined' },
  { player: 'Quinn Wiklendt', stat: 'ground_balls', firstYear: 2021, lastYear: 2024, value: 156, game_type: 'combined' },
  { player: 'Tyler Zetocha', stat: 'ground_balls', firstYear: 2023, lastYear: 2026, value: 151, game_type: 'combined' },
  { player: 'James Reed', stat: 'ground_balls', firstYear: 1994, lastYear: 1994, value: 135, game_type: 'combined' },
  { player: 'Nicholas Bowers', stat: 'saves', firstYear: 2022, lastYear: 2024, value: 323, game_type: 'combined' },
  { player: 'Noah Houpt', stat: 'saves', firstYear: 2015, lastYear: 2016, value: 262, game_type: 'combined' },
  { player: 'Parker Thayer', stat: 'saves', firstYear: 2015, lastYear: 2017, value: 201, game_type: 'combined' },
  { player: 'Ian Horner', stat: 'saves', firstYear: 2022, lastYear: 2024, value: 177, game_type: 'combined' },
  { player: 'Braylon Lewis', stat: 'saves', firstYear: 2025, lastYear: 2025, value: 165, game_type: 'combined' },
  { player: 'JD Keller', stat: 'saves', firstYear: 2018, lastYear: 2018, value: 156, game_type: 'combined' },
  { player: 'Ryan Pierce', stat: 'saves', firstYear: 2017, lastYear: 2020, value: 139, game_type: 'combined' },
  { player: 'Dan Lach', stat: 'saves', firstYear: 2021, lastYear: 2021, value: 126, game_type: 'combined' },
  { player: 'Connor Mischler', stat: 'saves', firstYear: 2013, lastYear: 2013, value: 118, game_type: 'combined' },
  { player: 'Dylan Sobb', stat: 'saves', firstYear: 2026, lastYear: 2026, value: 87, game_type: 'combined' },
  { player: 'Nicholas Bowers', stat: 'shots_against', firstYear: 2022, lastYear: 2024, value: 635, game_type: 'combined' },
  { player: 'Noah Houpt', stat: 'shots_against', firstYear: 2015, lastYear: 2016, value: 473, game_type: 'combined' },
  { player: 'Parker Thayer', stat: 'shots_against', firstYear: 2015, lastYear: 2017, value: 381, game_type: 'combined' },
  { player: 'JD Keller', stat: 'shots_against', firstYear: 2018, lastYear: 2018, value: 329, game_type: 'combined' },
  { player: 'Ian Horner', stat: 'shots_against', firstYear: 2022, lastYear: 2024, value: 282, game_type: 'combined' },
  { player: 'Ryan Pierce', stat: 'shots_against', firstYear: 2017, lastYear: 2020, value: 277, game_type: 'combined' },
  { player: 'Braylon Lewis', stat: 'shots_against', firstYear: 2025, lastYear: 2025, value: 274, game_type: 'combined' },
  { player: 'Dan Lach', stat: 'shots_against', firstYear: 2021, lastYear: 2021, value: 249, game_type: 'combined' },
  { player: 'Mike Reilly', stat: 'shots_against', firstYear: 2004, lastYear: 2004, value: 211, game_type: 'combined' },
  { player: 'Connor Mischler', stat: 'shots_against', firstYear: 2013, lastYear: 2013, value: 189, game_type: 'combined' },
  { player: 'Tyler Meader', stat: 'caused_turnovers', firstYear: 2021, lastYear: 2023, value: 163, game_type: 'combined' },
  { player: 'Mason Bowers', stat: 'caused_turnovers', firstYear: 2022, lastYear: 2024, value: 110, game_type: 'combined' },
  { player: 'Cooper Hoyt', stat: 'caused_turnovers', firstYear: 2021, lastYear: 2023, value: 89, game_type: 'combined' },
  { player: 'Sam Rodgers', stat: 'caused_turnovers', firstYear: 2016, lastYear: 2019, value: 81, game_type: 'combined' },
  { player: 'Abe Townley', stat: 'caused_turnovers', firstYear: 2021, lastYear: 2023, value: 57, game_type: 'combined' },
  { player: 'Xander Lewis', stat: 'caused_turnovers', firstYear: 2025, lastYear: 2026, value: 46, game_type: 'combined' },
  { player: 'Kaden King', stat: 'caused_turnovers', firstYear: 2021, lastYear: 2023, value: 45, game_type: 'combined' },
  { player: 'Quinn Wiklendt', stat: 'caused_turnovers', firstYear: 2021, lastYear: 2024, value: 42, game_type: 'combined' },
  { player: 'Kyler Ayers', stat: 'caused_turnovers', firstYear: 2024, lastYear: 2025, value: 41, game_type: 'combined' },
  { player: 'Jameson Moloney', stat: 'caused_turnovers', firstYear: 2025, lastYear: 2026, value: 35, game_type: 'combined' },
  { player: 'Zachary Zitkovic', stat: 'caused_turnovers', firstYear: 2021, lastYear: 2023, value: 34, game_type: 'combined' },
  { player: 'Ian Moloney', stat: 'caused_turnovers', firstYear: 2024, lastYear: 2026, value: 34, game_type: 'combined' },
  { player: 'Alexander Speer', stat: 'goals', firstYear: 2022, lastYear: 2025, value: 31, game_type: 'playoff' },
  { player: 'Anthony Brohl', stat: 'goals', firstYear: 2021, lastYear: 2023, value: 24, game_type: 'playoff' },
  { player: 'Will Bohne', stat: 'goals', firstYear: 2020, lastYear: 2023, value: 16, game_type: 'playoff' },
  { player: 'Drew Duesing', stat: 'goals', firstYear: 2022, lastYear: 2025, value: 16, game_type: 'playoff' },
  { player: 'Bennett Miller', stat: 'goals', firstYear: 2015, lastYear: 2016, value: 15, game_type: 'playoff' },
  { player: 'Nathan Aloi', stat: 'goals', firstYear: 2016, lastYear: 2019, value: 14, game_type: 'playoff' },
  { player: 'Quinn Wiklendt', stat: 'goals', firstYear: 2021, lastYear: 2024, value: 14, game_type: 'playoff' },
  { player: 'Andrew Miller', stat: 'goals', firstYear: 2019, lastYear: 2021, value: 12, game_type: 'playoff' },
  { player: 'Chandler Bankey', stat: 'goals', firstYear: 2016, lastYear: 2019, value: 12, game_type: 'playoff' },
  { player: 'George Jacob', stat: 'goals', firstYear: 2019, lastYear: 2021, value: 12, game_type: 'playoff' },
  { player: 'Quinn Wiklendt', stat: 'assists', firstYear: 2021, lastYear: 2024, value: 42, game_type: 'playoff' },
  { player: 'Zachary Zitkovic', stat: 'assists', firstYear: 2021, lastYear: 2023, value: 15, game_type: 'playoff' },
  { player: 'Alexander Speer', stat: 'assists', firstYear: 2022, lastYear: 2025, value: 10, game_type: 'playoff' },
  { player: 'Nathan Aloi', stat: 'assists', firstYear: 2016, lastYear: 2019, value: 9, game_type: 'playoff' },
  { player: 'Zack Wester', stat: 'assists', firstYear: 2015, lastYear: 2016, value: 6, game_type: 'playoff' },
  { player: 'Gareth Francis', stat: 'assists', firstYear: 2018, lastYear: 2019, value: 6, game_type: 'playoff' },
  { player: 'Quinn Staten', stat: 'assists', firstYear: 2021, lastYear: 2023, value: 6, game_type: 'playoff' },
  { player: 'Cameron Weinberg', stat: 'assists', firstYear: 2022, lastYear: 2025, value: 6, game_type: 'playoff' },
  { player: 'Nicholas Cope', stat: 'assists', firstYear: 2016, lastYear: 2019, value: 5, game_type: 'playoff' },
  { player: 'Ian Moloney', stat: 'assists', firstYear: 2024, lastYear: 2026, value: 5, game_type: 'playoff' },
  { player: 'Quinn Wiklendt', stat: 'points', firstYear: 2021, lastYear: 2024, value: 56, game_type: 'playoff' },
  { player: 'Alexander Speer', stat: 'points', firstYear: 2022, lastYear: 2025, value: 41, game_type: 'playoff' },
  { player: 'Anthony Brohl', stat: 'points', firstYear: 2021, lastYear: 2023, value: 27, game_type: 'playoff' },
  { player: 'Nathan Aloi', stat: 'points', firstYear: 2016, lastYear: 2019, value: 23, game_type: 'playoff' },
  { player: 'Zachary Zitkovic', stat: 'points', firstYear: 2021, lastYear: 2023, value: 21, game_type: 'playoff' },
  { player: 'Drew Duesing', stat: 'points', firstYear: 2022, lastYear: 2025, value: 20, game_type: 'playoff' },
  { player: 'Will Bohne', stat: 'points', firstYear: 2020, lastYear: 2023, value: 19, game_type: 'playoff' },
  { player: 'Bennett Miller', stat: 'points', firstYear: 2015, lastYear: 2016, value: 18, game_type: 'playoff' },
  { player: 'Quinn Staten', stat: 'points', firstYear: 2021, lastYear: 2023, value: 17, game_type: 'playoff' },
  { player: 'Chandler Bankey', stat: 'points', firstYear: 2016, lastYear: 2019, value: 16, game_type: 'playoff' },
  { player: 'Ian Moloney', stat: 'points', firstYear: 2024, lastYear: 2026, value: 16, game_type: 'playoff' },
  { player: 'Drew Duesing', stat: 'shots', firstYear: 2022, lastYear: 2025, value: 62, game_type: 'playoff' },
  { player: 'Alexander Speer', stat: 'shots', firstYear: 2022, lastYear: 2025, value: 62, game_type: 'playoff' },
  { player: 'Will Bohne', stat: 'shots', firstYear: 2020, lastYear: 2023, value: 61, game_type: 'playoff' },
  { player: 'Tyler Meader', stat: 'shots', firstYear: 2021, lastYear: 2023, value: 51, game_type: 'playoff' },
  { player: 'Anthony Brohl', stat: 'shots', firstYear: 2021, lastYear: 2023, value: 50, game_type: 'playoff' },
  { player: 'Nathan Aloi', stat: 'shots', firstYear: 2016, lastYear: 2019, value: 46, game_type: 'playoff' },
  { player: 'Quinn Wiklendt', stat: 'shots', firstYear: 2021, lastYear: 2024, value: 44, game_type: 'playoff' },
  { player: 'Owen Strayer', stat: 'shots', firstYear: 2023, lastYear: 2026, value: 43, game_type: 'playoff' },
  { player: 'Bennett Miller', stat: 'shots', firstYear: 2015, lastYear: 2016, value: 42, game_type: 'playoff' },
  { player: 'Quinn Staten', stat: 'shots', firstYear: 2021, lastYear: 2023, value: 42, game_type: 'playoff' },
  { player: 'Owen Winkler', stat: 'faceoff_wins', firstYear: 2022, lastYear: 2024, value: 66, game_type: 'playoff' },
  { player: 'Tyler Zetocha', stat: 'faceoff_wins', firstYear: 2024, lastYear: 2026, value: 48, game_type: 'playoff' },
  { player: 'Tyler Meader', stat: 'faceoff_wins', firstYear: 2021, lastYear: 2023, value: 44, game_type: 'playoff' },
  { player: 'Aiden Gage', stat: 'faceoff_wins', firstYear: 2018, lastYear: 2019, value: 36, game_type: 'playoff' },
  { player: 'Quinn Staten', stat: 'faceoff_wins', firstYear: 2021, lastYear: 2023, value: 31, game_type: 'playoff' },
  { player: 'Nicholas Cope', stat: 'faceoff_wins', firstYear: 2016, lastYear: 2019, value: 28, game_type: 'playoff' },
  { player: 'Jeff Szozda', stat: 'faceoff_wins', firstYear: 2015, lastYear: 2017, value: 25, game_type: 'playoff' },
  { player: 'Cole Kovacs', stat: 'faceoff_wins', firstYear: 2019, lastYear: 2021, value: 20, game_type: 'playoff' },
  { player: 'Nate Miller', stat: 'faceoff_wins', firstYear: 2021, lastYear: 2022, value: 15, game_type: 'playoff' },
  { player: 'Gage Buck', stat: 'faceoff_wins', firstYear: 2022, lastYear: 2024, value: 7, game_type: 'playoff' },
  { player: 'Tyler Meader', stat: 'ground_balls', firstYear: 2021, lastYear: 2023, value: 78, game_type: 'playoff' },
  { player: 'Tyler Zetocha', stat: 'ground_balls', firstYear: 2023, lastYear: 2026, value: 34, game_type: 'playoff' },
  { player: 'Zachary Zitkovic', stat: 'ground_balls', firstYear: 2021, lastYear: 2023, value: 32, game_type: 'playoff' },
  { player: 'Kaden King', stat: 'ground_balls', firstYear: 2021, lastYear: 2023, value: 29, game_type: 'playoff' },
  { player: 'Cooper Hoyt', stat: 'ground_balls', firstYear: 2021, lastYear: 2023, value: 29, game_type: 'playoff' },
  { player: 'Anthony Brohl', stat: 'ground_balls', firstYear: 2021, lastYear: 2023, value: 28, game_type: 'playoff' },
  { player: 'Sam Rodgers', stat: 'ground_balls', firstYear: 2017, lastYear: 2019, value: 27, game_type: 'playoff' },
  { player: 'Owen Winkler', stat: 'ground_balls', firstYear: 2022, lastYear: 2024, value: 27, game_type: 'playoff' },
  { player: 'Quinn Staten', stat: 'ground_balls', firstYear: 2021, lastYear: 2023, value: 26, game_type: 'playoff' },
  { player: 'Gage Buck', stat: 'ground_balls', firstYear: 2022, lastYear: 2024, value: 26, game_type: 'playoff' },
  { player: 'Nicholas Bowers', stat: 'saves', firstYear: 2022, lastYear: 2024, value: 56, game_type: 'playoff' },
  { player: 'Ian Horner', stat: 'saves', firstYear: 2022, lastYear: 2024, value: 52, game_type: 'playoff' },
  { player: 'Noah Houpt', stat: 'saves', firstYear: 2015, lastYear: 2016, value: 33, game_type: 'playoff' },
  { player: 'Ryan Pierce', stat: 'saves', firstYear: 2018, lastYear: 2019, value: 25, game_type: 'playoff' },
  { player: 'Dylan Sobb', stat: 'saves', firstYear: 2026, lastYear: 2026, value: 21, game_type: 'playoff' },
  { player: 'Dan Lach', stat: 'saves', firstYear: 2021, lastYear: 2021, value: 18, game_type: 'playoff' },
  { player: 'Braylon Lewis', stat: 'saves', firstYear: 2025, lastYear: 2025, value: 16, game_type: 'playoff' },
  { player: 'JD Keller', stat: 'saves', firstYear: 2018, lastYear: 2018, value: 14, game_type: 'playoff' },
  { player: 'Parker Thayer', stat: 'saves', firstYear: 2015, lastYear: 2016, value: 4, game_type: 'playoff' },
  { player: 'James Smith', stat: 'saves', firstYear: 2025, lastYear: 2026, value: 2, game_type: 'playoff' },
  { player: 'Nicholas Bowers', stat: 'shots_against', firstYear: 2022, lastYear: 2024, value: 117, game_type: 'playoff' },
  { player: 'Ian Horner', stat: 'shots_against', firstYear: 2022, lastYear: 2024, value: 76, game_type: 'playoff' },
  { player: 'Noah Houpt', stat: 'shots_against', firstYear: 2015, lastYear: 2016, value: 66, game_type: 'playoff' },
  { player: 'Ryan Pierce', stat: 'shots_against', firstYear: 2018, lastYear: 2019, value: 43, game_type: 'playoff' },
  { player: 'Dylan Sobb', stat: 'shots_against', firstYear: 2026, lastYear: 2026, value: 41, game_type: 'playoff' },
  { player: 'Braylon Lewis', stat: 'shots_against', firstYear: 2025, lastYear: 2025, value: 34, game_type: 'playoff' },
  { player: 'Dan Lach', stat: 'shots_against', firstYear: 2021, lastYear: 2021, value: 33, game_type: 'playoff' },
  { player: 'JD Keller', stat: 'shots_against', firstYear: 2018, lastYear: 2018, value: 32, game_type: 'playoff' },
  { player: 'Parker Thayer', stat: 'shots_against', firstYear: 2015, lastYear: 2016, value: 7, game_type: 'playoff' },
  { player: 'James Smith', stat: 'shots_against', firstYear: 2025, lastYear: 2026, value: 3, game_type: 'playoff' },
  { player: 'Tyler Meader', stat: 'caused_turnovers', firstYear: 2021, lastYear: 2023, value: 23, game_type: 'playoff' },
  { player: 'Mason Bowers', stat: 'caused_turnovers', firstYear: 2022, lastYear: 2025, value: 20, game_type: 'playoff' },
  { player: 'Cooper Hoyt', stat: 'caused_turnovers', firstYear: 2021, lastYear: 2023, value: 17, game_type: 'playoff' },
  { player: 'Zachary Zitkovic', stat: 'caused_turnovers', firstYear: 2021, lastYear: 2023, value: 11, game_type: 'playoff' },
  { player: 'Sam Rodgers', stat: 'caused_turnovers', firstYear: 2016, lastYear: 2019, value: 10, game_type: 'playoff' },
  { player: 'Abe Townley', stat: 'caused_turnovers', firstYear: 2021, lastYear: 2023, value: 10, game_type: 'playoff' },
  { player: 'Gage Buck', stat: 'caused_turnovers', firstYear: 2022, lastYear: 2024, value: 10, game_type: 'playoff' },
  { player: 'Drew Dunphy', stat: 'caused_turnovers', firstYear: 2020, lastYear: 2021, value: 9, game_type: 'playoff' },
  { player: 'Kaden King', stat: 'caused_turnovers', firstYear: 2021, lastYear: 2023, value: 8, game_type: 'playoff' },
  { player: 'Quinn Wiklendt', stat: 'caused_turnovers', firstYear: 2021, lastYear: 2024, value: 7, game_type: 'playoff' },
];

// Playoff Career FO% -- the one rate-stat board with exact counts given
// in the source PDF, so it can be verified against the minimum and
// rendered with real FOW/Attempts figures rather than guessed ones.
const STATIC_CAREER_RATE_RECORDS = [
  { player: 'Jeff Szozda', stat: 'fo_pct', firstYear: 2015, lastYear: 2017, faceoff_wins: 25, faceoff_losses: 11, game_type: 'playoff' },
  { player: 'Nick Cope', stat: 'fo_pct', firstYear: 2016, lastYear: 2019, faceoff_wins: 29, faceoff_losses: 17, game_type: 'playoff' },
  { player: 'Owen Winkler', stat: 'fo_pct', firstYear: 2022, lastYear: 2024, faceoff_wins: 66, faceoff_losses: 46, game_type: 'playoff' },
  { player: 'Aiden Gage', stat: 'fo_pct', firstYear: 2018, lastYear: 2019, faceoff_wins: 36, faceoff_losses: 27, game_type: 'playoff' },
  { player: 'Tyler Zetocha', stat: 'fo_pct', firstYear: 2025, lastYear: 2026, faceoff_wins: 48, faceoff_losses: 39, game_type: 'playoff' },
  { player: 'Tyler Meader', stat: 'fo_pct', firstYear: 2021, lastYear: 2023, faceoff_wins: 44, faceoff_losses: 38, game_type: 'playoff' },
  { player: 'Quinn Staten', stat: 'fo_pct', firstYear: 2021, lastYear: 2023, faceoff_wins: 31, faceoff_losses: 27, game_type: 'playoff' },
  { player: 'Cole Kovacs', stat: 'fo_pct', firstYear: 2019, lastYear: 2021, faceoff_wins: 20, faceoff_losses: 21, game_type: 'playoff' },
  { player: 'Nate Miller', stat: 'fo_pct', firstYear: 2021, lastYear: 2022, faceoff_wins: 15, faceoff_losses: 17, game_type: 'playoff' },
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
async function getCareerBoards(view, resolvePlayer) {
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

  function resolveStatic(r) {
    const match = resolvePlayer(...splitName(r.player));
    const displayYears = r.firstYear === r.lastYear ? String(r.firstYear) : `${r.firstYear}-${r.lastYear}`;
    return {
      ...r,
      id: match ? match.id : `static-career-${r.player}`,
      first_name: match ? match.first_name : splitName(r.player)[0],
      last_name: match ? match.last_name : splitName(r.player)[1],
      graduation_year: match ? match.graduation_year : null,
      playerName: r.player,
      displayYears,
      isStatic: true,
      resolvedPlayer: !!match,
    };
  }

  const boards = {};
  STAT_COLUMNS.forEach(({ key, compute }) => {
    const liveWithValue = rows
      .map((r) => ({ ...r, value: compute ? compute(r) : Number(r[key]) }))
      .filter((r) => r.value > 0);

    const staticSurvivors = new Map();
    STATIC_CAREER_RECORDS.filter((r) => r.stat === key && (view === 'combined' || r.game_type === view)).forEach(
      (raw) => {
        const r = resolveStatic(raw);
        const covered = liveWithValue.some((live) => live.id === r.id && live.value >= r.value);
        if (covered) return;
        const existing = staticSurvivors.get(r.id);
        if (!existing || r.value > existing.value) staticSurvivors.set(r.id, r);
      }
    );

    boards[key] = rankBoard([...liveWithValue, ...staticSurvivors.values()]);
  });

  const rateBoards = {};
  RATE_STATS.forEach(({ key, numerator, denominator, minQualifier }) => {
    const qualifier = minQualifier.career && minQualifier.career[view];
    if (!qualifier) return;
    const liveWithValue = rows.map((r) => {
      const denom = denominator(r);
      return { ...r, value: denom > 0 ? (numerator(r) / denom) * 100 : 0 };
    });

    const staticSurvivors = new Map();
    STATIC_CAREER_RATE_RECORDS.filter((r) => r.stat === key && (view === 'combined' || r.game_type === view)).forEach(
      (raw) => {
        const r = resolveStatic(raw);
        r.value = denominator(r) > 0 ? (numerator(r) / denominator(r)) * 100 : 0;
        const liveRow = liveWithValue.find((live) => live.id === r.id);
        if (liveRow && denominator(liveRow) >= denominator(r)) return;
        const existing = staticSurvivors.get(r.id);
        if (!existing || r.value > existing.value) staticSurvivors.set(r.id, r);
      }
    );

    const withValue = [...liveWithValue, ...staticSurvivors.values()].filter(
      (r) => checkQualifier(r, qualifier, numerator, denominator) || isManuallyQualified(r, key, 'career', view)
    );
    rateBoards[key] = rankBoard(withValue);
  });

  return { boards, rateBoards };
}

// --- SEASON tier: top 10 individual (player, season) performances -----
// Live side reuses season_totals exactly as the Career tier does, just
// grouped one level less coarsely (by player AND season_year) -- the
// view's already-correct legacy regular/playoff split (see
// db/001_init_schema.sql's season_totals VIEW) means no new merge logic
// is needed for the LIVE side. Static records (from the two Individual
// Stats PDFs) are merged the same "asserted baseline" way as everywhere
// else: dropped only when a live row for the SAME player + SAME season
// demonstrably covers or exceeds them.
async function getSeasonBoards(view, resolvePlayer) {
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

  function resolveStatic(r) {
    const match = resolvePlayer(...splitName(r.player));
    return {
      ...r,
      id: match ? match.id : `static-season-${r.player}-${r.season_year}`,
      first_name: match ? match.first_name : splitName(r.player)[0],
      last_name: match ? match.last_name : splitName(r.player)[1],
      graduation_year: match ? match.graduation_year : null,
      playerName: r.player,
      isStatic: true,
      resolvedPlayer: !!match,
    };
  }

  const boards = {};
  STAT_COLUMNS.forEach(({ key, compute }) => {
    const liveWithValue = rows
      .map((r) => ({ ...r, value: compute ? compute(r) : Number(r[key]) }))
      .filter((r) => r.value > 0);

    const staticSurvivors = new Map();
    STATIC_SEASON_RECORDS.filter((r) => r.stat === key && (view === 'combined' || r.game_type === view)).forEach(
      (raw) => {
        const r = resolveStatic(raw);
        const covered = liveWithValue.some(
          (live) => live.id === r.id && Number(live.season_year) === r.season_year && live.value >= r.value
        );
        if (covered) return;
        const dedupeKey = `${r.id}::${r.season_year}`;
        const existing = staticSurvivors.get(dedupeKey);
        if (!existing || r.value > existing.value) staticSurvivors.set(dedupeKey, r);
      }
    );

    boards[key] = rankBoard([...liveWithValue, ...staticSurvivors.values()]);
  });

  // No Season-tier rate-stat static records yet -- the source PDFs don't
  // give the underlying attempt/shot counts for a single season, only
  // the final percentage (see the comment on STATIC_SEASON_RECORDS
  // above). Live-only until that data is available.
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

  // "Current season" mirrors Team Stats (TM-16): the most recent season
  // year with any live data, inferred from programYears until TM-17/TM-24
  // (finalize/advance) exist to mark it explicitly.
  //
  // A CAREER row's membership is checked against the player's raw active-
  // years array with .includes(), not the formatted display range string
  // -- a player active 2024-2026 highlights exactly like one active only
  // in 2026 would. A SEASON or GAME row already names one specific
  // season/game, so it's just a direct equality check instead. A static-
  // only career row (no live data at all for this player yet) falls back
  // to its own lastYear.
  const currentSeasonYear = programYears.length > 0 ? Math.max(...programYears) : null;
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
  // by first active year for career rows, by the specific season/game
  // date otherwise.
  function tieBreak(a, b) {
    if (scope === 'career') return firstActiveYear(a) - firstActiveYear(b);
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
