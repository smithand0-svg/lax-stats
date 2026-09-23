import StaffClient from './StaffClient';

export const dynamic = 'force-dynamic';

export default function AdminStaffPage() {
  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="flex justify-between items-start mb-1">
        <h1 className="text-2xl font-bold">Coaching Staff</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Head coaches are pre-populated from Season History. Add anyone else -- assistants, JV coaches -- and their
        per-season roles here. A person can hold more than one role in the same season, even across different
        teams.
      </p>
      <StaffClient />
    </main>
  );
}
