import Link from 'next/link';
import { pool } from '@/lib/db';
import AwardsTab from './AwardsTab';
import HonorsTab from './HonorsTab';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'awards', label: 'Awards' },
  { key: 'honors', label: 'Honors' },
];

function TabToggle({ tab }) {
  return (
    <div className="flex gap-2 mb-6">
      {TABS.map((t) => {
        const isActive = tab === t.key;
        return (
          <Link
            key={t.key}
            href={`/season-awards?tab=${t.key}`}
            replace
            className={
              isActive
                ? 'text-sm px-3 py-1 rounded bg-slate-800 text-white'
                : 'text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
            }
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

export default async function SeasonAwardsPage({ searchParams }) {
  const params = await searchParams;
  const tab = params.tab === 'honors' ? 'honors' : 'awards';

  return (
    <main key={tab} className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-1">Season Awards</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        {tab === 'awards'
          ? 'Coaches Award, Rookie Award, Anchor Award, and level-specific E&A / Most Improved / MVP awards, by season.'
          : 'League, OHSLCA, and USA Lacrosse honors, one season at a time.'}
      </p>
      <TabToggle tab={tab} />
      {tab === 'awards' ? <AwardsTab /> : <HonorsTab season={params.season} />}
    </main>
  );
}
