'use client';

import { useState } from 'react';
import type { LedgerState } from '@/lib/ledger/LedgerAI';

interface ExperienceRecorderProps {
  onRecorded: (state: LedgerState) => void;
}

export default function ExperienceRecorder({ onRecorded }: ExperienceRecorderProps) {
  const [exp, setExp] = useState('');
  const [outcome, setOutcome] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const outcomeNum = parseFloat(outcome);
    if (!exp.trim() || isNaN(outcomeNum)) return;

    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'record', experience: exp.trim(), outcome: outcomeNum }),
      });
      const data = (await res.json()) as { ok: boolean; state?: LedgerState; error?: string };
      if (data.ok && data.state) {
        onRecorded(data.state);
        setFeedback(`✓ Recorded. Strain → ${data.state.strain.toFixed(4)}`);
        setExp('');
        setOutcome('');
      } else {
        setFeedback(`✗ ${data.error ?? 'Error'}`);
      }
    } catch {
      setFeedback('✗ Network error');
    } finally {
      setBusy(false);
    }
  }

  const outcomeNum = parseFloat(outcome);
  const outcomeColor =
    isNaN(outcomeNum) ? ''
    : outcomeNum > 0 ? 'text-emerald-400'
    : outcomeNum < 0 ? 'text-rose-400'
    : 'text-slate-400';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Experience
        </label>
        <input
          type="text"
          value={exp}
          onChange={e => setExp(e.target.value)}
          placeholder="e.g. 'User clicked hero CTA'"
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Outcome <span className="normal-case">(positive = reward, negative = punishment)</span>
        </label>
        <input
          type="number"
          step="any"
          value={outcome}
          onChange={e => setOutcome(e.target.value)}
          placeholder="e.g. 1.5 or -0.8"
          className={`rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/60 ${outcomeColor}`}
        />
      </div>

      <button
        type="submit"
        disabled={busy || !exp.trim() || isNaN(parseFloat(outcome))}
        className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? 'Recording…' : 'Record Experience'}
      </button>

      {feedback && (
        <p className={`text-sm ${feedback.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>
          {feedback}
        </p>
      )}
    </form>
  );
}
