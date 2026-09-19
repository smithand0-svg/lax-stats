/**
 * Hudl "All Athletes — Totals" TEAM report parser.
 *
 * Despite sharing a title with the per-player export (hudlParser.js), this
 * is a structurally different report: one row per game SEGMENT (an
 * "Overall" row for the full game, plus "1st"/"2nd"/"3rd"/"4th" period
 * rows), with team-level totals in every column — not one row per player.
 * Confirmed against a real export (Sample_Game_Data_Export.csv).
 *
 * Column-name mapping doesn't work here the way it does for the per-player
 * report: this header repeats the literal name "P" THREE times with three
 * different meanings depending on position — Points (1st occurrence,
 * skipped, same as the per-player parser: points is derived from
 * goals+assists), then Possessions (2nd), then Penalties (3rd). Those
 * aren't spacer duplicates to collapse — they're three real, different
 * stats. So this parser maps by fixed column POSITION instead of name,
 * and validates the incoming header against the exact expected shape on
 * every parse, so a format change in Hudl's export fails loudly with a
 * clear error instead of silently mismapping a column into the wrong
 * field.
 */

const EXPECTED_HEADER = [
  'Games', 'GP', '0', 'G', 'A', 'P', 'S', 'SOT', 'S%', '0', 'P', 'AP', 'P/S', 'P/G', 'P%',
  'GB', '0', 'SC', 'FC', 'C%', 'SR', 'FR', 'R%', '0', 'FO', 'FOW', 'FOL', 'FO%', '0',
  'T', 'FT', 'UT', '0', 'B', 'CT', 'GA', 'SV', 'SV%', '0', 'EMO', 'EMOG', 'EMO%',
  'MDD', 'MGA', 'MDD%', '0', 'P', 'TP', 'PP',
];

// index -> team_game_stats field (camelCase; mapped to snake_case columns
// at the DB layer). Index 0 ("Games") is the row label ("Overall" / a
// period name), index 1 ("GP") is games-played (always 1 for a single-game
// export, not used). Every plain '0' index is a Hudl spacer column.
// Index 5 (the first "P" = Points) is intentionally absent from this map —
// same convention as the per-player parser: points is derived
// (goals + assists), never trusted from a second source.
const COLUMN_MAP = {
  3: 'goals',
  4: 'assists',
  6: 'shots',
  7: 'shotsOnGoal',
  8: 'shotPct',
  10: 'possessions',
  11: 'attackingPossessions',
  12: 'possPerShot',
  13: 'possPerGoal',
  14: 'possPct',
  15: 'groundBalls',
  17: 'successfulClears',
  18: 'failedClears',
  19: 'clearPct',
  20: 'successfulRides',
  21: 'failedRides',
  22: 'ridePct',
  24: 'faceoffs',
  25: 'faceoffWins',
  26: 'faceoffLosses',
  27: 'faceoffPct',
  29: 'turnovers',
  30: 'forcedTurnovers',
  31: 'unforcedTurnovers',
  33: 'blocks',
  34: 'causedTurnovers',
  35: 'goalsAgainst',
  36: 'saves',
  37: 'savePct',
  39: 'emo',
  40: 'emoGoals',
  41: 'emoPct',
  42: 'manDownDefenses',
  43: 'manDownGoalsAgainst',
  44: 'manDownPct',
  46: 'penalties',
  47: 'technicalPenalties',
  48: 'personalPenalties',
};

/**
 * @param {string} csvText
 * @param {object} Papa
 * @returns {{ stats: object, periodRows: Array<object> }}
 */
function parseHudlTeamTotalsCsv(csvText, Papa) {
  const lines = csvText.split(/\r?\n/);
  const headerLineIndex = lines.findIndex((l) => l.trim().startsWith('Games,GP'));
  if (headerLineIndex === -1) {
    throw new Error(
      'Could not find the team-totals header row (expected a line starting with "Games,GP"). ' +
      'Is this the per-player "All Athletes — Totals" export instead? Use the Individual Stats toggle for that one.'
    );
  }
  const csvBody = lines.slice(headerLineIndex).join('\n');
  const parsed = Papa.parse(csvBody, { header: false, skipEmptyLines: true });
  const [headerRow, ...dataRows] = parsed.data;

  const normalizedHeader = headerRow.map((h) => h.trim());
  const headerMatches =
    normalizedHeader.length === EXPECTED_HEADER.length &&
    normalizedHeader.every((h, i) => h === EXPECTED_HEADER[i]);
  if (!headerMatches) {
    throw new Error(
      `Team-totals header doesn't match the expected format.\nExpected: ${EXPECTED_HEADER.join(',')}\nGot: ${normalizedHeader.join(',')}`
    );
  }

  // Below the "Overall" row, Hudl repeats the header for a per-period
  // breakdown, preceded by an all-zero spacer row. Drop the spacer and the
  // repeated header; keep the "Overall" row and the period rows.
  const rows = dataRows.filter(
    (r) => r.length > 1 && r[0] && r[0] !== 'Period' && r.some((cell) => cell !== '' && cell !== '0')
  );

  const overallRow = rows.find((r) => r[0].trim().toLowerCase() === 'overall');
  if (!overallRow) {
    throw new Error('Could not find the "Overall" row in the team-totals export.');
  }

  const stats = {};
  Object.entries(COLUMN_MAP).forEach(([indexStr, field]) => {
    stats[field] = toNumber(overallRow[Number(indexStr)]);
  });

  // Period rows aren't written anywhere yet (team_game_stats has no
  // per-period columns) — parsed and returned for the review screen /
  // future use, not lost, but not persisted today.
  const periodRows = rows
    .filter((r) => r !== overallRow)
    .map((r) => {
      const period = { label: r[0].trim() };
      Object.entries(COLUMN_MAP).forEach(([indexStr, field]) => {
        period[field] = toNumber(r[Number(indexStr)]);
      });
      return period;
    });

  return { stats, periodRows };
}

function toNumber(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const cleaned = String(raw).replace('%', '').trim();
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

module.exports = { parseHudlTeamTotalsCsv, EXPECTED_HEADER, COLUMN_MAP };
