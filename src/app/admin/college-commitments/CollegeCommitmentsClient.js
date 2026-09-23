'use client';

import { useEffect, useState } from 'react';
import { BASE_PATH } from '@/lib/basePath';
import PlayerPicker from '@/components/PlayerPicker';
import { POSITIONS } from '@/lib/awardOptions';

const INPUT = 'border rounded px-3 py-2 text-sm w-full';
const DIVISIONS = ['D1', 'D2', 'D3'];

function DeleteButton({ onConfirm }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (confirming) {
    return (
      <span className="text-xs">
        <button
          onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); }}
          disabled={busy}
          className="text-red-600 underline mr-2 disabled:opacity-50"
        >
          {busy ? 'Removing…' : 'Confirm remove'}
        </button>
        <button onClick={() => setConfirming(false)} disabled={busy} className="text-gray-500 underline">
          Cancel
        </button>
      </span>
    );
  }
  return (
    <button onClick={() => setConfirming(true)} className="text-xs text-gray-400 hover:text-red-600 underline">
      Remove
    </button>
  );
}

export default function CollegeCommitmentsClient() {
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    playerName: '',
    graduationYear: '',
    honorYear: '',
    position: '',
    school: '',
    division: 'D3',
  });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/college-commitments`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCommitments(data.commitments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!form.playerName.trim() || !form.school.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/college-commitments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, honorYear: form.honorYear || form.graduationYear }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((f) => ({ ...f, playerName: '', graduationYear: '', honorYear: '', position: '', school: '' }));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const res = await fetch(`${BASE_PATH}/api/admin/college-commitments/${id}`, { method: 'DELETE' });
    if (res.ok) await load();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2 items-start">
        <div style={{ minWidth: '18rem' }} className="flex-1">
          <PlayerPicker
            className={INPUT}
            name={form.playerName}
            onNameChange={(v) => setForm((f) => ({ ...f, playerName: v }))}
            graduationYear={form.graduationYear}
            onGraduationYearChange={(v) => setForm((f) => ({ ...f, graduationYear: v, honorYear: f.honorYear || v }))}
          />
        </div>
        <select
          className={INPUT}
          style={{ width: '7rem' }}
          value={form.position}
          onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
        >
          <option value="">Position</option>
          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-2 mb-4 items-start">
        <input
          className={INPUT}
          style={{ maxWidth: '20rem' }}
          placeholder="School (e.g. Ohio Wesleyan University)"
          value={form.school}
          onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
        />
        <select
          className={INPUT}
          style={{ width: '6rem' }}
          value={form.division}
          onChange={(e) => setForm((f) => ({ ...f, division: e.target.value }))}
        >
          {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input
          className={INPUT}
          style={{ width: '7rem' }}
          placeholder="Year"
          inputMode="numeric"
          value={form.honorYear}
          onChange={(e) => setForm((f) => ({ ...f, honorYear: e.target.value }))}
        />
        <button
          onClick={handleAdd}
          disabled={saving || !form.playerName.trim() || !form.school.trim()}
          className="px-3 py-2 rounded bg-slate-800 text-white text-sm disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add'}
        </button>
      </div>
      {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : commitments.length === 0 ? (
        <p className="text-sm text-gray-400">No commitments entered yet.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {commitments.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-1.5 pr-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{c.honor_year}</td>
                <td className="py-1.5 pr-3 font-medium whitespace-nowrap">{c.player_name}</td>
                <td className="py-1.5 pr-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{c.position}</td>
                <td className="py-1.5 pr-3 whitespace-nowrap">{c.division} {c.school}</td>
                <td className="py-1.5 text-right"><DeleteButton onConfirm={() => handleDelete(c.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
