import Link from 'next/link';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

const HONOR_LABELS = {
  all_american: 'All-American',
  academic_all_american: 'Academic All-American',
  collegiate_all_american: 'Collegiate All-American',
};

function PlayerName({ honor }) {
  if (honor.player_id) {
    return (
      <Link href={`/players/${honor.player_id}`} className="text-slate-800 dark:text-slate-300 underline">
        {honor.player_name}
      </Link>
    );
  }
  return <span>{honor.player_name}</span>;
}

export default async function CollegeAllAmericansPage() {
  const { rows } = await pool.query(
    `SELECT * FROM player_honors ORDER BY honor_year ASC NULLS LAST, player_name ASC`
  );

  const collegeCommitments = rows.filter((r) => r.honor_type === 'college_commitment');
  const allAmericans = rows.filter((r) => r.honor_type === 'all_american');
  const academicAllAmericans = rows.filter((r) => r.honor_type === 'academic_all_american');
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
