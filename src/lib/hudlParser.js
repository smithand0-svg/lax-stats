/**
 * Hudl "All Athletes — Totals" CSV parser.
 *
 * Real export header observed (SJJ @ Rocky River):
 *   #,Athlete,GP,0,G,A,P,S,SOT,S%,GB,EMOG,0,0,FO,FOW,FOL,FO%,0,T,FT,UT,0,CT,GA,SV,SV%,0,P,TP,PP
 *
 * Hudl uses blank "0"-labeled columns purely as visual spacing — those are
 * always ignored, matching what Andy confirmed.
 *
 * Confirmed with Andy:
 *   T  = total turnovers (T = FT + UT)      -> maps to schema `turnovers`
 *   TP = technical fouls                     -> maps to schema `technical_fouls`
 *   PP = personal fouls                      -> maps to schema `personal_fouls`
 *
 * IMPORTANT — still intentionally left unmapped:
 *   EMOG (extra-man-offense goals — not tracked in schema yet),
 *   FO (total faceoffs taken — derivable from FOW+FOL, not separately needed),
 *   FT / UT (forced/unforced turnover split — we only need the T total).
 * These are captured into `row.unmapped` so nothing is lost, in case a
 * future feature wants them, but they don't write into schema columns.
 */

const KNOWN_COLUMNS = {
  '#': 'jerseyNumber',
  'Athlete': 'fullName',
  'GP': 'gamesPlayed',
  'G': 'goals',
  'A': 'assists',
  // 'P' (points) is derived (goals+assists) in our schema anyway — ignore
  // Hudl's own Points column rather than trusting a second source of truth.
  'S': 'shots',
  'SOT': 'shotsOnGoal',
  'GB': 'groundBalls',
  'FOW': 'faceoffWins',
  'FOL': 'faceoffLosses',
  'CT': 'causedTurnovers',
  'GA': 'goalsAgainst',
  'SV': 'saves',
  'T': 'turnovers',        // confirmed: T = total turnovers (T = FT + UT)
  'TP': 'technicalFouls',  // confirmed
  'PP': 'personalFouls',   // confirmed
};

// Columns we deliberately ignore because they're computed/derivable
// elsewhere (percentages, and Hudl's own Points column).
const IGNORED_COLUMNS = new Set(['P', 'S%', 'FO%', 'SV%']);

/**
 * Parses raw Hudl CSV text (as a string) into structured rows.
 * Skips the title line Hudl puts above the real header row.
 *
 * @param {string} csvText
 * @returns {{ rows: object[], unmappedColumns: string[] }}
 */
function parseHudlCsv(csvText, Papa) {
  const lines = csvText.split(/\r?\n/);
  // Hudl's first line is a title like "SJJ @ Rocky River — All Athletes — Totals"
  // The real header is the first line that starts with "#,Athlete".
  const headerLineIndex = lines.findIndex((l) => l.trim().startsWith('#,Athlete'));
  if (headerLineIndex === -1) {
    throw new Error('Could not find Hudl header row (expected a line starting with "#,Athlete").');
  }
  const csvBody = lines.slice(headerLineIndex).join('\n');

  const parsed = Papa.parse(csvBody, { header: false, skipEmptyLines: true });
  const [headerRow, ...dataRows] = parsed.data;

  // Build positional mapping: header column name -> column index.
  // Because "0" and "P" repeat, we map by (name, occurrence index) so we
  // always read the FIRST occurrence of an ambiguous name as the known one,
  // and every other occurrence of that name (or any name not in
  // KNOWN_COLUMNS/IGNORED_COLUMNS) is treated as unmapped.
  const seenNames = new Set();
  const columnMap = []; // { index, name, field | null }
  const unmappedColumns = [];

  headerRow.forEach((rawName, index) => {
    const name = rawName.trim();
    if (name === '0' || name === '') {
      return; // spacer column, always ignored
    }
    if (IGNORED_COLUMNS.has(name)) {
      return; // computed elsewhere, intentionally dropped
    }
    const field = KNOWN_COLUMNS[name];
    if (field && !seenNames.has(name)) {
      seenNames.add(name);
      columnMap.push({ index, name, field });
    } else {
      unmappedColumns.push(`${name} (column ${index + 1})`);
    }
  });

  const rows = dataRows
    .filter((r) => r.length > 1 && r.some((cell) => cell !== ''))
    .map((r) => {
      const row = { unmapped: {} };
      columnMap.forEach(({ index, field }) => {
        const raw = r[index];
        row[field] = field === 'fullName' ? raw : toInt(raw);
      });
      // Capture unmapped column values per-row too, keyed by header name,
      // so nothing is silently lost even before a human confirms meaning.
      headerRow.forEach((rawName, index) => {
        const name = rawName.trim();
        const isKnown = columnMap.some((c) => c.index === index);
        if (!isKnown && name !== '0' && name !== '' && !IGNORED_COLUMNS.has(name)) {
          row.unmapped[`${name}_col${index + 1}`] = r[index];
        }
      });
      return row;
    });

  return { rows, unmappedColumns: [...new Set(unmappedColumns)] };
}

function toInt(value) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Splits a Hudl "Athlete" full name into first/last for matching against
 * the players table. Handles multi-word first or last names naively
 * (assumes last word is the last name) — good enough as a first pass;
 * anything ambiguous should surface in the admin match-review screen
 * rather than being silently guessed at here.
 */
function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(' ');
  return { firstName, lastName };
}

module.exports = { parseHudlCsv, splitName, KNOWN_COLUMNS, IGNORED_COLUMNS };
