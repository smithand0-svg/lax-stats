import { redirect } from 'next/navigation';

// TM-33: /admin itself has no page of its own. It lands on Import, the
// task done most often (after every game in season).
export const dynamic = 'force-dynamic';

export default function AdminIndex() {
  redirect('/admin/import');
}
