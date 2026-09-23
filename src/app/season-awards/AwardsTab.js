import { pool } from '@/lib/db';
import AwardsPivotClient from './AwardsPivotClient';

// Fixed row order for the pivot table, matching the source spreadsheet's
// own category order. Coaches/Rookie/Anchor are always stored with
// team_level='Varsity' (per Andy: ~99.9999999999999% always Varsity,
// for all of history going forward -- see db/024) but displayed without
// a level prefix, since they're program-level, not level-specific.
const ROW_ORDER = [
  { level: 'Varsity', category: 'Coaches Award', displayLabel: 'Coaches Award' },
  { level: 'Varsity', category: 'Rookie Award', displayLabel: 'Rookie Award' },
  { level: 'Varsity', category: 'Anchor Award', displayLabel: 'Anchor Award' },
  ...['Varsity', 'JV Gold', 'JV Blue'].flatMap((level) =>
    ['E&A', 'Most Improved', 'D MVP', 'O MVP', 'MVP'].map((category) => ({
      level,
      category,
      displayLabel: `${level} ${category}`,
    }))
  ),
];

async function getAllTeamAwards() {
  const { rows } = await pool.query(
    `SELECT season_year, team_level, award_category, player_name
     FROM team_awards
     WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
     ORDER BY season_year ASC`
  );
  return rows;
}

export default async function AwardsTab() {
  const awards = await getAllTeamAwards();
  const seasons = [...new Set(awards.map((a) => a.season_year))].sort((a, b) => b - a);

  // Build cell contents: award -> season -> [winners]
  const grid = {};
  for (const row of ROW_ORDER) {
    grid[`${row.level}|${row.category}`] = {};
  }
  for (const a of awards) {
    const key = `${a.team_level}|${a.award_category}`;
    if (!grid[key]) grid[key] = {}; // a category not in ROW_ORDER (shouldn't happen, but don't drop data silently)
    if (!grid[key][a.season_year]) grid[key][a.season_year] = [];
    grid[key][a.season_year].push(a.player_name);
  }

  const rows = ROW_ORDER.map((r) => ({ ...r, key: `${r.level}|${r.category}` }));

  return <AwardsPivotClient rows={rows} grid={grid} seasons={seasons} />;
}
