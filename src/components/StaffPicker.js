'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BASE_PATH } from '@/lib/basePath';

// Same typing-aid pattern as PlayerPicker, simplified -- staff have no
// graduation year to disambiguate a same-name collision with, so
// there's nothing to fill beyond the name itself.
export default function StaffPicker({ name, onNameChange, className }) {
  const [staff, setStaff] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    fetch(`${BASE_PATH}/api/admin/staff`)
      .then((res) => res.json())
      .then((data) => setStaff(data.staff || []))
      .catch(() => {});
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
    return staff.filter((s) => `${s.first_name} ${s.last_name}`.toLowerCase().includes(q)).slice(0, 8);
  }, [name, staff]);

  return (
    <div className="relative" ref={containerRef}>
      <input
        className={className}
        placeholder="Staff name"
        value={name}
        onChange={(e) => { onNameChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded w-full mt-1 max-h-56 overflow-auto shadow-lg text-sm">
          {suggestions.map((s) => (
            <li
              key={s.id}
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              onMouseDown={() => { onNameChange(`${s.first_name} ${s.last_name}`); setOpen(false); }}
            >
              {s.first_name} {s.last_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
