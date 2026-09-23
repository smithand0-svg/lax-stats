'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_PATH } from '@/lib/basePath';

// A bare toggle is too easy to click by accident on something meant to
// lock/unlock a whole season's data -- this requires a second, explicit
// click on a "Yes, finalize"/"Yes, unfinalize" confirm button before
// anything happens. No modal needed; the button just expands in place.
//
// TM-36 point 2: finalizing is also when the end-of-season Season
// History details become known (playoff finish, notes, Brothers Cup,
// league finish), so the finalize confirm expands into an optional form
// for them, prefilled with whatever is already on file. Unfinalizing
// never touches them.
const PLAYOFF_RESULT_SUGGESTIONS = ['Sweet 16', 'Elite 8', 'Final 4', 'State Finals', 'State Champions'];

const INPUT =
  'px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-transparent text-sm w-full';

export default function FinalizeButton({ seasonYear, finalized, details = {}, hasLeague = false }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const initialForm = () => ({
    playoff_result: details.playoff_result || '',
    special_note: details.special_note || '',
    brothers_cup: details.brothers_cup || '',
    league_finish: details.league_finish || '',
  });
  const [form, setForm] = useState(initialForm);

  function cancel() {
    setConfirming(false);
    setError('');
    setForm(initialForm());
  }

  async function handleConfirm() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/seasons/${seasonYear}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalized ? { finalize: false } : { finalize: true, details: form }),
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

  const buttons = (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={handleConfirm}
        disabled={busy}
        className="px-2 py-1 rounded bg-slate-800 text-white disabled:opacity-50"
      >
        {busy ? 'Working…' : `Yes, ${finalized ? 'unfinalize' : 'finalize'}`}
      </button>
      <button onClick={cancel} disabled={busy} className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600">
        Cancel
      </button>
      {error && <span className="text-red-600 text-xs">{error}</span>}
    </div>
  );

  if (confirming && finalized) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600 dark:text-gray-400">Unfinalize {seasonYear}?</span>
        {buttons}
      </div>
    );
  }

  if (confirming) {
    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
    const listId = `playoff-results-${seasonYear}`;
    return (
      <div className="text-sm space-y-2 min-w-[18rem]">
        <p className="text-gray-600 dark:text-gray-400">
          Finalize {seasonYear}? Imports will be locked. Season History details (all optional, blank clears):
        </p>
        <label className="block">
          <span className="text-xs text-gray-500 dark:text-gray-400">Playoff finish</span>
          <input list={listId} className={INPUT} value={form.playoff_result} onChange={set('playoff_result')} placeholder="e.g. Sweet 16" />
          <datalist id={listId}>
            {PLAYOFF_RESULT_SUGGESTIONS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </label>
        {hasLeague && (
          <label className="block">
            <span className="text-xs text-gray-500 dark:text-gray-400">League finish</span>
            <input className={INPUT} value={form.league_finish} onChange={set('league_finish')} placeholder="e.g. 3rd" />
          </label>
        )}
        <label className="block">
          <span className="text-xs text-gray-500 dark:text-gray-400">Brothers Cup score</span>
          <input className={INPUT} value={form.brothers_cup} onChange={set('brothers_cup')} placeholder="e.g. 10-7 or 6-7 OT" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 dark:text-gray-400">Note</span>
          <input className={INPUT} value={form.special_note} onChange={set('special_note')} placeholder="e.g. Joined CHSL" />
        </label>
        {buttons}
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
