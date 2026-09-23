import { pool } from '@/lib/db';
import SeasonPicker from './SeasonPicker';

const REGION_TIER_ORDER = ['1st Team All-Region', '2nd Team All-Region', 'Honorable Mention All-Region'];
const CHSL_ORDER = ['CHSL - All Catholic', 'CHSL - All League', 'CHSL - All Academic'];

async function getHonorSeasons() {
  const { rows } = await pool.query(
    `SELECT DISTINCT season_year FROM season_honors
     WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')
     ORDER BY season_year DESC`
  );
  return rows.map((r) => r.season_year);
}

async function getHonorsForSeason(season) {
  const { rows } = await pool.query(
    `SELECT player_name, position, honor_source, honor_label
     FROM season_honors
     WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND season_year = $1
     ORDER BY player_name`,
    [season]
  );
  return rows;
}

function lastName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1];
}

// Groups a season's honors per Andy's spec (2026-09-22):
//   1. USA Lacrosse (All-American, Academic All-American, Bob Scott
//      Award) -- each its own line, at the top, on their own.
//   2. OHSLCA Region/State -- sorted by Region tier, 1st Team at top.
//      A 1st-Team player gets Position Player of the Year and their
//      All-State result lined up in adjacent columns (only 1st-
//      teamers are State-eligible at all).
//   3. League (CHSL) -- sorted All Catholic, then All League, then
//      All Academic.
//   4. Coach honors -- deliberately not built yet (TM-37, no staff
//      table to attach them to); anything genuinely uncategorized
//      lands in a small catch-all so nothing is silently dropped.
function groupHonors(rows) {
  const usaLacrosse = rows.filter((r) => r.honor_source === 'USA Lacrosse');

  const regionStateRows = rows.filter((r) => r.honor_source === 'OHSLCA - Region' || r.honor_source === 'OHSLCA - State');
  const byPlayer = new Map();
  for (const r of regionStateRows) {
    if (!byPlayer.has(r.player_name)) byPlayer.set(r.player_name, { player_name: r.player_name, position: r.position, extras: [] });
    const entry = byPlayer.get(r.player_name);
    if (r.honor_source === 'OHSLCA - Region' && r.honor_label === 'Position Player of the Year') {
      entry.poy = true;
    } else if (r.honor_source === 'OHSLCA - Region' && REGION_TIER_ORDER.includes(r.honor_label)) {
      entry.regionTier = r.honor_label;
    } else if (r.honor_source === 'OHSLCA - State' && r.honor_label !== 'Position Player of the Year') {
      entry.stateTier = r.honor_label;
    } else {
      // Anything else attached to Region/State (e.g. "Region 5 Player
      // of the Year") doesn't have a defined column -- shown as a
      // small note rather than silently dropped.
      entry.extras.push(r.honor_label);
    }
  }
  const regionState = [...byPlayer.values()].sort((a, b) => {
    const ai = REGION_TIER_ORDER.indexOf(a.regionTier);
    const bi = REGION_TIER_ORDER.indexOf(b.regionTier);
    const aRank = ai === -1 ? REGION_TIER_ORDER.length : ai;
    const bRank = bi === -1 ? REGION_TIER_ORDER.length : bi;
    if (aRank !== bRank) return aRank - bRank;
    return lastName(a.player_name).localeCompare(lastName(b.player_name));
  });

  const chslRows = rows.filter((r) => r.honor_source === 'League (CHSL)');
  const chsl = [...chslRows].sort((a, b) => {
    const ai = CHSL_ORDER.indexOf(a.honor_label);
    const bi = CHSL_ORDER.indexOf(b.honor_label);
    const aRank = ai === -1 ? CHSL_ORDER.length : ai;
    const bRank = bi === -1 ? CHSL_ORDER.length : bi;
    if (aRank !== bRank) return aRank - bRank;
    return lastName(a.player_name).localeCompare(lastName(b.player_name));
  });

  const known = new Set([...usaLacrosse, ...regionStateRows, ...chslRows]);
  const other = rows.filter((r) => !known.has(r));

  return { usaLacrosse, regionState, chsl, other };
}

export default async function HonorsTab({ season: seasonParam }) {
  const seasons = await getHonorSeasons();
  if (seasons.length === 0) {
    return <p className="text-sm text-gray-400">No external honors on record yet.</p>;
  }
  const season = seasonParam && seasons.includes(parseInt(seasonParam, 10)) ? parseInt(seasonParam, 10) : seasons[0];
  const rows = await getHonorsForSeason(season);
  const { usaLacrosse, regionState, chsl, other } = groupHonors(rows);

  return (
    <div>
      <SeasonPicker seasons={seasons} current={season} />

      {usaLacrosse.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">USA Lacrosse</h2>
          <div className="space-y-1 text-sm">
            {usaLacrosse.map((h, i) => (
              <div key={i}>
                <span className="font-medium">{h.player_name}</span> — {h.honor_label}
              </div>
            ))}
          </div>
        </div>
      )}

      {regionState.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">OHSLCA — All-Region / All-State</h2>
          <table className="text-sm w-full">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                <th className="py-1.5 pr-3">Player</th>
                <th className="py-1.5 pr-3">Position</th>
                <th className="py-1.5 pr-3">All-Region</th>
                <th className="py-1.5 pr-3">Region POY</th>
                <th className="py-1.5 pr-3">All-State</th>
              </tr>
            </thead>
            <tbody>
              {regionState.map((p, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-900">
                  <td className="py-1.5 pr-3 font-medium">{p.player_name}</td>
                  <td className="py-1.5 pr-3 text-gray-500 dark:text-gray-400">{p.position || ''}</td>
                  <td className="py-1.5 pr-3">{p.regionTier || ''}</td>
                  <td className="py-1.5 pr-3">{p.poy ? 'Yes' : ''}</td>
                  <td className="py-1.5 pr-3">
                    {p.stateTier || ''}
                    {p.extras.length > 0 && (
                      <span className="text-gray-400 dark:text-gray-500 text-xs"> ({p.extras.join(', ')})</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {chsl.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">CHSL</h2>
          <div className="space-y-1 text-sm">
            {chsl.map((h, i) => (
              <div key={i}>
                <span className="font-medium">{h.player_name}</span>
                {h.position ? ` (${h.position})` : ''} — {h.honor_label}
              </div>
            ))}
          </div>
        </div>
      )}

      {other.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Other</h2>
          <div className="space-y-1 text-sm">
            {other.map((h, i) => (
              <div key={i}>
                <span className="font-medium">{h.player_name}</span> — {h.honor_source}: {h.honor_label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
