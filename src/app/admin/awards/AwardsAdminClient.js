'use client';

import { useEffect, useState } from 'react';
import { BASE_PATH } from '@/lib/basePath';
import PlayerPicker from '@/components/PlayerPicker';
import { KNOWN_SOURCES, POSITIONS, LABEL_SUGGESTIONS_BY_SOURCE } from '@/lib/awardOptions';

const INPUT = 'border rounded px-3 py-2 text-sm w-full';
const TEAM_LEVELS = ['Varsity', 'JV Gold', 'JV Blue'];
const AWARD_CATEGORIES = ['Coaches Award', 'Rookie Award', 'Anchor Award', 'E&A', 'Most Improved', 'D MVP', 'O MVP', 'MVP'];

function DeleteButton({ onConfirm }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (confirming) {
    return (
      <span className="text-xs">
        <button
          onClick={async () => {
            setBusy(true);
            await onConfirm();
            setBusy(false);
          }}
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

// Internal (team-voted) awards -- TM-18 point 1.
function TeamAwardsPanel({ seasonYear }) {
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ teamLevel: 'Varsity', awardCategory: 'Coaches Award', playerName: '', graduationYear: '' });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/team-awards?season=${seasonYear}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAwards(data.awards);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonYear]);

  async function handleAdd() {
    if (!form.playerName.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/team-awards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonYear, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((f) => ({ ...f, playerName: '', graduationYear: '' }));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const res = await fetch(`${BASE_PATH}/api/admin/team-awards/${id}`, { method: 'DELETE' });
    if (res.ok) await load();
  }

  return (
    <section className="mb-12">
      <h2 className="text-lg font-semibold mb-1 border-b pb-1">Internal (Team) Awards</h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
        Coaches Award, Rookie Award, and Anchor Award are always Varsity. E&amp;A, Most Improved, D MVP, and O MVP
        repeat across Varsity / JV Gold / JV Blue. Not every award needs a winner every season, and multiple
        players may share one.
      </p>

      <div className="flex flex-wrap gap-2 mb-4 items-start">
        <select
          className={INPUT}
          style={{ width: '9rem' }}
          value={form.teamLevel}
          onChange={(e) => setForm((f) => ({ ...f, teamLevel: e.target.value }))}
        >
          {TEAM_LEVELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <select
          className={INPUT}
          style={{ width: '11rem' }}
          value={form.awardCategory}
          onChange={(e) => setForm((f) => ({ ...f, awardCategory: e.target.value }))}
        >
          {AWARD_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div style={{ minWidth: '18rem' }} className="flex-1">
          <PlayerPicker
            className={INPUT}
            name={form.playerName}
            onNameChange={(v) => setForm((f) => ({ ...f, playerName: v }))}
            graduationYear={form.graduationYear}
            onGraduationYearChange={(v) => setForm((f) => ({ ...f, graduationYear: v }))}
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={saving || !form.playerName.trim()}
          className="px-3 py-2 rounded bg-slate-800 text-white text-sm disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add'}
        </button>
      </div>
      {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : awards.length === 0 ? (
        <p className="text-sm text-gray-400">No team awards entered for {seasonYear} yet.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {awards.map((a) => (
              <tr key={a.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-1.5 pr-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{a.team_level}</td>
                <td className="py-1.5 pr-3 font-medium whitespace-nowrap">{a.award_category}</td>
                <td className="py-1.5 pr-3">{a.player_name}</td>
                <td className="py-1.5 text-right"><DeleteButton onConfirm={() => handleDelete(a.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

// External honors -- League, OHSLCA, USA Lacrosse, OHSAA, ... -- TM-18 point 2.
function SeasonHonorsPanel({ seasonYear }) {
  const [honors, setHonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    honorSource: '',
    honorLabel: '',
    position: '',
    playerName: '',
    graduationYear: '',
    note: '',
  });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/season-honors?season=${seasonYear}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHonors(data.honors);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonYear]);

  async function handleAdd() {
    if (!form.playerName.trim() || !form.honorSource.trim() || !form.honorLabel.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/season-honors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonYear, gradYear: form.graduationYear, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((f) => ({ ...f, honorLabel: '', position: '', playerName: '', graduationYear: '', note: '' }));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const res = await fetch(`${BASE_PATH}/api/admin/season-honors/${id}`, { method: 'DELETE' });
    if (res.ok) await load();
  }

  const labelSuggestions = LABEL_SUGGESTIONS_BY_SOURCE[form.honorSource] || [];

  return (
    <section>
      <h2 className="text-lg font-semibold mb-1 border-b pb-1">External Honors</h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
        League (CHSL), OHSLCA Region/State, USA Lacrosse, OHSAA, and anything else that comes up -- source and
        label are free text with suggestions, not a fixed list, since the full set (OHSAA especially) isn&apos;t
        fully known. Grad year is the player&apos;s own class year, separate from the season the honor was earned.
      </p>

      <div className="grid sm:grid-cols-2 gap-2 mb-2">
        <input
          className={INPUT}
          list="honor-sources"
          placeholder="Source (e.g. OHSLCA - Region)"
          value={form.honorSource}
          onChange={(e) => setForm((f) => ({ ...f, honorSource: e.target.value }))}
        />
        <datalist id="honor-sources">
          {KNOWN_SOURCES.map((s) => <option key={s} value={s} />)}
        </datalist>

        <input
          className={INPUT}
          list="honor-labels"
          placeholder="Label (e.g. 1st Team All-Region)"
          value={form.honorLabel}
          onChange={(e) => setForm((f) => ({ ...f, honorLabel: e.target.value }))}
        />
        <datalist id="honor-labels">
          {labelSuggestions.map((l) => <option key={l} value={l} />)}
        </datalist>
      </div>

      <div className="grid sm:grid-cols-2 gap-2 mb-2">
        <select
          className={INPUT}
          value={form.position}
          onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
        >
          <option value="">— No position (e.g. Player of the Year) —</option>
          {POSITIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          className={INPUT}
          placeholder="Note (optional)"
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-start">
        <div style={{ minWidth: '18rem' }} className="flex-1">
          <PlayerPicker
            className={INPUT}
            name={form.playerName}
            onNameChange={(v) => setForm((f) => ({ ...f, playerName: v }))}
            graduationYear={form.graduationYear}
            onGraduationYearChange={(v) => setForm((f) => ({ ...f, graduationYear: v }))}
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={saving || !form.playerName.trim() || !form.honorSource.trim() || !form.honorLabel.trim()}
          className="px-3 py-2 rounded bg-slate-800 text-white text-sm disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add'}
        </button>
      </div>
      {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : honors.length === 0 ? (
        <p className="text-sm text-gray-400">No external honors entered for {seasonYear} yet.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {honors.map((h) => (
              <tr key={h.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-1.5 pr-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{h.honor_source}</td>
                <td className="py-1.5 pr-3 font-medium whitespace-nowrap">{h.honor_label}</td>
                <td className="py-1.5 pr-3 whitespace-nowrap">
                  {h.player_name}{h.position ? ` (${h.position})` : ''}{h.grad_year ? ` '${String(h.grad_year).slice(-2)}` : ''}
                </td>
                <td className="py-1.5 pr-3 text-gray-400 dark:text-gray-500">{h.note || ''}</td>
                <td className="py-1.5 text-right"><DeleteButton onConfirm={() => handleDelete(h.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function AwardsAdminClient({ initialSeasonYear }) {
  const [seasonYear, setSeasonYear] = useState(initialSeasonYear);

  return (
    <div>
      <div className="flex items-center gap-2 mb-8">
        <label className="text-sm text-gray-500 dark:text-gray-400">Season</label>
        <input
          type="number"
          className={INPUT}
          style={{ width: '7rem' }}
          value={seasonYear}
          onChange={(e) => setSeasonYear(parseInt(e.target.value, 10) || '')}
        />
      </div>

      {Number.isFinite(seasonYear) && (
        <>
          <TeamAwardsPanel seasonYear={seasonYear} />
          <SeasonHonorsPanel seasonYear={seasonYear} />
        </>
      )}
    </div>
  );
}
