'use client';

import { usePathname } from 'next/navigation';
import { BASE_PATH } from '@/lib/basePath';

// TM-33: one shared admin navigation bar, rendered by the admin layout on
// every admin page (except login), instead of each page hand-coding its
// own row of links. Grouped by task:
//   - Game Day: the thing done after every game during the season.
//   - Seasons: advance / finalize, a few times a year.
//   - Records: awards, college commitments, coaching staff, mostly
//     end-of-season upkeep.
// Adding an admin page means adding one entry here.
const GROUPS = [
  { label: 'Game Day', links: [{ href: '/admin/import', text: 'Import Games' }] },
  { label: 'Seasons', links: [{ href: '/admin/seasons', text: 'Advance & Finalize' }] },
  {
    label: 'Records',
    links: [
      { href: '/admin/awards', text: 'Season Awards' },
      { href: '/admin/college-commitments', text: 'College Commitments' },
      { href: '/admin/staff', text: 'Coaching Staff' },
    ],
  },
];

export default function AdminNav() {
  const pathname = usePathname() || '';
  if (pathname.startsWith('/admin/login')) return null;

  async function handleLogout() {
    await fetch(`${BASE_PATH}/api/admin/logout`, { method: 'POST' });
    window.location.href = `${BASE_PATH}/admin/login`;
  }

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
      <div className="max-w-5xl mx-auto px-8 py-3 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
        <span className="font-semibold text-gray-700 dark:text-gray-200">SJJ Lax Admin</span>
        {GROUPS.map((g) => (
          <div key={g.label} className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">{g.label}</span>
            {g.links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
              return (
                <a
                  key={l.href}
                  href={`${BASE_PATH}${l.href}`}
                  aria-current={active ? 'page' : undefined}
                  className={
                    active
                      ? 'font-semibold text-slate-900 dark:text-white border-b-2 border-slate-800 dark:border-white'
                      : 'text-gray-600 dark:text-gray-400 hover:underline'
                  }
                >
                  {l.text}
                </a>
              );
            })}
          </div>
        ))}
        <div className="flex items-center gap-4 ml-auto">
          <a href={`${BASE_PATH}/`} className="text-gray-500 dark:text-gray-400 hover:underline">
            View site
          </a>
          <button onClick={handleLogout} className="text-gray-500 dark:text-gray-400 hover:underline">
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
