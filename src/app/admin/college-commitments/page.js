import Link from 'next/link';
import CollegeCommitmentsClient from './CollegeCommitmentsClient';

export const dynamic = 'force-dynamic';

export default function AdminCollegeCommitmentsPage() {
  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="flex justify-between items-start mb-1">
        <h1 className="text-2xl font-bold">College Commitments</h1>
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
