import { pool } from '@/lib/db';
import { BASE_PATH } from '@/lib/basePath';
import AwardsAdminClient from './AwardsAdminClient';

export const dynamic = 'force-dynamic';

async function getCurrentSeasonYear() {
  const { rows } = await pool.query(`SELECT current_season_year FROM teams WHERE slug = 'sjj'`);
  return rows[0]?.current_season_year ?? new Date().getFullYear();
}

export default async function AdminAwardsPage() {
  const currentSeasonYear = await getCurrentSeasonYear();

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-start mb-1">
        <h1 className="text-2xl font-bold">Season Awards</h1>
        <div className="flex items-center gap-4">
          <a href={`${BASE_PATH}/admin/seasons`} className="text-sm text-gray-500 dark:text-gray-400 underline">
            Season Finalization
          </a>
          <a href={`${BASE_PATH}/admin/college-commitments`} className="text-sm text-gray-500 dark:text-gray-400 underline">
            College Commitments
          </a>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Internal (team-voted) awards and external honors (League, OHSLCA, USA Lacrosse, OHSAA, ...), by season.
        Coach/staff honors aren&apos;t entered here yet -- players only for now.
      </p>
      <AwardsAdminClient initialSeasonYear={currentSeasonYear} />
    </main>
  );
}
