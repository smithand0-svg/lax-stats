'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BASE_PATH } from '@/lib/basePath';

// Free-text player-name input with a dropdown of matching existing
// players. Picking a suggestion fills BOTH the name and graduation-year
// fields, since grad year is what disambiguates a same-name collision
// server-side (same convention used everywhere else in the app). Typing
// a name with no match is still allowed -- the honor still saves with
// player_id left null, same as player_honors always has for pre-stats-
// era honorees. Modeled on OpponentPicker's typing-aid-not-source-of-
// truth pattern.
export default function PlayerPicker({ name, onNameChange, graduationYear, onGraduationYearChange, className }) {
  const [players, setPlayers] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    fetch(`${BASE_PATH}/api/admin/players`)
      .then((res) => res.json())
      .then((data) => setPlayers(data.players || []))
      .catch(() => {
        // Non-fatal -- the field just falls back to plain free-text entry.
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q) return [];
    return players
      .filter((p) => `${p.first_name} ${p.last_name}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [name, players]);

  function selectPlayer(p) {
    onNameChange(`${p.first_name} ${p.last_name}`);
    if (p.graduation_year) onGraduationYearChange(String(p.graduation_year));
    setOpen(false);
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1" ref={containerRef}>
        <input
          className={className}
          placeholder="Player name"
          value={name}
          onChange={(e) => {
            onNameChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {open && suggestions.length > 0 && (
          <ul className="absolute z-10 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded w-full mt-1 max-h-56 overflow-auto shadow-lg text-sm">
            {suggestions.map((p) => (
              <li
                key={p.id}
                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                onMouseDown={() => selectPlayer(p)}
              >
                {p.first_name} {p.last_name}
                {p.graduation_year && (
                  <span className="text-gray-400 dark:text-gray-500 text-xs ml-2">&apos;{String(p.graduation_year).slice(-2)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <input
        className={className}
        style={{ width: '5.5rem' }}
        placeholder="Grad yr"
        inputMode="numeric"
        value={graduationYear}
        onChange={(e) => onGraduationYearChange(e.target.value)}
      />
    </div>
  );
}
