'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_PATH } from '@/lib/basePath';

// TM-24. Three states: idle button -> Yes/No coach-continuing prompt ->
// (if No) inline name field -> submit. Modeled on FinalizeButton's
// expand-in-place pattern, but this one branches instead of just
// confirming, since "No" needs an extra piece of information before it
// can proceed.
// TM-36: also asks for the new season's division, prefilled with the
// current season's, since division is known before the season starts.
export default function AdvanceSeasonButton({ currentYear, currentHeadCoach, currentDivision }) {
  const router = useRouter();
  const nextYear = currentYear + 1;
  const [stage, setStage] = useState('idle'); // idle | prompt | newCoachName
  const [newCoachName, setNewCoachName] = useState('');
  const [division, setDivision] = useState(currentDivision != null ? String(currentDivision) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submitAdvance(continuing) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/seasons/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ continuing, newHeadCoach: continuing ? undefined : newCoachName, division }),
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

  const divisionField = (
    <label className="flex items-center gap-2 text-sm w-full mb-2">
      <span className="text-gray-600 dark:text-gray-400">Division for {nextYear}:</span>
      <input
        type="text"
        inputMode="numeric"
        value={division}
        onChange={(e) => setDivision(e.target.value)}
        placeholder="e.g. 2"
        className="w-16 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-transparent text-sm"
      />
      <span className="text-xs text-gray-400">optional</span>
    </label>
  );

  if (stage === 'newCoachName') {
    return (
      <div className="flex items-center gap-2 text-sm flex-wrap">
        {divisionField}
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
        {divisionField}
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
