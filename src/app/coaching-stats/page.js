import Link from 'next/link';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'combined', label: 'Combined' },
  { key: 'regular', label: 'Regular Season' },
  { key: 'playoff', label: 'Playoffs' },
  { key: 'seasons', label: 'Seasons Coached' },
];

// Maps each Combined/Regular/Playoff tab to the matching career win/loss
// columns and the single-season column to rank by.
const CATEGORY_FIELDS = {
  combined: { winsKey: 'tot_w', lossKey: 'tot_l', seasonColumn: 'regular_wins + playoff_wins', label: 'Combined' },
  regular: { winsKey: 'reg_w', lossKey: 'reg_l', seasonColumn: 'regular_wins', label: 'Regular Season' },
  playoff: { winsKey: 'po_w', lossKey: 'po_l', seasonColumn: 'playoff_wins', label: 'Playoffs' },
};

function resolveTab(raw) {
  return TABS.some((t) => t.key === raw) ? raw : 'combined';
}

async function getCoachingCareerStats() {
  const { rows } = await pool.query(`
    SELECT head_coach,
           array_agg(season_year ORDER BY season_year) AS years,
           COUNT(*) AS seasons,
           SUM(regular_wins) AS reg_w, SUM(regular_losses) AS reg_l,
           SUM(playoff_wins) AS po_w, SUM(playoff_losses) AS po_l,
           SUM(total_wins) AS tot_w, SUM(total_losses) AS tot_l
    FROM program_seasons
    WHERE head_coach IS NOT NULL
    GROUP BY head_coach
  `);
  return rows;
}

async function getBestSingleSeasons(column) {
  const { rows } = await pool.query(
    `SELECT head_coach, season_year, ${column} AS value
     FROM program_seasons
     WHERE head_coach IS NOT NULL AND ${column} > 0
     ORDER BY value DESC, season_year ASC`
  );
  return rows;
}

// A coach's tenure isn't always continuous — e.g. Jim Reed coached
// 1995-1997, then again 2003-2006 with someone else in between — so this
// collapses the actual list of years into ranges with real gaps shown as
// separate comma-joined spans, exactly like the player "years active"
// display, rather than a naive MIN-MAX that would wrongly imply an
// unbroken tenure.
function formatCoachYears(years, mostRecentYear) {
  const sorted = [...years].map(Number).sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(formatSpan(start, end, mostRecentYear));
      start = end = sorted[i];
    }
  }
  ranges.push(formatSpan(start, end, mostRecentYear));
  return ranges.join(', ');
}

function formatSpan(start, end, mostRecentYear) {
  if (start === end) return String(start);
  const endLabel = end === mostRecentYear ? 'Present' : String(end);
  return `${start}-${endLabel}`;
}

function pct(w, l) {
  const total = Number(w) + Number(l);
  return total > 0 ? Number((Number(w) / total).toFixed(3)) : null;
}

// Ranks a list (already carrying a numeric `.value`), assigning ties the
// same rank number and skipping ahead afterward — same convention as the
// leaderboard page (T-1, T-2, etc.).
function rankBoard(rows) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  let rank = 0;
  let lastValue = null;
  sorted.forEach((r, i) => {
    if (r.value !== lastValue) {
      rank = i + 1;
      lastValue = r.value;
    }
    r.rnk = rank;
  });
  return sorted;
}

function RankedList({ items, renderLabel, renderValue }) {
  return (
    <ol className="space-y-1 text-sm">
      {items.map((item, idx) => {
        const tiedCount = items.filter((r) => r.rnk === item.rnk).length;
        const rankLabel = tiedCount > 1 ? `T-${item.rnk}` : String(item.rnk);
        return (
          <li key={idx} className="flex justify-between">
            <span>
              {rankLabel}. {renderLabel(item)}
            </span>
            <span className="font-medium">{renderValue(item)}</span>
          </li>
        );
      })}
      {items.length === 0 && <li className="text-gray-400">No data yet</li>}
    </ol>
  );
}

async function getStaffIdByName() {
  const { rows } = await pool.query(
    `SELECT id, first_name || ' ' || last_name AS full_name FROM staff
     WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')`
  );
  const map = {};
  for (const r of rows) map[r.full_name] = r.id;
  return map;
}

// Falls back to plain text for any name that isn't in the staff table
// yet (e.g. a coach added to program_seasons but never backfilled into
// staff) -- never a broken link.
function CoachName({ name, staffIds }) {
  const id = staffIds[name];
  return id ? <Link href={`/coaches/${id}`} className="underline">{name}</Link> : name;
}

export default async function CoachingStatsPage({ searchParams }) {
  const { view: rawView } = await searchParams;
  const tab = resolveTab(rawView);

  const [careerStats, yearRows, staffIds] = await Promise.all([
    getCoachingCareerStats(),
    pool.query('SELECT MAX(season_year) AS y FROM program_seasons WHERE head_coach IS NOT NULL'),
    getStaffIdByName(),
  ]);
  const mostRecentYear = yearRows.rows[0].y;

  const bySeasons = rankBoard(careerStats.map((c) => ({ ...c, value: Number(c.seasons) })));

  let careerWinsBoard = [];
  let winPctBoard = [];
  let singleSeasonBoard = [];
  let fields = null;

  if (tab !== 'seasons') {
    fields = CATEGORY_FIELDS[tab];
    careerWinsBoard = rankBoard(
      careerStats.filter((c) => Number(c[fields.winsKey]) > 0).map((c) => ({ ...c, value: Number(c[fields.winsKey]) }))
    );
    winPctBoard = rankBoard(
      careerStats
        .filter((c) => Number(c[fields.winsKey]) + Number(c[fields.lossKey]) > 0)
        .map((c) => ({ ...c, value: pct(c[fields.winsKey], c[fields.lossKey]) }))
    );
    const rawSeasons = await getBestSingleSeasons(fields.seasonColumn);
    singleSeasonBoard = rankBoard(rawSeasons.map((r) => ({ ...r, value: Number(r.value) })));
  }

  return (
    <main className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-1">Coaches</h1>
      <p className="text-gray-500 dark:text-gray-400">Program history since 1990</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">*2020 season cancelled due to COVID</p>

      <div className="flex gap-2 mb-8">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/coaching-stats?view=${t.key}`}
            replace
            className={
              tab === t.key
                ? 'text-sm px-3 py-1 rounded bg-slate-800 text-white'
                : 'text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === 'seasons' ? (
        <div>
          <h2 className="text-lg font-semibold mb-2 border-b pb-1">Seasons Coached</h2>
          <RankedList
            items={bySeasons}
            renderLabel={(c) => (
              <>
                <CoachName name={c.head_coach} staffIds={staffIds} />{' '}
                <span className="text-gray-400 dark:text-gray-500 text-xs">
                  ({formatCoachYears(c.years, mostRecentYear)})
                </span>
              </>
            )}
            renderValue={(c) => c.value}
          />
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <h2 className="text-lg font-semibold mb-2 border-b pb-1">
                Most Wins ({fields.label} — Single Season)
              </h2>
              <RankedList
                items={singleSeasonBoard}
                renderLabel={(r) => (
                  <>
                    <CoachName name={r.head_coach} staffIds={staffIds} /> <span className="text-gray-400 dark:text-gray-500 text-xs">({r.season_year})</span>
                  </>
                )}
                renderValue={(r) => r.value}
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2 border-b pb-1">Most Wins ({fields.label} — Total)</h2>
              <RankedList
                items={careerWinsBoard}
                renderLabel={(c) => (
                  <>
                    <CoachName name={c.head_coach} staffIds={staffIds} />{' '}
                    <span className="text-gray-400 dark:text-gray-500 text-xs">
                      ({formatCoachYears(c.years, mostRecentYear)})
                    </span>
                  </>
                )}
                renderValue={(c) => c.value}
              />
            </div>
          </div>

          <h2 className="text-xl font-bold mb-4">Win % ({fields.label})</h2>
          <div className="max-w-md">
            <RankedList
              items={winPctBoard}
              renderLabel={(c) => (
                <>
                  <CoachName name={c.head_coach} staffIds={staffIds} />{' '}
                  <span className="text-gray-400 dark:text-gray-500 text-xs">
                    ({c[fields.winsKey]}-{c[fields.lossKey]})
                  </span>
                </>
              )}
              renderValue={(c) => c.value.toFixed(3)}
            />
          </div>
        </>
      )}
    </main>
  );
}
