import { notFound } from 'next/navigation';
import { pool } from '@/lib/db';
import ViewToggle from '@/components/ViewToggle';
import { resolveView, gameTypeCondition } from '@/lib/viewFilter';
import { getPlayerAccolades } from '@/lib/playerAccolades';

export const dynamic = 'force-dynamic';

const STAT_LABELS = [
  { key: 'goals', label: 'Goals' },
  { key: 'assists', label: 'Assists' },
  { key: 'points', label: 'Points' },
  { key: 'shots', label: 'Shots' },
  { key: 'shots_on_goal', label: 'Shots on Goal' },
  { key: 'ground_balls', label: 'Ground Balls' },
  { key: 'turnovers', label: 'Turnovers' },
  { key: 'caused_turnovers', label: 'Caused Turnovers' },
  { key: 'faceoff_wins', label: 'Faceoff Wins' },
  { key: 'faceoff_losses', label: 'Faceoff Losses' },
  { key: 'saves', label: 'Saves' },
  { key: 'goals_against', label: 'Goals Against' },
];

async function getPlayer(id) {
  const { rows } = await pool.query(
    `SELECT id, first_name, last_name, graduation_year, is_legacy FROM players WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function getCareerTotals(id, view) {
  const { rows } = await pool.query(
    `SELECT ${STAT_LABELS.map((s) => `SUM(${s.key}) AS ${s.key}`).join(', ')}
     FROM season_totals s WHERE player_id = $1 AND ${gameTypeCondition(view)}`,
    [id]
  );
  return rows[0];
}

async function getSeasonBreakdown(id, view) {
  const { rows } = await pool.query(
    `SELECT season_year, ${STAT_LABELS.map((s) => `SUM(${s.key}) AS ${s.key}`).join(', ')}
     FROM season_totals s WHERE player_id = $1 AND ${gameTypeCondition(view)}
     GROUP BY season_year
     HAVING ${STAT_LABELS.map((s) => `SUM(${s.key})`).join('+')} > 0
     ORDER BY season_year ASC NULLS FIRST`,
    [id]
  );
  return rows;
}

// Player profiles have shown a small amber-badge strip of honors next
// to the name since before TM-18. All-American / Academic All-American
// moved from player_honors into season_honors as part of TM-18 (see
// db/024_season_honors.sql) -- merge both sources back into the same
// shape so this strip keeps showing exactly what it always did. This
// is a narrow fix, not the full TM-38 (awards/honors section on player
// profiles) -- it does not show internal Team Awards or the other
// external-honor sources (League, OHSLCA, OHSAA) TM-18 also added;
// that's TM-38's job.
async function getHonors(id) {
  const [{ rows: collegeHonors }, { rows: usaLaxHonors }] = await Promise.all([
    pool.query(`SELECT * FROM player_honors WHERE player_id = $1`, [id]),
    pool.query(
      `SELECT id, position, honor_label, season_year
       FROM season_honors
       WHERE player_id = $1 AND honor_source = 'USA Lacrosse' AND honor_label IN ('All-American', 'Academic All-American')`,
      [id]
    ),
  ]);
  const migratedHonors = usaLaxHonors.map((h) => ({
    id: `season_honor_${h.id}`,
    honor_type: h.honor_label === 'All-American' ? 'all_american' : 'academic_all_american',
    honor_year: h.season_year,
    position: h.position,
    school: null,
    division: null,
    note: null,
  }));
  return [...collegeHonors, ...migratedHonors].sort((a, b) => (a.honor_year ?? 9999) - (b.honor_year ?? 9999));
}

const HONOR_LABELS = {
  college_commitment: 'College Commitment',
  all_american: 'All-American',
  academic_all_american: 'Academic All-American',
  collegiate_all_american: 'Collegiate All-American',
};

function formatHonor(h) {
  if (h.honor_type === 'college_commitment') {
    return `${h.honor_year} — ${h.position}, ${h.division} ${h.school}`;
  }
  if (h.honor_type === 'collegiate_all_american') {
    return `${h.honor_year} — ${h.position}, ${h.division} ${h.school}${h.note ? ` (${h.note})` : ''}`;
  }
  return h.position ? `${h.honor_year} — ${h.position}` : String(h.honor_year);
}

// TM-38: the full Awards & Honors section, distinct from the small
// badge strip above (which only ever shows the marquee items -- All-
// American/Academic All-American and college outcomes -- and is left
// untouched here). Covers everything TM-18 added: internal Team
// Awards and every external-honor source (League, OHSLCA, USA
// Lacrosse, OHSAA, ...), player-only for now -- coach honors have
// nowhere to attach until TM-37's staff table exists.
async function getPlayerAwards(id) {
  const [{ rows: teamAwards }, { rows: externalHonors }] = await Promise.all([
    pool.query(
      `SELECT id, season_year, team_level, award_category
       FROM team_awards WHERE player_id = $1
       ORDER BY season_year ASC, id ASC`,
      [id]
    ),
    pool.query(
      `SELECT id, season_year, position, honor_source, honor_label
       FROM season_honors WHERE player_id = $1
       ORDER BY season_year ASC, id ASC`,
      [id]
    ),
  ]);
  return { teamAwards, externalHonors };
}

export default async function PlayerProfilePage({ params, searchParams }) {
  const { id } = await params;
  const { view: rawView } = await searchParams;
  const view = resolveView(rawView);

  const player = await getPlayer(id);
  if (!player) notFound();

  const honors = await getHonors(id);
  const { teamAwards, externalHonors } = await getPlayerAwards(id);
  const accolades = await getPlayerAccolades(player.id);

  // Career totals under "combined" always determine which stat columns
  // are shown, so switching the toggle doesn't make columns jump around
  // (e.g. a faceoff specialist whose wins were all in the playoffs still
  // sees a Faceoff Wins column on Regular Season view — just showing 0).
  const combinedCareer = await getCareerTotals(id, 'combined');
  const relevantStats = STAT_LABELS.filter((s) => Number(combinedCareer[s.key]) > 0);

  const [career, seasons] =
    view === 'combined'
      ? [combinedCareer, await getSeasonBreakdown(id, view)]
      : await Promise.all([getCareerTotals(id, view), getSeasonBreakdown(id, view)]);

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold">
        {player.first_name} {player.last_name}
        {player.graduation_year ? ` '${String(player.graduation_year).slice(2)}` : ''}
      </h1>
      {player.is_legacy && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          This player&apos;s records were imported from historical program archives.
        </p>
      )}

      {honors.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {honors.map((h) => (
            <span
              key={h.id}
              className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-2 py-1 rounded"
              title={formatHonor(h)}
            >
              {h.honor_type === 'college_commitment'
                ? `College Commitment: ${h.school} (${h.honor_year})`
                : `${HONOR_LABELS[h.honor_type]} (${h.honor_year})`}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4">
        <ViewToggle basePath={`/players/${id}`} currentView={view} />
      </div>

      <h2 className="text-lg font-semibold mt-4 mb-2 border-b pb-1">Career Totals</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {relevantStats.map((s) => (
          <div key={s.key} className="border rounded p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
            <div className="text-xl font-semibold">{career[s.key] || 0}</div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-10 mb-2 border-b pb-1">Season by Season</h2>
      {seasons.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No {view} data recorded.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Season</th>
                {relevantStats.map((s) => (
                  <th key={s.key} className="pr-4">{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {seasons.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2 pr-4 font-medium">{row.season_year ?? 'Legacy'}</td>
                  {relevantStats.map((s) => (
                    <td key={s.key} className="pr-4">{row[s.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {accolades.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mt-10 mb-1 border-b pb-1">Accolades</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Where {player.first_name} currently ranks on the program&apos;s all-time leaderboards: top 10 single
            games, top 25 seasons and careers. Shown for every view, independent of the toggle above.
          </p>
          {accolades.map((v) => (
            <div key={v.view} className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">{v.label}</h3>
              <div className="grid sm:grid-cols-3 gap-6">
                {v.tiers.map((t) => (
                  <div key={t.scope}>
                    <h4 className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
                      {t.label} <span className="normal-case">(top {t.limit})</span>
                    </h4>
                    <ul className="space-y-1">
                      {t.entries.map((e, i) => (
                        <li
                          key={`${e.statKey}-${i}`}
                          className={`text-sm ${e.isCurrent ? 'bg-amber-100 dark:bg-amber-700/60 -mx-1 px-1 rounded' : ''}`}
                        >
                          <div className="flex justify-between gap-2">
                            <span>
                              <span className="text-gray-400 dark:text-gray-500 inline-block w-9">{e.rankLabel}.</span>
                              {e.statLabel}
                            </span>
                            <span className="font-medium">{e.value}</span>
                          </div>
                          {(e.context || e.extra) && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 ml-9">
                              {[e.context, e.extra].filter(Boolean).join(' · ')}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {(teamAwards.length > 0 || externalHonors.length > 0) && (
        <>
          <h2 className="text-lg font-semibold mt-10 mb-2 border-b pb-1">Awards &amp; Honors</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {teamAwards.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Awards</h3>
                <table className="text-sm w-full">
                  <tbody>
                    {teamAwards.map((a) => (
                      <tr key={a.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-1.5 pr-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{a.season_year}</td>
                        <td className="py-1.5 pr-3 whitespace-nowrap">{a.team_level}</td>
                        <td className="py-1.5 font-medium">{a.award_category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {externalHonors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Honors</h3>
                <table className="text-sm w-full">
                  <tbody>
                    {externalHonors.map((h) => (
                      <tr key={h.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-1.5 pr-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{h.season_year}</td>
                        <td className="py-1.5 pr-3 whitespace-nowrap">{h.honor_source}</td>
                        <td className="py-1.5 font-medium">
                          {h.honor_label}{h.position ? ` (${h.position})` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
