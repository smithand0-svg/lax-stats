import Link from 'next/link';

const VIEWS = [
  { key: 'combined', label: 'Combined' },
  { key: 'regular', label: 'Regular Season' },
  { key: 'playoff', label: 'Playoff' },
];

/**
 * Regular/Playoff/Combined toggle, used consistently across the
 * leaderboard, season pages, and player profiles. Implemented as plain
 * links with a `view` query param (not client-side state), so it works
 * with zero JS and each page just reads `searchParams.view` server-side.
 *
 * @param basePath - the current page's own path, e.g. '/leaderboard'
 * @param currentView - 'combined' | 'regular' | 'playoff'
 * @param extraParams - any other query params on this page to preserve
 */
export default function ViewToggle({ basePath, currentView, extraParams = {} }) {
  return (
    <div className="flex gap-2 mb-6">
      {VIEWS.map((v) => {
        const params = new URLSearchParams({ ...extraParams, view: v.key });
        const isActive = (currentView || 'combined') === v.key;
        return (
          <Link
            key={v.key}
            href={`${basePath}?${params.toString()}`}
            className={
              isActive
                ? 'text-sm px-3 py-1 rounded bg-slate-800 text-white'
                : 'text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
            }
          >
            {v.label}
          </Link>
        );
      })}
    </div>
  );
}
