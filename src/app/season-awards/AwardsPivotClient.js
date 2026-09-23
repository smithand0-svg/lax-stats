'use client';

import { useState } from 'react';

// Andy: coaches like to see more than one season at once when deciding
// this year's winners, to get a vibe/check consistency against past
// picks -- a real spreadsheet-like pivot (category rows x season
// columns), but with the viewer choosing exactly which seasons to
// compare rather than a fixed window, and scrolling horizontally
// instead of the spreadsheet's print-width columns.
export default function AwardsPivotClient({ rows, grid, seasons }) {
  const [selected, setSelected] = useState(() => new Set(seasons.slice(0, 6)));

  function toggle(year) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  const visibleSeasons = seasons.filter((y) => selected.has(y));

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Seasons to compare:</p>
        <div className="flex flex-wrap gap-1.5">
          {seasons.map((y) => (
            <button
              key={y}
              onClick={() => toggle(y)}
              className={
                selected.has(y)
                  ? 'text-xs px-2 py-1 rounded bg-slate-800 text-white'
                  : 'text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
              }
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {visibleSeasons.length === 0 ? (
        <p className="text-sm text-gray-400">Select at least one season above.</p>
      ) : (
        <div className="overflow-x-auto border rounded border-gray-200 dark:border-gray-800">
          <table className="text-sm border-collapse w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-2 px-3 sticky left-0 bg-white dark:bg-gray-950 whitespace-nowrap">Award</th>
                {visibleSeasons.map((y) => (
                  <th key={y} className="text-left py-2 px-3 whitespace-nowrap font-medium">{y}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-gray-100 dark:border-gray-900">
                  <td className="py-2 px-3 sticky left-0 bg-white dark:bg-gray-950 font-medium whitespace-nowrap">
                    {r.displayLabel}
                  </td>
                  {visibleSeasons.map((y) => {
                    const winners = grid[r.key]?.[y];
                    return (
                      <td key={y} className="py-2 px-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {winners && winners.length > 0 ? winners.join(', ') : <span className="text-gray-300 dark:text-gray-700">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
