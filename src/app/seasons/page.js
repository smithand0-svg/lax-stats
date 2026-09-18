import Link from 'next/link';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function SeasonsIndexPage() {
  const { rows } = await pool.query(
    `SELECT DISTINCT season_year FROM season_totals ORDER BY season_year DESC NULLS LAST`
  );

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Seasons</h1>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.season_year ?? 'legacy'}>
            <Link href={`/seasons/${r.season_year ?? 'legacy'}`} replace className="text-slate-800 dark:text-slate-300 underline">
              {r.season_year ?? 'Legacy (undated historical records)'}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
