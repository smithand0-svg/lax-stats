'use client';

import { useRouter } from 'next/navigation';

export default function SeasonPicker({ seasons, current }) {
  const router = useRouter();
  return (
    <select
      value={current}
      onChange={(e) => router.push(`/season-awards?tab=honors&season=${e.target.value}`)}
      className="border rounded px-3 py-2 text-sm mb-6"
    >
      {seasons.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  );
}
