import Link from 'next/link';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function searchPlayers(q) {
  if (!q || q.trim().length === 0) return [];
  const { rows } = await pool.query(
    `SELECT id, first_name, last_name, graduation_year
     FROM players
     WHERE (first_name || ' ' || last_name) ILIKE $1
     ORDER BY last_name, first_name
     LIMIT 25`,
    [`%${q.trim()}%`]
  );
  return rows;
}

export default async function SearchPage({ searchParams }) {
  const { q } = await searchParams;
  const results = await searchPlayers(q);

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Find a Player</h1>

      {/* Plain GET form — works without any client-side JS */}
      <form className="mb-6">
        <input
          type="text"
          name="q"
          defaultValue={q || ''}
          placeholder="Player name…"
          className="border rounded px-3 py-2 w-full"
          autoFocus
        />
      </form>

      {q && results.length === 0 && <p className="text-gray-500 dark:text-gray-400">No players found matching &quot;{q}&quot;.</p>}

      <ul className="space-y-1">
        {results.map((p) => (
          <li key={p.id}>
            <Link href={`/players/${p.id}`} className="text-slate-800 dark:text-slate-300 underline">
              {p.first_name} {p.last_name}
              {p.graduation_year ? ` '${String(p.graduation_year).slice(2)}` : ''}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
