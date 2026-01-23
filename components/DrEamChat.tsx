'use client';
import { useState } from 'react';

export default function DrEamChat() {
  const [q, setQ] = useState('');
  const [a, setA] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ q })
      });
      const j = await r.json();
      setA(j?.a ?? 'No answer');
    } catch (err: any) {
      setA(err?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-4">
      <div className="font-medium mb-2">InnerDreams (demo)</div>
      <form onSubmit={ask} className="flex gap-2">
        <input
          className="input flex-1 border rounded px-3 py-2"
          placeholder="Ask something…"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
        />
        <button className="btn px-4" disabled={loading}>
          {loading ? '…' : 'Ask'}
        </button>
      </form>
      {a && <div className="text-sm mt-3 whitespace-pre-wrap">{a}</div>}
    </div>
  );
}
