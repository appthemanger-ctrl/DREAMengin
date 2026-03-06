'use client';

import type { LedgerState } from '@/lib/ledger/LedgerAI';

interface LedgerAnalyticsProps {
  state: LedgerState;
}

/** Tiny inline bar component. */
function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) * 100 : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="tabular-nums font-medium text-white">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/8 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function LedgerAnalytics({ state }: LedgerAnalyticsProps) {
  const total = state.exploreCount + state.exploitCount;
  const exploreRatio = total > 0 ? (state.exploreCount / total) * 100 : 0;
  const exploitRatio = total > 0 ? (state.exploitCount / total) * 100 : 0;

  const stats = [
    { label: 'Total Steps', value: state.stepCount, icon: '⚡' },
    { label: 'Ledger Entries', value: state.ledgerSize, icon: '📓' },
    { label: 'Phase Shifts', value: state.phaseShiftCount, icon: '🔄' },
    { label: 'δP (learning rate)', value: state.deltaP, icon: '🧮', decimal: true },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <div
            key={s.label}
            className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 flex flex-col gap-0.5"
          >
            <span className="text-lg">{s.icon}</span>
            <span className="text-xl font-bold text-white tabular-nums">
              {('decimal' in s && s.decimal) ? s.value.toFixed(2) : s.value}
            </span>
            <span className="text-xs text-slate-400">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Explore / Exploit ratio */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Explore vs Exploit
        </h4>
        <Bar label={`Explore (${exploreRatio.toFixed(1)}%)`} value={state.exploreCount} max={total} color="bg-sky-500" />
        <Bar label={`Exploit (${exploitRatio.toFixed(1)}%)`} value={state.exploitCount} max={total} color="bg-purple-500" />
      </div>

      {/* Strain health indicator */}
      <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 flex items-center gap-3">
        <div
          className="h-3 w-3 rounded-full shrink-0"
          style={{
            backgroundColor: state.strain < 1
              ? '#22c55e'
              : state.strain < 2
              ? '#eab308'
              : '#ef4444',
          }}
        />
        <div>
          <p className="text-sm font-semibold text-white">
            Strain: {state.strain.toFixed(4)}
            {state.strain < 1 ? ' — Healthy' : state.strain < 2 ? ' — Elevated' : ' — Critical'}
          </p>
          <p className="text-xs text-slate-500">
            {state.strain >= 2
              ? 'Consider triggering a Phase Shift to compress and reset.'
              : 'System is operating within normal parameters.'}
          </p>
        </div>
      </div>
    </div>
  );
}
