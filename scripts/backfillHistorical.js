#!/usr/bin/env node
/**
 * One-time historical backfill.
 *
 * Loads:
 *   - CareerStats.xlsx "All" sheet      -> season_stat_summaries (game_type='combined')
 *   - PlayoffCareerStats.xlsx "All" sheet -> season_stat_summaries (game_type='playoff')
 *
 * This is separate from the live Hudl game importer (lib/importService.js)
 * because the shape and confidence level of this data is fundamentally
 * different — season/career totals, not per-game detail, with real
 * duplicate-row and identity-collision quirks specific to these two files
 * (see comments inline).
 *
 * Usage:
 *   DATABASE_URL=postgres://... node scripts/backfillHistorical.js \
 *     /path/to/CareerStats.xlsx /path/to/PlayoffCareerStats.xlsx
 *
 * Safe to re-run: every insert uses ON CONFLICT DO NOTHING keyed on
 * (team_id, player_id, season_year, game_type), so running it twice
 * without first deleting data won't duplicate rows — though it also
 * won't update anything either. To reload from scratch, delete existing
 * season_stat_summaries rows first.
 */
const XLSX = require('xlsx');
const { Pool } = require('pg');

// Self-contained database connection — deliberately does NOT import
// ../src/lib/db, since that file gets compiled into Next.js's internal
// bundle structure and doesn't exist as a plain requirable path when
// this script runs from inside a standalone production build. This
// script needs to work standing alone, wherever it's deployed.
const pool = new Pool(
  process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : undefined
);

// ---------------------------------------------------------------------
// Column mapping — built from header NAMES, not hardcoded positions.
// Both source files have re-used header names in places ("P" appears
// twice in the playoff file, for Points and something else), so we take
// the first occurrence of any name we care about, same defensive
// approach as the live Hudl parser.
// ---------------------------------------------------------------------
function buildColumnIndex(headerRow, wantedNames) {
  const index = {};
  headerRow.forEach((rawName, i) => {
    const name = (rawName || '').toString().trim();
    if (wantedNames.includes(name) && !(name in index)) {
      index[name] = i;
    }
  });
  return index;
}

function val(row, index, name) {
  const i = index[name];
  if (i === undefined) return null;
  const v = row[i];
  return v === null || v === undefined || v === '' ? null : v;
}

function toIntOrZero(v) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : 0;
}

// Andy's own disambiguation method: when a new player collides with an
// existing name, the historical record's display name gets a trailing
// grad-year marker like "'14". We detect that here so the two real
// people don't get merged into one player record.
function parseGradYearSuffix(fullName) {
  const m = fullName && String(fullName).match(/'(\d{2})\b/);
  if (!m) return null;
  return 2000 + parseInt(m[1], 10);
}

function norm(s) {
  return (s || '').trim().toLowerCase();
}

function splitFullName(fullName) {
  const cleaned = String(fullName).replace(/\s*'\d{2}\b/, '').trim();
  const parts = cleaned.split(/\s+/);
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(' ');
  return { firstName, lastName };
}

// Finds the first 3 letters of a name, for loose nickname matching (Max
// vs Maximus, Nick vs Nicholas, Zach/Zack vs Zachary all share a prefix).
function prefix3(s) {
  return norm(s).slice(0, 3);
}

async function resolveOrCreatePlayer(client, teamId, firstName, lastName, graduationYear, knownPlayers) {
  const exact = knownPlayers.find(
    (p) =>
      norm(p.firstName) === norm(firstName) &&
      norm(p.lastName) === norm(lastName) &&
      (p.graduationYear || null) === (graduationYear || null)
  );
  if (exact) return exact.id;

  // Fuzzy match: same last name, same graduation year (or neither has
  // one), and the first name shares a 3-letter prefix — catches the
  // common nickname/full-name variants (Max/Maximus, Nick/Nicholas,
  // Zach or Zack/Zachary, Sam/Samuel) that come from Hudl using a
  // player's actual profile name while the historical spreadsheet used
  // a nickname. This is exactly the class of duplicate identity found
  // and manually merged after the first backfill run — this check
  // exists specifically so a future re-run doesn't reintroduce them.
  const fuzzy = knownPlayers.find(
    (p) =>
      norm(p.lastName) === norm(lastName) &&
      (p.graduationYear || null) === (graduationYear || null) &&
      prefix3(p.firstName) === prefix3(firstName) &&
      norm(p.firstName) !== norm(firstName)
  );
  if (fuzzy) {
    console.log(`  ~ Matched "${firstName} ${lastName}" to existing player "${fuzzy.firstName} ${fuzzy.lastName}" (nickname/name variant)`);
    return fuzzy.id;
  }

  // Not an exact or prefix match, but shares a last name with an
  // existing player under a first name that doesn't share a prefix
  // (e.g. James/Jimmy, Andrew/Drew) — the fuzzy check above can't catch
  // this reliably without false-positiving on real siblings who share a
  // last name. Flagged here for manual review rather than silently
  // creating what might be a duplicate; safe default is still to create
  // the new player, since most same-last-name cases really are
  // different people (verified during the original backfill).
  const sameLastName = knownPlayers.filter((p) => norm(p.lastName) === norm(lastName) && norm(p.firstName) !== norm(firstName));
  if (sameLastName.length > 0) {
    console.log(
      `  ⚠ New player "${firstName} ${lastName}" shares a last name with existing player(s): ${sameLastName
        .map((p) => `${p.firstName} ${p.lastName}`)
        .join(', ')} — verify these are genuinely different people`
    );
  }

  const inserted = await client.query(
    `INSERT INTO players (team_id, first_name, last_name, graduation_year, is_legacy)
     VALUES ($1,$2,$3,$4,true) RETURNING id`,
    [teamId, firstName, lastName, graduationYear]
  );
  const newPlayer = { id: inserted.rows[0].id, firstName, lastName, graduationYear };
  knownPlayers.push(newPlayer); // visible to subsequent rows in this same run
  return newPlayer.id;
}

// ---------------------------------------------------------------------
// CareerStats.xlsx — combined (regular+playoff inclusive) season totals.
// Real quirk: a handful of (year,lastName,firstName) keys appear as
// multiple rows, each with only some columns filled in. These need to be
// coalesced into one row per key, not inserted as separate rows.
// ---------------------------------------------------------------------
const CAREER_COLUMN_NAMES = [
  'FOL', 'FOW', 'Goal', 'Assist', 'Shot', 'Shot On Goal', 'Ground Ball',
  'Turn over', 'Goal Against', 'Save', 'Take away', 'Personal Foul', 'Technical Foul',
];

function coalesceCareerGroup(entries, colIndex) {
  const fields = {
    faceoffWins: 'FOW', faceoffLosses: 'FOL', goals: 'Goal', assists: 'Assist',
    shots: 'Shot', shotsOnGoal: 'Shot On Goal', groundBalls: 'Ground Ball',
    turnovers: 'Turn over', goalsAgainst: 'Goal Against', saves: 'Save',
    causedTurnovers: 'Take away', personalFouls: 'Personal Foul', technicalFouls: 'Technical Foul',
  };
  const merged = {};
  for (const [field, colName] of Object.entries(fields)) {
    const values = entries.map((r) => val(r, colIndex, colName)).filter((v) => v !== null);
    if (values.length > 1) {
      const distinct = new Set(values.map((v) => Math.round(Number(v) * 1000)));
      if (distinct.size > 1) {
        console.warn(`  ⚠ Conflicting ${field} values in one group, using first found:`, values);
      }
    }
    merged[field] = values.length > 0 ? toIntOrZero(values[0]) : 0;
  }
  return merged;
}

async function loadCareerStats(client, filePath, teamId, knownPlayers) {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets['All'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const headerRow = data[0];
  const rows = data.slice(1).filter((r) => r[1] && r[2]); // must have last+first name

  const colIndex = buildColumnIndex(headerRow, CAREER_COLUMN_NAMES);

  const groups = {};
  rows.forEach((r) => {
    const key = `${r[0]}|${r[1]}|${r[2]}`;
    (groups[key] = groups[key] || []).push(r);
  });

  let inserted = 0;
  let skipped = 0;
  for (const entries of Object.values(groups)) {
    const [yearRaw, lastName, firstName, fullName] = entries[0];
    const seasonYear = yearRaw === 'Legacy' ? null : parseInt(yearRaw, 10);
    const graduationYear = parseGradYearSuffix(fullName);
    const stats = coalesceCareerGroup(entries, colIndex);

    const playerId = await resolveOrCreatePlayer(client, teamId, firstName, lastName, graduationYear, knownPlayers);

    const sourceNote =
      yearRaw === 'Legacy'
        ? 'Imported from historical CareerStats spreadsheet (Legacy tier — no game-level detail available)'
        : 'Imported from historical CareerStats spreadsheet';

    const result = await client.query(
      `INSERT INTO season_stat_summaries
         (team_id, player_id, season_year, game_type, faceoff_wins, faceoff_losses,
          goals, assists, shots, shots_on_goal, ground_balls, turnovers, caused_turnovers,
          goals_against, saves, personal_fouls, technical_fouls, source_note)
       VALUES ($1,$2,$3,'combined',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (team_id, player_id, season_year, game_type) DO NOTHING`,
      [
        teamId, playerId, seasonYear,
        stats.faceoffWins, stats.faceoffLosses, stats.goals, stats.assists,
        stats.shots, stats.shotsOnGoal, stats.groundBalls, stats.turnovers,
        stats.causedTurnovers, stats.goalsAgainst, stats.saves,
        stats.personalFouls, stats.technicalFouls, sourceNote,
      ]
    );
    if (result.rowCount > 0) inserted++;
    else skipped++;
  }
  console.log(`CareerStats.xlsx: ${Object.keys(groups).length} player-year records (${inserted} inserted, ${skipped} already existed).`);
}

// ---------------------------------------------------------------------
// PlayoffCareerStats.xlsx — playoff-only season totals, Hudl-shaped
// (single "Athlete" full-name field, needs splitting).
// ---------------------------------------------------------------------
const PLAYOFF_COLUMN_NAMES = ['FOW', 'FOL', 'G', 'A', 'S', 'SOT', 'GB', 'T', 'CT', 'GA', 'SV', 'TP', 'PP'];

async function loadPlayoffStats(client, filePath, teamId, knownPlayers) {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets['All'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const headerRow = data[0];
  const rows = data.slice(1).filter((r) => r[2]); // must have an Athlete name

  const colIndex = buildColumnIndex(headerRow, PLAYOFF_COLUMN_NAMES);

  let inserted = 0;
  let skipped = 0;
  for (const r of rows) {
    const seasonYear = parseInt(r[0], 10);
    const fullName = r[2];
    const graduationYear = parseGradYearSuffix(fullName);
    const { firstName, lastName } = splitFullName(fullName);

    const playerId = await resolveOrCreatePlayer(client, teamId, firstName, lastName, graduationYear, knownPlayers);

    const result = await client.query(
      `INSERT INTO season_stat_summaries
         (team_id, player_id, season_year, game_type, faceoff_wins, faceoff_losses,
          goals, assists, shots, shots_on_goal, ground_balls, turnovers, caused_turnovers,
          goals_against, saves, personal_fouls, technical_fouls, source_note)
       VALUES ($1,$2,$3,'playoff',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'Imported from historical PlayoffCareerStats spreadsheet')
       ON CONFLICT (team_id, player_id, season_year, game_type) DO NOTHING`,
      [
        teamId, playerId, seasonYear,
        toIntOrZero(val(r, colIndex, 'FOW')), toIntOrZero(val(r, colIndex, 'FOL')),
        toIntOrZero(val(r, colIndex, 'G')), toIntOrZero(val(r, colIndex, 'A')),
        toIntOrZero(val(r, colIndex, 'S')), toIntOrZero(val(r, colIndex, 'SOT')),
        toIntOrZero(val(r, colIndex, 'GB')), toIntOrZero(val(r, colIndex, 'T')),
        toIntOrZero(val(r, colIndex, 'CT')), toIntOrZero(val(r, colIndex, 'GA')),
        toIntOrZero(val(r, colIndex, 'SV')),
        toIntOrZero(val(r, colIndex, 'PP')), toIntOrZero(val(r, colIndex, 'TP')),
      ]
    );
    if (result.rowCount > 0) inserted++;
    else skipped++;
  }
  console.log(`PlayoffCareerStats.xlsx: ${rows.length} player-year records (${inserted} inserted, ${skipped} already existed).`);
}

// ---------------------------------------------------------------------
async function run(careerPath, playoffPath) {
  const client = await pool.connect();
  try {
    const teamRes = await client.query("SELECT id FROM teams WHERE slug='sjj'");
    if (!teamRes.rows[0]) throw new Error('Team not found — did you run the schema migration?');
    const teamId = teamRes.rows[0].id;

    const { rows: knownPlayers } = await client.query(
      `SELECT id, first_name AS "firstName", last_name AS "lastName", graduation_year AS "graduationYear"
       FROM players WHERE team_id = $1`,
      [teamId]
    );
    console.log(`Starting with ${knownPlayers.length} existing player(s) in the database.`);

    await client.query('BEGIN');
    await loadCareerStats(client, careerPath, teamId, knownPlayers);
    await loadPlayoffStats(client, playoffPath, teamId, knownPlayers);
    await client.query('COMMIT');

    console.log(`Done. ${knownPlayers.length} total distinct players after backfill.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const [, , careerPath, playoffPath] = process.argv;
if (!careerPath || !playoffPath) {
  console.error('Usage: node scripts/backfillHistorical.js <CareerStats.xlsx> <PlayoffCareerStats.xlsx>');
  process.exit(1);
}
run(careerPath, playoffPath)
  .then(() => {
    console.log('Backfill complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  });
