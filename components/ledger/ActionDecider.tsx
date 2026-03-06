'use client';

import { useState } from 'react';
import type { LedgerState } from '@/lib/ledger/LedgerAI';

interface ActionDeciderProps {
  onDecided: (action: string, state: LedgerState) => void;
}

export default function ActionDecider({ onDecided }: ActionDeciderProps) {
  const [stateDesc, setStateDesc] = useState('');
  const [actionInput, setActionInput] = useState('');
  const [actions, setActions] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addAction() {
    const trimmed = actionInput.trim();
    if (trimmed && !actions.includes(trimmed)) {
      setActions(prev => [...prev, trimmed]);
    }
    setActionInput('');
  }

  function removeAction(idx: number) {
    setActions(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleDecide() {
    if (!stateDesc.trim() || actions.length === 0) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decide', state: stateDesc.trim(), action_space: actions }),
      });
      const data = (await res.json()) as { ok: boolean; action?: string; state?: LedgerState; error?: string };
      if (data.ok && data.action && data.state) {
        setResult(data.action);
        onDecided(data.action, data.state);
      } else {
        setError(data.error ?? 'Decision failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* State description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Current State
        </label>
        <input
          type="text"
          value={stateDesc}
          onChange={e => setStateDesc(e.target.value)}
          placeholder="e.g. 'User on onboarding step 2'"
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
        />
      </div>

      {/* Action space builder */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Action Space
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={actionInput}
            onChange={e => setActionInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAction())}
            placeholder="Type an action and press Enter"
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
          />
          <button
            type="button"
            onClick={addAction}
            disabled={!actionInput.trim()}
            className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-40"
          >
            Add
          </button>
        </div>

        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {actions.map((a, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 px-3 py-1 text-xs text-blue-300"
              >
                {a}
                <button
                  type="button"
                  onClick={() => removeAction(i)}
                  className="text-blue-400 hover:text-white"
                  aria-label={`Remove ${a}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleDecide}
        disabled={busy || !stateDesc.trim() || actions.length === 0}
        className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? 'Deciding…' : 'Decide Action →'}
      </button>

      {result && (
        <div className="rounded-xl bg-indigo-900/40 border border-indigo-500/30 px-4 py-3">
          <p className="text-xs text-indigo-400 uppercase tracking-wider mb-1">Chosen Action</p>
          <p className="text-white font-semibold">{result}</p>
        </div>
      )}

      {error && <p className="text-sm text-rose-400">✗ {error}</p>}
    </div>
  );
}
