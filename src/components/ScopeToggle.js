import Link from 'next/link';

const SCOPES = [
  { key: 'game', label: 'Single Game' },
  { key: 'season', label: 'Single Season' },
  { key: 'career', label: 'Career' },
];

export function resolveScope(rawScope) {
  if (rawScope === 'game' || rawScope === 'season') return rawScope;
  return 'career';
}

/**
 * Single Game/Season/Career toggle -- crossed with the existing
 * Combined/Regular/Playoff ViewToggle on the Leaderboard (TM-15 + TM-19).
 * Same plain-link, zero-JS pattern as ViewToggle: a `scope` query param,
 * read server-side.
 *
 * @param basePath - the current page's own path, e.g. '/leaderboard'
 * @param currentScope - 'game' | 'season' | 'career'
 * @param extraParams - any other query params to preserve (e.g. view)
 */
export default function ScopeToggle({ basePath, currentScope, extraParams = {} }) {
  return (
    <div className="flex gap-2 mb-4">
      {SCOPES.map((s) => {
        const params = new URLSearchParams({ ...extraParams, scope: s.key });
        const isActive = (currentScope || 'career') === s.key;
        return (
          <Link
            key={s.key}
            href={`${basePath}?${params.toString()}`}
            replace
            className={
              isActive
                ? 'text-sm px-3 py-1 rounded bg-slate-800 text-white'
                : 'text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
            }
          >
            {s.label}
          </Link>
        );
      })}
    </div>
  );
}
