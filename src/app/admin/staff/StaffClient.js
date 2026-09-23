'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BASE_PATH } from '@/lib/basePath';
import { TEAM_LEVELS, ROLE_SUGGESTIONS } from '@/lib/awardOptions';

const INPUT = 'border rounded px-3 py-2 text-sm w-full';

function DeleteButton({ onConfirm, label = 'Remove' }) {
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
          {busy ? 'Removing…' : 'Confirm'}
        </button>
        <button onClick={() => setConfirming(false)} disabled={busy} className="text-gray-500 underline">
          Cancel
        </button>
      </span>
    );
  }
  return (
    <button onClick={() => setConfirming(true)} className="text-xs text-gray-400 hover:text-red-600 underline">
      {label}
    </button>
  );
}

function SeasonForm({ staffId, onAdded }) {
  const [form, setForm] = useState({ seasonYear: '', teamLevel: 'Varsity', role: 'Assistant Coach' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleAdd() {
    if (!form.seasonYear || !form.role.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/staff/${staffId}/seasons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((f) => ({ ...f, seasonYear: '' }));
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2 items-start mt-2">
      <input
        className={INPUT}
        style={{ width: '6rem' }}
        placeholder="Year"
        inputMode="numeric"
        value={form.seasonYear}
        onChange={(e) => setForm((f) => ({ ...f, seasonYear: e.target.value }))}
      />
      <select
        className={INPUT}
        style={{ width: '8rem' }}
        value={form.teamLevel}
        onChange={(e) => setForm((f) => ({ ...f, teamLevel: e.target.value }))}
      >
        {TEAM_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
      <input
        className={INPUT}
        style={{ width: '10rem' }}
        list="role-suggestions"
        placeholder="Role"
        value={form.role}
        onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
      />
      <datalist id="role-suggestions">
        {ROLE_SUGGESTIONS.map((r) => <option key={r} value={r} />)}
      </datalist>
      <button
        onClick={handleAdd}
        disabled={saving || !form.seasonYear || !form.role.trim()}
        className="px-3 py-1.5 rounded bg-slate-800 text-white text-xs disabled:opacity-50"
      >
        {saving ? 'Adding…' : 'Add season'}
      </button>
      {error && <span className="text-red-600 text-xs w-full">{error}</span>}
    </div>
  );
}

function StaffRow({ person, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const [bio, setBio] = useState(person.bio || '');
  const [savingBio, setSavingBio] = useState(false);

  async function saveBio() {
    setSavingBio(true);
    try {
      await fetch(`${BASE_PATH}/api/admin/staff/${person.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio }),
      });
      onChange();
    } finally {
      setSavingBio(false);
    }
  }

  async function removeSeason(seasonId) {
    await fetch(`${BASE_PATH}/api/admin/staff/${person.id}/seasons/${seasonId}`, { method: 'DELETE' });
    onChange();
  }

  async function removeStaff() {
    const res = await fetch(`${BASE_PATH}/api/admin/staff/${person.id}`, { method: 'DELETE' });
    if (res.ok) onChange();
    else {
      const data = await res.json();
      alert(data.error);
    }
  }

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 py-3">
      <div className="flex items-center justify-between">
        <button onClick={() => setExpanded((e) => !e)} className="text-sm font-medium text-left">
          {person.first_name} {person.last_name}
          <span className="text-gray-400 dark:text-gray-500 font-normal ml-2 text-xs">
            {person.seasons.length} season{person.seasons.length === 1 ? '' : 's'}
          </span>
        </button>
        <div className="flex items-center gap-3">
          <Link href={`/coaches/${person.id}`} className="text-xs text-gray-400 hover:text-slate-800 underline">
            View public page
          </Link>
          <DeleteButton onConfirm={removeStaff} label="Remove person" />
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pl-2 border-l-2 border-gray-100 dark:border-gray-800">
          {person.seasons.length > 0 && (
            <table className="text-sm w-full mb-2">
              <tbody>
                {person.seasons.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 dark:border-gray-900">
                    <td className="py-1 pr-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{s.season_year}</td>
                    <td className="py-1 pr-3 whitespace-nowrap">{s.team_level}</td>
                    <td className="py-1 pr-3">{s.role}</td>
                    <td className="py-1 text-right"><DeleteButton onConfirm={() => removeSeason(s.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <SeasonForm staffId={person.id} onAdded={onChange} />

          <div className="mt-4">
            <label className="text-xs text-gray-400 dark:text-gray-500 block mb-1">Bio</label>
            <textarea
              className={INPUT}
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Optional -- not filled out for most people yet"
            />
            <button
              onClick={saveBio}
              disabled={savingBio}
              className="mt-1 px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs disabled:opacity-50"
            >
              {savingBio ? 'Saving…' : 'Save bio'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffClient() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPerson, setNewPerson] = useState({ firstName: '', lastName: '' });
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/staff`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStaff(data.staff);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAddPerson() {
    if (!newPerson.firstName.trim() || !newPerson.lastName.trim()) return;
    setAdding(true);
    setError('');
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPerson),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewPerson({ firstName: '', lastName: '' });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        <input
          className={INPUT}
          style={{ maxWidth: '10rem' }}
          placeholder="First name"
          value={newPerson.firstName}
          onChange={(e) => setNewPerson((f) => ({ ...f, firstName: e.target.value }))}
        />
        <input
          className={INPUT}
          style={{ maxWidth: '10rem' }}
          placeholder="Last name"
          value={newPerson.lastName}
          onChange={(e) => setNewPerson((f) => ({ ...f, lastName: e.target.value }))}
        />
        <button
          onClick={handleAddPerson}
          disabled={adding || !newPerson.firstName.trim() || !newPerson.lastName.trim()}
          className="px-3 py-2 rounded bg-slate-800 text-white text-sm disabled:opacity-50"
        >
          {adding ? 'Adding…' : 'Add person'}
        </button>
      </div>
      {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : staff.length === 0 ? (
        <p className="text-sm text-gray-400">No staff on record yet.</p>
      ) : (
        <div>
          {staff.map((s) => <StaffRow key={s.id} person={s} onChange={load} />)}
        </div>
      )}
    </div>
  );
}
