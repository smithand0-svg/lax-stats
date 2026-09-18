'use client';

import { useState } from 'react';
import { BASE_PATH } from '@/lib/basePath';
import OpponentPicker from '@/components/OpponentPicker';

const STATUS_LABELS = {
  exact: { label: 'Matched', color: 'bg-green-100 text-green-800' },
  alias: { label: 'Matched (alias)', color: 'bg-green-100 text-green-800' },
  possible_match: { label: 'Needs your input', color: 'bg-yellow-100 text-yellow-800' },
  new_player: { label: 'New player?', color: 'bg-blue-100 text-blue-800' },
};

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [resolutions, setResolutions] = useState({});
  const [gameMeta, setGameMeta] = useState({ opponent: '', seasonYear: new Date().getFullYear(), gameType: 'regular', gameDate: '' });
  const [status, setStatus] = useState('idle'); // idle | previewing | ready | committing | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  async function handlePreview() {
    if (!file) return;
    setStatus('previewing');
    setErrorMsg('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/import/preview`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data);
      setGameMeta((g) => ({ ...g, opponent: g.opponent || guessOpponent(data.fileName) }));
      setStatus('ready');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  }

  function setResolution(index, resolution) {
    setResolutions((r) => ({ ...r, [index]: resolution }));
  }

  async function handleCommit() {
    setStatus('committing');
    setErrorMsg('');
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/import/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameMeta: { teamId: preview.teamId, ...gameMeta },
          previewRows: preview.previewRows,
          resolutions,
          fileName: preview.fileName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  }

  const allResolved =
    preview &&
    preview.previewRows.every((row, i) => {
      if (row.match.status === 'exact' || row.match.status === 'alias') return true;
      return !!resolutions[i];
    });

  async function handleLogout() {
    await fetch(`${BASE_PATH}/api/admin/logout`, { method: 'POST' });
    window.location.href = `${BASE_PATH}/admin/login`;
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-start mb-2">
        <h1 className="text-2xl font-bold">Import Game Stats</h1>
        <button onClick={handleLogout} className="text-sm text-gray-500 dark:text-gray-400 underline">
          Log out
        </button>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Upload a Hudl &quot;All Athletes — Totals&quot; CSV export.</p>

      {status !== 'done' && (
        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <OpponentPicker
              className="border rounded px-3 py-2 w-full"
              value={gameMeta.opponent}
              onChange={(opponent) => setGameMeta({ ...gameMeta, opponent })}
            />
            <input
              className="border rounded px-3 py-2"
              type="date"
              value={gameMeta.gameDate}
              onChange={(e) => setGameMeta({ ...gameMeta, gameDate: e.target.value })}
            />
            <input
              className="border rounded px-3 py-2"
              type="number"
              placeholder="Season year"
              value={gameMeta.seasonYear}
              onChange={(e) => setGameMeta({ ...gameMeta, seasonYear: parseInt(e.target.value, 10) })}
            />
            <select
              className="border rounded px-3 py-2"
              value={gameMeta.gameType}
              onChange={(e) => setGameMeta({ ...gameMeta, gameType: e.target.value })}
            >
              <option value="regular">Regular season</option>
              <option value="playoff">Playoff</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
            <button
              onClick={handlePreview}
              disabled={!file || status === 'previewing'}
              className="bg-slate-800 text-white px-4 py-2 rounded disabled:opacity-40"
            >
              {status === 'previewing' ? 'Parsing…' : 'Preview import'}
            </button>
          </div>
        </div>
      )}

      {errorMsg && <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{errorMsg}</div>}

      {preview && status !== 'done' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <p>
              <strong>{preview.totalRows}</strong> players parsed —{' '}
              <strong className={preview.needsReview > 0 ? 'text-yellow-700' : 'text-green-700'}>
                {preview.needsReview}
              </strong>{' '}
              need your input.
            </p>
          </div>

          {preview.unmappedColumns?.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Ignored columns (not tracked yet): {preview.unmappedColumns.join(', ')}
            </p>
          )}

          <table className="w-full text-sm border-collapse mb-6">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Athlete (Hudl)</th>
                <th>G</th>
                <th>A</th>
                <th>GB</th>
                <th>Status</th>
                <th>Your decision</th>
              </tr>
            </thead>
            <tbody>
              {preview.previewRows.map((row, i) => {
                const statusInfo = STATUS_LABELS[row.match.status];
                return (
                  <tr key={i} className="border-b">
                    <td className="py-2">{row.fullName}</td>
                    <td>{row.goals}</td>
                    <td>{row.assists}</td>
                    <td>{row.groundBalls}</td>
                    <td>
                      <span className={`text-xs px-2 py-1 rounded ${statusInfo.color}`}>{statusInfo.label}</span>
                    </td>
                    <td>
                      {row.match.status === 'possible_match' && (
                        <div className="flex flex-col gap-1">
                          {row.match.candidates.map((c) => (
                            <label key={c.id} className="text-xs flex items-center gap-1">
                              <input
                                type="radio"
                                name={`row-${i}`}
                                onChange={() => setResolution(i, { action: 'use_existing', playerId: c.id, saveAsAlias: true })}
                              />
                              This is {c.firstName} {c.lastName}
                            </label>
                          ))}
                          <label className="text-xs flex items-center gap-1">
                            <input type="radio" name={`row-${i}`} onChange={() => setResolution(i, { action: 'create_new' })} />
                            Actually a new player
                          </label>
                        </div>
                      )}
                      {row.match.status === 'new_player' && (
                        <label className="text-xs flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={!!resolutions[i]}
                            onChange={(e) => setResolution(i, e.target.checked ? { action: 'create_new' } : undefined)}
                          />
                          Confirm as new player
                        </label>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button
            onClick={handleCommit}
            disabled={!allResolved || !gameMeta.opponent || status === 'committing'}
            className="bg-green-700 text-white px-5 py-2 rounded disabled:opacity-40"
          >
            {status === 'committing' ? 'Saving…' : 'Confirm & save game'}
          </button>
        </div>
      )}

      {status === 'done' && (
        <div className="bg-green-100 text-green-900 p-4 rounded">
          <p className="font-semibold">Saved.</p>
          <p>{result.rowsWritten} player stat lines written to game {result.gameId}.</p>
        </div>
      )}
    </main>
  );
}

function guessOpponent(fileName) {
  // Hudl file names look like "SJJ___Rocky_River____All_Athletes___Totals.csv"
  const match = fileName?.match(/SJJ_+@?_*(.+?)_+All_Athletes/);
  return match ? match[1].replace(/_/g, ' ') : '';
}
