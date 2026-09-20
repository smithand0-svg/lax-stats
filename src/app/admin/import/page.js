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

// Labels for the team-stats review table. Grouped to roughly match how
// Hudl's own report is laid out, for a quick sanity-check scan rather than
// a flat alphabetical dump.
const TEAM_STAT_GROUPS = [
  { title: 'Shooting', fields: [['goals', 'Goals'], ['assists', 'Assists'], ['shots', 'Shots'], ['shotsOnGoal', 'Shots on goal'], ['shotPct', 'Shot %']] },
  { title: 'Possession', fields: [['possessions', 'Possessions'], ['attackingPossessions', 'Attacking poss.'], ['possPerShot', 'Poss./shot'], ['possPerGoal', 'Poss./goal'], ['possPct', 'Poss. %'], ['groundBalls', 'Ground balls']] },
  { title: 'Clears / Rides', fields: [['successfulClears', 'Clears (succ.)'], ['failedClears', 'Clears (failed)'], ['clearPct', 'Clear %'], ['successfulRides', 'Rides (succ.)'], ['failedRides', 'Rides (failed)'], ['ridePct', 'Ride %']] },
  { title: 'Faceoffs', fields: [['faceoffs', 'Faceoffs'], ['faceoffWins', 'Wins'], ['faceoffLosses', 'Losses'], ['faceoffPct', 'FO %']] },
  { title: 'Turnovers / Defense', fields: [['turnovers', 'Turnovers'], ['forcedTurnovers', 'Forced'], ['unforcedTurnovers', 'Unforced'], ['blocks', 'Blocks'], ['causedTurnovers', 'Caused TOs']] },
  { title: 'Goalie', fields: [['goalsAgainst', 'Goals against'], ['saves', 'Saves'], ['savePct', 'Save %']] },
  { title: 'EMO / Man-Down', fields: [['emo', 'EMO chances'], ['emoGoals', 'EMO goals'], ['emoPct', 'EMO %'], ['manDownDefenses', 'Man-down chances'], ['manDownGoalsAgainst', 'Man-down GA'], ['manDownPct', 'Man-down %']] },
  { title: 'Penalties', fields: [['penalties', 'Total'], ['technicalPenalties', 'Technical'], ['personalPenalties', 'Personal']] },
];

export default function ImportPage() {
  const [importMode, setImportMode] = useState('individual'); // individual | game
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [resolutions, setResolutions] = useState({});
  const [gameMeta, setGameMeta] = useState({ opponent: '', seasonYear: new Date().getFullYear(), gameType: 'regular', gameDate: '', round: '' });
  const roundRequiredButMissing = gameMeta.gameType === 'playoff' && !gameMeta.round;
  const [status, setStatus] = useState('idle'); // idle | previewing | ready | committing | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  function switchMode(mode) {
    if (mode === importMode) return;
    setImportMode(mode);
    setFile(null);
    setPreview(null);
    setResolutions({});
    setStatus('idle');
    setErrorMsg('');
    setResult(null);
  }

  async function handlePreview() {
    if (!file) return;
    setStatus('previewing');
    setErrorMsg('');
    const formData = new FormData();
    formData.append('file', file);
    const endpoint = importMode === 'game' ? 'team-preview' : 'preview';
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/import/${endpoint}`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data);
      if (importMode === 'individual') {
        setGameMeta((g) => ({ ...g, opponent: g.opponent || guessOpponent(data.fileName) }));
      }
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
      const endpoint = importMode === 'game' ? 'team-commit' : 'commit';
      const body =
        importMode === 'game'
          ? { gameMeta: { teamId: preview.teamId, ...gameMeta }, stats: preview.stats, fileName: preview.fileName }
          : {
              gameMeta: { teamId: preview.teamId, ...gameMeta },
              previewRows: preview.previewRows,
              resolutions,
              fileName: preview.fileName,
            };
      const res = await fetch(`${BASE_PATH}/api/admin/import/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
    importMode === 'game' ||
    (preview &&
      preview.previewRows.every((row, i) => {
        if (row.match.status === 'exact' || row.match.status === 'alias') return true;
        return !!resolutions[i];
      }));

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

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => switchMode('individual')}
          className={`px-4 py-2 rounded text-sm font-medium ${
            importMode === 'individual' ? 'bg-slate-800 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          Individual Stats
        </button>
        <button
          onClick={() => switchMode('game')}
          className={`px-4 py-2 rounded text-sm font-medium ${
            importMode === 'game' ? 'bg-slate-800 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          Game Stats
        </button>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6 min-h-12">
        {importMode === 'individual'
          ? 'Upload a Hudl "All Athletes — Totals" per-player CSV export. Writes to each player\u2019s game stat lines.'
          : 'Upload a Hudl team-totals CSV export (the "Overall" + per-period report). Writes directly to this game\u2019s team-level stats — no player matching involved.'}
      </p>

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
              onChange={(e) => setGameMeta({ ...gameMeta, gameType: e.target.value, round: '' })}
            >
              <option value="regular">Regular season</option>
              <option value="playoff">Playoff</option>
            </select>
            {gameMeta.gameType === 'playoff' && (
              <select
                className="border rounded px-3 py-2"
                value={gameMeta.round}
                onChange={(e) => setGameMeta({ ...gameMeta, round: e.target.value ? parseInt(e.target.value, 10) : '' })}
              >
                <option value="">Round…</option>
                <option value="64">Round of 64</option>
                <option value="32">Round of 32</option>
                <option value="16">Sweet 16</option>
                <option value="8">Elite 8</option>
                <option value="4">Final 4</option>
                <option value="2">Championship</option>
              </select>
            )}
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

      {errorMsg && <div className="bg-red-100 text-red-800 p-3 rounded mb-4 whitespace-pre-wrap">{errorMsg}</div>}

      {preview && status !== 'done' && importMode === 'individual' && (
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
            disabled={!allResolved || !gameMeta.opponent || roundRequiredButMissing || status === 'committing'}
            className="bg-green-700 text-white px-5 py-2 rounded disabled:opacity-40"
          >
            {status === 'committing' ? 'Saving…' : 'Confirm & save game'}
          </button>
        </div>
      )}

      {preview && status !== 'done' && importMode === 'game' && (
        <div>
          <p className="mb-4">
            Parsed the &quot;Overall&quot; team totals{preview.periodRows?.length > 0 ? ` and ${preview.periodRows.length} period rows (not stored yet — review only)` : ''}. Check these against the export before saving.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 mb-6">
            {TEAM_STAT_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">{group.title}</h3>
                <table className="text-sm w-full">
                  <tbody>
                    {group.fields.map(([field, label]) => (
                      <tr key={field}>
                        <td className="text-gray-600 dark:text-gray-400 pr-2">{label}</td>
                        <td className="font-medium text-right">
                          {preview.stats[field] === null || preview.stats[field] === undefined
                            ? '—'
                            : field.toLowerCase().includes('pct')
                            ? `${preview.stats[field]}%`
                            : preview.stats[field]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          <button
            onClick={handleCommit}
            disabled={!gameMeta.opponent || roundRequiredButMissing || status === 'committing'}
            className="bg-green-700 text-white px-5 py-2 rounded disabled:opacity-40"
          >
            {status === 'committing' ? 'Saving…' : 'Confirm & save team stats'}
          </button>
        </div>
      )}

      {status === 'done' && (
        <div className="bg-green-100 text-green-900 p-4 rounded">
          <p className="font-semibold">Saved.</p>
          <p>
            {importMode === 'game'
              ? `Team stats written for game ${result.gameId}.`
              : `${result.rowsWritten} player stat lines written to game ${result.gameId}.`}
          </p>
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
