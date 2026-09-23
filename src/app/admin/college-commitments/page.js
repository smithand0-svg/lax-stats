import Link from 'next/link';
import { BASE_PATH } from '@/lib/basePath';
import CollegeCommitmentsClient from './CollegeCommitmentsClient';

export const dynamic = 'force-dynamic';

export default function AdminCollegeCommitmentsPage() {
  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="flex justify-between items-start mb-1">
        <h1 className="text-2xl font-bold">College Commitments</h1>
        <div className="flex items-center gap-4">
          <a href={`${BASE_PATH}/admin/awards`} className="text-sm text-gray-500 dark:text-gray-400 underline">
            Season Awards
          </a>
          <a href={`${BASE_PATH}/admin/seasons`} className="text-sm text-gray-500 dark:text-gray-400 underline">
            Season Finalization
          </a>
          <a href={`${BASE_PATH}/admin/staff`} className="text-sm text-gray-500 dark:text-gray-400 underline">
            Coaching Staff
          </a>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Feeds the{' '}
        <Link href="/college-honors" className="underline">
          College Players &amp; All-Americans
        </Link>{' '}
        page. Not tied to season-advance or finalize -- commitments come in on their own timeline.
      </p>
      <CollegeCommitmentsClient />
    </main>
  );
}
