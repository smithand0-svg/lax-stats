'use client';

import { useState } from 'react';
import { BASE_PATH } from '@/lib/basePath';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      // Plain full-page navigation rather than client-side routing — more
      // reliable here, since the very next request needs the browser to
      // send the freshly-set cookie along with it.
      window.location.href = `${BASE_PATH}/admin/import`;
      return;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-sm mx-auto mt-24 p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded px-3 py-2 w-full"
          autoFocus
        />
        {error && <p className="text-red-700 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="bg-slate-800 text-white px-4 py-2 rounded w-full disabled:opacity-40"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </main>
  );
}
