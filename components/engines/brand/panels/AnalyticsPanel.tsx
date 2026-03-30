'use client';

/**
 * AnalyticsPanel — Brand analytics and A/B test manager for the Brand Engine app.
 *
 * Shows 4 key metrics, trend indicators, and A/B test management.
 * Lives at /engines/brand/analytics.
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, FlaskConical, Check, X } from 'lucide-react';

interface Metric {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
}

interface ABTest {
  id: string;
  name: string;
  variantA: string;
  variantB: string;
  status: 'running' | 'paused' | 'concluded';
  winnerScore: [number, number];
}

const INIT_METRICS: Metric[] = [
  { id: 'reach',       label: 'Reach',        value: '24.8K',  change: '+12%',  trend: 'up'   },
  { id: 'engagement',  label: 'Engagement',   value: '6.4%',   change: '+0.8%', trend: 'up'   },
  { id: 'followers',   label: 'Followers',    value: '3,210',  change: '+87',   trend: 'up'   },
  { id: 'ctr',         label: 'Click Rate',   value: '2.1%',   change: '-0.3%', trend: 'down' },
];

const INIT_TESTS: ABTest[] = [
  {
    id: '1',
    name: 'CTA Button Color',
    variantA: 'Pink (#f472b6)',
    variantB: 'Purple (#a855f7)',
    status: 'running',
    winnerScore: [52, 48],
  },
  {
    id: '2',
    name: 'Headline Tone',
    variantA: '"Drop now 🔥"',
    variantB: '"New release ✨"',
    status: 'running',
    winnerScore: [38, 62],
  },
];

function TrendIcon({ trend }: { trend: Metric['trend'] }) {
  if (trend === 'up')   return <TrendingUp   size={14} className="text-green-400" />;
  if (trend === 'down') return <TrendingDown size={14} className="text-red-400" />;
  return <Minus size={14} className="text-white/40" />;
}

export default function AnalyticsPanel() {
  const [metrics, setMetrics] = useState<Metric[]>(INIT_METRICS);
  const [tests, setTests]   = useState<ABTest[]>(INIT_TESTS);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 900));
    setMetrics((prev) =>
      prev.map((m) => ({
        ...m,
        value: m.id === 'reach'      ? `${(24 + Math.random() * 4).toFixed(1)}K`
             : m.id === 'engagement' ? `${(5.8 + Math.random() * 1.5).toFixed(1)}%`
             : m.id === 'followers'  ? String(3100 + Math.floor(Math.random() * 300))
             : `${(1.8 + Math.random() * 0.8).toFixed(1)}%`,
      }))
    );
    setRefreshing(false);
  }

  function toggleTest(id: string) {
    setTests((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'running' ? 'paused' : 'running' }
          : t
      )
    );
  }

  function pickWinner(testId: string, variant: 'A' | 'B') {
    setTests((prev) =>
      prev.map((t) => t.id === testId ? { ...t, status: 'concluded' } : t)
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Brand Analytics</h1>
            <p className="text-sm text-white/50">Metrics · A/B tests · performance</p>
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs transition-all"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {metrics.map((m) => (
            <div
              key={m.id}
              className="flex flex-col gap-1 p-4 rounded-xl bg-white/[0.04] border border-white/10"
            >
              <span className="text-xs text-white/40">{m.label}</span>
              <span className="text-xl font-bold text-white">{m.value}</span>
              <div className="flex items-center gap-1.5">
                <TrendIcon trend={m.trend} />
                <span
                  className="text-xs"
                  style={{ color: m.trend === 'up' ? '#4ade80' : m.trend === 'down' ? '#f87171' : 'rgba(255,255,255,0.4)' }}
                >
                  {m.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* A/B Tests */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical size={14} className="text-[#f472b6]" />
            <h2 className="text-sm font-semibold text-white">A/B Tests</h2>
          </div>
          <div className="space-y-3">
            {tests.map((test) => (
              <div
                key={test.id}
                className="rounded-xl border bg-white/[0.03] overflow-hidden"
                style={{ borderColor: test.status === 'running' ? '#f472b644' : 'rgba(255,255,255,0.08)' }}
              >
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{test.name}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={
                        test.status === 'running'
                          ? { background: '#10b98122', color: '#10b981' }
                          : test.status === 'paused'
                          ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
                          : { background: '#f472b622', color: '#f472b6' }
                      }
                    >
                      {test.status}
                    </span>
                    {test.status !== 'concluded' && (
                      <button
                        onClick={() => toggleTest(test.id)}
                        className="text-xs text-white/40 hover:text-white transition-colors"
                      >
                        {test.status === 'running' ? 'Pause' : 'Resume'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-4 py-3 grid grid-cols-2 gap-3">
                  {(['A', 'B'] as const).map((v, vi) => {
                    const label = v === 'A' ? test.variantA : test.variantB;
                    const score = test.winnerScore[vi];
                    return (
                      <div key={v} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/50">Variant {v}: {label}</span>
                          <span className="font-bold" style={{ color: score > 50 ? '#4ade80' : 'rgba(255,255,255,0.6)' }}>
                            {score}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${score}%`, background: score > 50 ? '#4ade80' : '#f472b6' }}
                          />
                        </div>
                        {test.status !== 'concluded' && (
                          <button
                            onClick={() => pickWinner(test.id, v)}
                            className="mt-1 text-[10px] text-white/30 hover:text-[#f472b6] flex items-center gap-1 transition-colors"
                          >
                            <Check size={10} />
                            Pick winner
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
