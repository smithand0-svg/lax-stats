'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { searchOpponents } from '@/lib/opponentMatcher';
import { BASE_PATH } from '@/lib/basePath';

// Free-text opponent input with a dropdown of matching existing opponents
// (by canonical name OR known alias) plus an explicit "add new opponent"
// option. Picking a suggestion snaps the field to the CANONICAL spelling
// so program stats don't fragment across spelling variants; the final
// resolve-or-create still happens server-side at commit (see
// opponentMatcher.js / importService.js) — this picker is a typing aid,
// not the source of truth.
export default function OpponentPicker({ value, onChange, className }) {
  const [opponents, setOpponents] = useState([]);
  const [aliases, setAliases] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    fetch(`${BASE_PATH}/api/admin/opponents`)
      .then((res) => res.json())
      .then((data) => {
        setOpponents(data.opponents || []);
        setAliases(data.aliases || []);
      })
      .catch(() => {
        // Non-fatal — the field just falls back to plain free-text entry.
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = useMemo(
    () => (value ? searchOpponents(value, opponents, aliases) : []),
    [value, opponents, aliases]
  );

  const trimmed = value.trim();
  const exactCanonicalMatch = opponents.some((o) => o.name.trim().toLowerCase() === trimmed.toLowerCase());

  function selectExisting(o) {
    onChange(o.name);
    setOpen(false);
  }

  function confirmNew() {
    onChange(trimmed);
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        className={className}
        placeholder="Opponent"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && trimmed && (suggestions.length > 0 || !exactCanonicalMatch) && (
        <ul className="absolute z-10 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded w-full mt-1 max-h-56 overflow-auto shadow-lg text-sm">
          {suggestions.map((s) => (
            <li
              key={s.id}
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              onMouseDown={() => selectExisting(s)}
            >
              {s.name}
              {s.isAlias && (
                <span className="text-gray-400 dark:text-gray-500 text-xs ml-2">
                  (matched alias &quot;{s.matchedOn}&quot;)
                </span>
              )}
            </li>
          ))}
          {!exactCanonicalMatch && (
            <li
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-blue-700 dark:text-blue-400 border-t border-gray-200 dark:border-gray-700"
              onMouseDown={confirmNew}
            >
              + Add new opponent: &quot;{trimmed}&quot;
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
