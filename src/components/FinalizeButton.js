'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_PATH } from '@/lib/basePath';

// A bare toggle is too easy to click by accident on something meant to
// lock/unlock a whole season's data -- this requires a second, explicit
// click on a "Yes, finalize"/"Yes, unfinalize" confirm button before
// anything happens. No modal needed; the button just expands in place.
export default function FinalizeButton({ seasonYear, finalized }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/seasons/${seasonYear}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalize: !finalized }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setConfirming(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          {finalized ? `Unfinalize ${seasonYear}?` : `Finalize ${seasonYear}? Imports will be locked.`}
        </span>
        <button
          onClick={handleConfirm}
          disabled={busy}
          className="px-2 py-1 rounded bg-slate-800 text-white disabled:opacity-50"
        >
          {busy ? 'Working…' : `Yes, ${finalized ? 'unfinalize' : 'finalize'}`}
        </button>
        <button onClick={() => setConfirming(false)} disabled={busy} className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600">
          Cancel
        </button>
        {error && <span className="text-red-600 text-xs">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={
        finalized
          ? 'text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
          : 'text-sm px-3 py-1 rounded bg-slate-800 text-white'
      }
    >
      {finalized ? 'Unfinalize' : 'Finalize'}
    </button>
  );
}
