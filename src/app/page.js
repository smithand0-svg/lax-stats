import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">St. John&apos;s Jesuit Lacrosse Stats</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">MVP build in progress.</p>
      <div className="flex flex-wrap gap-4">
        <Link href="/leaderboard" className="bg-slate-800 text-white px-4 py-2 rounded">
          Leaderboards
        </Link>
        <Link href="/seasons" className="border border-slate-800 dark:border-slate-400 px-4 py-2 rounded">
          Seasons
        </Link>
        <Link href="/search" className="border border-slate-800 dark:border-slate-400 px-4 py-2 rounded">
          Find a Player
        </Link>
        <Link href="/admin/import" className="border border-slate-800 dark:border-slate-400 px-4 py-2 rounded">
          Admin: Import Game
        </Link>
        <Link href="/coaching-stats" className="border border-slate-800 dark:border-slate-400 px-4 py-2 rounded">
          Coaching Stats
        </Link>
        <Link href="/season-history" className="border border-slate-800 dark:border-slate-400 px-4 py-2 rounded">
          Season History
        </Link>
        <Link href="/college-honors" className="border border-slate-800 dark:border-slate-400 px-4 py-2 rounded">
          College &amp; All-Americans
        </Link>
        <Link href="/team-stats" className="border border-slate-800 dark:border-slate-400 px-4 py-2 rounded">
          Team Stats
        </Link>
        <Link href="/season-awards" className="border border-slate-800 dark:border-slate-400 px-4 py-2 rounded">
          Season Awards
        </Link>
      </div>
    </main>
  );
}
