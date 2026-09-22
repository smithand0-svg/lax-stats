'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_PATH } from '@/lib/basePath';

// TM-24. Three states: idle button -> Yes/No coach-continuing prompt ->
// (if No) inline name field -> submit. Modeled on FinalizeButton's
// expand-in-place pattern, but this one branches instead of just
// confirming, since "No" needs an extra piece of information before it
// can proceed.
export default function AdvanceSeasonButton({ currentYear, currentHeadCoach }) {
  const router = useRouter();
  const nextYear = currentYear + 1;
  const [stage, setStage] = useState('idle'); // idle | prompt | newCoachName
  const [newCoachName, setNewCoachName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submitAdvance(continuing) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/seasons/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ continuing, newHeadCoach: continuing ? undefined : newCoachName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setStage('idle');
      setNewCoachName('');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (stage === 'newCoachName') {
    return (
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <span className="text-gray-600 dark:text-gray-400">New head coach for {nextYear}:</span>
        <input
          type="text"
          value={newCoachName}
          onChange={(e) => setNewCoachName(e.target.value)}
          placeholder="Full name"
          className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-transparent text-sm"
          autoFocus
        />
        <button
          onClick={() => submitAdvance(false)}
          disabled={busy || !newCoachName.trim()}
          className="px-2 py-1 rounded bg-slate-800 text-white disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Confirm'}
        </button>
        <button
          onClick={() => { setStage('idle'); setNewCoachName(''); setError(''); }}
          disabled={busy}
          className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600"
        >
          Cancel
        </button>
        {error && <span className="text-red-600 text-xs w-full">{error}</span>}
      </div>
    );
  }

  if (stage === 'prompt') {
    return (
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <span className="text-gray-600 dark:text-gray-400">
          Is {currentHeadCoach || 'the current head coach'} continuing as head coach for {nextYear}?
        </span>
        <button
          onClick={() => submitAdvance(true)}
          disabled={busy}
          className="px-2 py-1 rounded bg-slate-800 text-white disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Yes'}
        </button>
        <button
          onClick={() => setStage('newCoachName')}
          disabled={busy}
          className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600"
        >
          No
        </button>
        <button
          onClick={() => { setStage('idle'); setError(''); }}
          disabled={busy}
          className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600"
        >
          Cancel
        </button>
        {error && <span className="text-red-600 text-xs w-full">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setStage('prompt')}
      className="text-sm px-3 py-1 rounded bg-slate-800 text-white"
    >
      Advance Season ({currentYear} → {nextYear})
    </button>
  );
}
