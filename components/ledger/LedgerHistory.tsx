'use client';

import type { LedgerEntry } from '@/lib/ledger/LedgerAI';

interface LedgerHistoryProps {
  entries: LedgerEntry[];
}

export default function LedgerHistory({ entries }: LedgerHistoryProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-500 italic py-4 text-center">
        No experiences recorded yet. Use the recorder above to begin.
      </p>
    );
  }

  const sorted = [...entries].reverse(); // newest first

  return (
    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
      {sorted.map((entry, idx) => {
        const positive = entry.outcome >= 0;
        return (
          <div
            key={idx}
            className="flex items-start gap-3 rounded-xl bg-white/4 border border-white/8 px-4 py-3 hover:bg-white/6 transition"
          >
            {/* Outcome pill */}
            <span
              className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
                positive
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {positive ? '+' : ''}{entry.outcome.toFixed(2)}
            </span>

            {/* Experience text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{entry.exp}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                strain at time: {entry.strain.toFixed(4)}
                {entry.timestamp ? ` · ${new Date(entry.timestamp).toLocaleTimeString()}` : ''}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
