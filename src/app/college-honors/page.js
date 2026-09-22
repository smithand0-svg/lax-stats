import Link from 'next/link';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

const HONOR_LABELS = {
  collegiate_all_american: 'Collegiate All-American',
};

function PlayerName({ honor }) {
  if (honor.player_id) {
    return (
      <Link href={`/players/${honor.player_id}`} replace className="text-slate-800 dark:text-slate-300 underline">
        {honor.player_name}
      </Link>
    );
  }
  return <span>{honor.player_name}</span>;
}

export default async function CollegeAllAmericansPage() {
  // player_honors now covers only college_commitment / collegiate_all_american
  // (recruiting and college-career outcomes) -- All-American and Academic
  // All-American are USA Lacrosse SEASON honors and moved to season_honors
  // as part of TM-18 (see db/024_season_honors.sql).
  const [{ rows }, { rows: usaLaxHonors }] = await Promise.all([
    pool.query(`SELECT * FROM player_honors ORDER BY honor_year ASC NULLS LAST, player_name ASC`),
    pool.query(
      `SELECT id, player_id, player_name, position, honor_label, season_year AS honor_year
       FROM season_honors
       WHERE honor_source = 'USA Lacrosse' AND honor_label IN ('All-American', 'Academic All-American')
       ORDER BY season_year ASC NULLS LAST, player_name ASC`
    ),
  ]);

  const collegeCommitments = rows.filter((r) => r.honor_type === 'college_commitment');
  const allAmericans = usaLaxHonors.filter((h) => h.honor_label === 'All-American');
  const academicAllAmericans = usaLaxHonors.filter((h) => h.honor_label === 'Academic All-American');
  const collegiateAllAmericans = rows.filter((r) => r.honor_type === 'collegiate_all_american');

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-1">College Players &amp; All-Americans</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Program history since 1990</p>

      <h2 className="text-lg font-semibold mb-2 border-b pb-1">College Commitments</h2>
      <table className="text-sm border-collapse w-full mb-10">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 pr-4">Player</th>
            <th className="pr-4">Year</th>
            <th className="pr-4">Position</th>
            <th className="pr-4">School</th>
          </tr>
        </thead>
        <tbody>
          {collegeCommitments.map((h) => (
            <tr key={h.id} className="border-b">
              <td className="py-2 pr-4"><PlayerName honor={h} /></td>
              <td className="pr-4">{h.honor_year}</td>
              <td className="pr-4">{h.position}</td>
              <td className="pr-4">{h.division} {h.school}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-lg font-semibold mb-2 border-b pb-1">All-Americans</h2>
      <ul className="text-sm mb-10 space-y-1">
        {allAmericans.map((h) => (
          <li key={h.id}>
            <PlayerName honor={h} /> — {h.position}, {h.honor_year}
          </li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold mb-2 border-b pb-1">Academic All-Americans</h2>
      <ul className="text-sm mb-10 space-y-1">
        {academicAllAmericans.map((h) => (
          <li key={h.id}>
            <PlayerName honor={h} /> {h.position ? `— ${h.position}, ` : '— '}
            {h.honor_year}
          </li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold mb-2 border-b pb-1">Collegiate All-Americans</h2>
      <ul className="text-sm space-y-1">
        {collegiateAllAmericans.map((h) => (
          <li key={h.id}>
            <PlayerName honor={h} /> — {h.position}, {h.division} {h.school}, {h.honor_year}
            {h.note ? ` (${h.note})` : ''}
          </li>
        ))}
      </ul>
    </main>
  );
}
