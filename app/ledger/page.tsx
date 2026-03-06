'use client';

/**
 * /ledger — Ledger Intelligence Dashboard
 *
 * Ten sections:
 *  1  Hero              — Title, tagline, live strain badge
 *  2  Strain Monitor    — Radial gauge + key metrics
 *  3  Record Experience — Log an experience + outcome
 *  4  Action Decider    — Explore-or-exploit decision engine
 *  5  Phase Shift       — Manual phase-shift control
 *  6  Ledger Journal    — Scrollable history of entries
 *  7  Analytics         — Explore/exploit ratio, stat grid
 *  8  AI State          — Raw JSON state viewer
 *  9  How It Works      — Algorithm explainer
 * 10  Integration       — Connect with DREAMengin AI triad
 */

import { useState, useEffect, useCallback } from 'react';
import StrainGauge from '@/components/ledger/StrainGauge';
import ExperienceRecorder from '@/components/ledger/ExperienceRecorder';
import ActionDecider from '@/components/ledger/ActionDecider';
import LedgerHistory from '@/components/ledger/LedgerHistory';
import LedgerAnalytics from '@/components/ledger/LedgerAnalytics';
import type { LedgerEntry, LedgerState } from '@/lib/ledger/LedgerAI';

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  id,
  title,
  subtitle,
  children,
  accent = 'from-purple-600 to-blue-600',
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-4">
        <h2 className={`text-xl font-bold bg-gradient-to-r ${accent} bg-clip-text text-transparent`}>
          {title}
        </h2>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5 ${className}`}
    >
      {children}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const EMPTY_STATE: LedgerState = {
  strain: 0,
  ledgerSize: 0,
  stepCount: 0,
  deltaP: 0.1,
  exploreCount: 0,
  exploitCount: 0,
  phaseShiftCount: 0,
};

export default function LedgerPage() {
  const [state, setState] = useState<LedgerState>(EMPTY_STATE);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [phaseShifting, setPhaseShifting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // ── Fetch current state on mount ─────────────────────────────────────────

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/ledger');
      const data = (await res.json()) as {
        ok: boolean;
        state?: LedgerState;
        ledger?: LedgerEntry[];
      };
      if (data.ok && data.state) {
        setState(data.state);
        setEntries(data.ledger ?? []);
      }
    } catch {
      /* silently ignore on mount */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // ── Phase shift ───────────────────────────────────────────────────────────

  async function triggerPhaseShift() {
    setPhaseShifting(true);
    try {
      const res = await fetch('/api/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'phase-shift' }),
      });
      const data = (await res.json()) as { ok: boolean; state?: LedgerState };
      if (data.ok && data.state) {
        setState(data.state);
        await refresh();
      }
    } finally {
      setPhaseShifting(false);
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  async function resetAll() {
    if (!confirm('Reset the entire ledger? This cannot be undone.')) return;
    setResetting(true);
    try {
      const res = await fetch('/api/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = (await res.json()) as { ok: boolean; state?: LedgerState };
      if (data.ok && data.state) {
        setState(data.state);
        setEntries([]);
        setLastAction(null);
      }
    } finally {
      setResetting(false);
    }
  }

  // ── Sidebar navigation ────────────────────────────────────────────────────

  const navItems = [
    { id: 'hero', label: 'Overview' },
    { id: 'strain', label: 'Strain Monitor' },
    { id: 'record', label: 'Record' },
    { id: 'decide', label: 'Decide' },
    { id: 'phase', label: 'Phase Shift' },
    { id: 'journal', label: 'Journal' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'state', label: 'AI State' },
    { id: 'how', label: 'How It Works' },
    { id: 'integration', label: 'Integration' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10 flex gap-8">

        {/* ── Sticky sidebar ──────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col gap-1 w-44 shrink-0 sticky top-20 self-start">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
            Sections
          </p>
          {navItems.map(n => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className="rounded-xl px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition"
            >
              {n.label}
            </a>
          ))}

          <div className="mt-4 border-t border-white/10 pt-4 flex flex-col gap-2">
            <button
              onClick={() => void triggerPhaseShift()}
              disabled={phaseShifting}
              className="rounded-xl bg-amber-600/20 border border-amber-500/30 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-600/30 transition disabled:opacity-40"
            >
              {phaseShifting ? 'Shifting…' : '⟳ Phase Shift'}
            </button>
            <button
              onClick={() => void resetAll()}
              disabled={resetting}
              className="rounded-xl bg-rose-600/20 border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-600/30 transition disabled:opacity-40"
            >
              {resetting ? 'Resetting…' : '✕ Reset All'}
            </button>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col gap-12 min-w-0">

          {/* ── Section 1: Hero ──────────────────────────────────────── */}
          <section id="hero" className="scroll-mt-20">
            <div className="rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-white/10 p-8 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                  <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Ledger Intelligence
                  </h1>
                  <p className="mt-2 text-slate-400 max-w-lg">
                    An adaptive AI engine that learns from experience, balances exploration and
                    exploitation, and compresses knowledge through phase shifts — powering
                    personalised decisions across DREAMengin.
                  </p>
                </div>

                {/* Live strain badge */}
                <div className="shrink-0">
                  <StrainGauge strain={state.strain} size={140} />
                </div>
              </div>

              {/* Quick stats */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                {[
                  { label: 'Steps', value: state.stepCount },
                  { label: 'Entries', value: state.ledgerSize },
                  { label: 'Phase Shifts', value: state.phaseShiftCount },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl bg-white/5 border border-white/8 px-4 py-3">
                    <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Section 2: Strain Monitor ────────────────────────────── */}
          <Section
            id="strain"
            title="Strain Monitor"
            subtitle="Real-time visualisation of accumulated cognitive strain."
            accent="from-sky-400 to-blue-600"
          >
            <Card className="flex flex-col sm:flex-row items-center gap-8">
              <StrainGauge strain={state.strain} size={200} />
              <div className="flex-1 grid grid-cols-2 gap-4">
                {[
                  { label: 'Current Strain', value: state.strain.toFixed(6) },
                  { label: 'Learning Rate (δP)', value: state.deltaP.toFixed(3) },
                  { label: 'Explore Calls', value: state.exploreCount },
                  { label: 'Exploit Calls', value: state.exploitCount },
                ].map(m => (
                  <div key={m.label} className="rounded-xl bg-white/5 border border-white/8 px-4 py-3">
                    <p className="text-lg font-bold tabular-nums text-white">{m.value}</p>
                    <p className="text-xs text-slate-500">{m.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </Section>

          {/* ── Section 3: Record Experience ─────────────────────────── */}
          <Section
            id="record"
            title="Record Experience"
            subtitle="Log an event with a reward or penalty. Strain updates immediately."
            accent="from-emerald-400 to-teal-600"
          >
            <Card>
              <ExperienceRecorder
                onRecorded={newState => {
                  setState(newState);
                  void refresh();
                }}
              />
            </Card>
          </Section>

          {/* ── Section 4: Action Decider ────────────────────────────── */}
          <Section
            id="decide"
            title="Action Decider"
            subtitle="Build an action space and let the Ledger AI choose the optimal next move."
            accent="from-blue-400 to-indigo-600"
          >
            <Card>
              <ActionDecider
                onDecided={(action, newState) => {
                  setState(newState);
                  setLastAction(action);
                  void refresh();
                }}
              />
              {lastAction && (
                <div className="mt-4 rounded-xl bg-indigo-900/30 border border-indigo-500/20 px-4 py-3">
                  <p className="text-xs text-indigo-400 uppercase tracking-wider">Last Decision</p>
                  <p className="mt-1 text-white font-semibold">{lastAction}</p>
                </div>
              )}
            </Card>
          </Section>

          {/* ── Section 5: Phase Shift ───────────────────────────────── */}
          <Section
            id="phase"
            title="Phase Shift"
            subtitle="Compress all ledger outcomes via signed-log and halve strain. Like levelling up."
            accent="from-amber-400 to-orange-600"
          >
            <Card>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-1">
                  <p className="text-sm text-slate-300 mb-3">
                    A phase shift applies <code className="bg-white/10 px-1 rounded text-xs">slog(x) = sign(x)·ln(1+|x|)</code>{' '}
                    to every outcome in the ledger and multiplies strain by 0.5. Use it when strain
                    exceeds 2 or when you want to &quot;compress&quot; accumulated knowledge.
                  </p>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span>Phase shifts taken: <strong className="text-white">{state.phaseShiftCount}</strong></span>
                    <span>·</span>
                    <span>Current strain: <strong className="text-white">{state.strain.toFixed(4)}</strong></span>
                  </div>
                </div>
                <button
                  onClick={() => void triggerPhaseShift()}
                  disabled={phaseShifting}
                  className="shrink-0 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-semibold text-white text-sm shadow-lg hover:opacity-90 disabled:opacity-40 transition"
                >
                  {phaseShifting ? 'Shifting…' : '⟳ Trigger Phase Shift'}
                </button>
              </div>
            </Card>
          </Section>

          {/* ── Section 6: Ledger Journal ────────────────────────────── */}
          <Section
            id="journal"
            title="Ledger Journal"
            subtitle="Every recorded experience, newest first."
            accent="from-violet-400 to-purple-600"
          >
            <Card>
              <LedgerHistory entries={entries} />
            </Card>
          </Section>

          {/* ── Section 7: Analytics ────────────────────────────────── */}
          <Section
            id="analytics"
            title="Analytics"
            subtitle="Explore/exploit balance, stat grid, and strain health."
            accent="from-pink-400 to-rose-600"
          >
            <Card>
              <LedgerAnalytics state={state} />
            </Card>
          </Section>

          {/* ── Section 8: Raw AI State ──────────────────────────────── */}
          <Section
            id="state"
            title="AI State"
            subtitle="Live JSON snapshot of the LedgerAI engine."
            accent="from-slate-400 to-slate-600"
          >
            <Card>
              <pre className="text-xs font-mono text-emerald-400 bg-black/30 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(state, null, 2)}
              </pre>
              <button
                onClick={() => void refresh()}
                className="mt-3 rounded-xl bg-white/8 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/12 transition"
              >
                ↺ Refresh
              </button>
            </Card>
          </Section>

          {/* ── Section 9: How It Works ──────────────────────────────── */}
          <Section
            id="how"
            title="How It Works"
            subtitle="The algorithm behind Ledger Intelligence."
            accent="from-cyan-400 to-sky-600"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: '📐',
                  title: 'slog(x)',
                  desc: 'A signed logarithm: sign(x)·ln(1+|x|). Keeps outcomes bounded so large rewards don\'t skew the ledger.',
                },
                {
                  icon: '🔩',
                  title: 'Throttling',
                  desc: 'base·(1 + δP·χ) — scales a base value by strain difference. Controls how aggressively the system adapts.',
                },
                {
                  icon: '🔀',
                  title: 'Explore vs Exploit',
                  desc: 'When curiosity × threshold > random, the engine explores. Otherwise it exploits the experience with the highest outcome.',
                },
                {
                  icon: '🌀',
                  title: 'Phase Shift',
                  desc: 'All outcomes are compressed via slog and strain is halved. Prevents runaway strain while preserving relative knowledge.',
                },
                {
                  icon: '📈',
                  title: 'Strain',
                  desc: 'Accumulates as slog(|outcome|)·δP per step. Acts as a pressure metric — high strain tilts the system toward exploitation.',
                },
                {
                  icon: '⚙️',
                  title: 'δP (delta_P)',
                  desc: 'The learning rate. Default 0.1. Higher values mean faster adaptation but more volatility in strain and decisions.',
                },
              ].map(item => (
                <Card key={item.title}>
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </Card>
              ))}
            </div>
          </Section>

          {/* ── Section 10: Integration ─────────────────────────────── */}
          <Section
            id="integration"
            title="DREAMengin Integration"
            subtitle="How Ledger Intelligence connects to the Dr. Eams · IDARi · BoogieMan AI triad."
            accent="from-fuchsia-400 to-purple-600"
          >
            <div className="flex flex-col gap-4">
              <Card>
                <h3 className="font-bold text-white mb-2">🎨 Dr. Eams</h3>
                <p className="text-sm text-slate-400">
                  Dr. Eams uses the Ledger AI to personalise suggestions. Each user interaction is
                  recorded as an experience; the engine decides which creative prompt to surface next
                  based on past reward signals.
                </p>
              </Card>
              <Card>
                <h3 className="font-bold text-white mb-2">🔧 IDARi</h3>
                <p className="text-sm text-slate-400">
                  IDARi reads the ledger state during its daily optimisation cycle. High strain
                  triggers a phase shift in the admin&apos;s decision log, compressing historical
                  proposals and resetting the recommendation engine.
                </p>
              </Card>
              <Card>
                <h3 className="font-bold text-white mb-2">🚔 BoogieMan</h3>
                <p className="text-sm text-slate-400">
                  BoogieMan monitors strain as a risk signal. Critical strain (≥ 2.0) automatically
                  flags requests for elevated scrutiny and may deny actions until a phase shift
                  brings the system back to a safe operating range.
                </p>
              </Card>

              {/* API quick reference */}
              <Card>
                <h3 className="font-bold text-white mb-3">📡 API Quick Reference</h3>
                <div className="flex flex-col gap-2 font-mono text-xs">
                  {[
                    { method: 'GET', path: '/api/ledger', desc: 'Current state + last 50 entries' },
                    { method: 'POST', path: '/api/ledger', desc: '{ action: "record", experience, outcome }' },
                    { method: 'POST', path: '/api/ledger', desc: '{ action: "decide", state, action_space[] }' },
                    { method: 'POST', path: '/api/ledger', desc: '{ action: "phase-shift" }' },
                    { method: 'POST', path: '/api/ledger', desc: '{ action: "reset" }' },
                  ].map((r, i) => (
                    <div key={i} className="flex flex-wrap items-baseline gap-2 rounded-lg bg-white/5 px-3 py-2">
                      <span className={`shrink-0 font-bold ${r.method === 'GET' ? 'text-sky-400' : 'text-emerald-400'}`}>
                        {r.method}
                      </span>
                      <span className="text-white">{r.path}</span>
                      <span className="text-slate-500 text-xs normal-case">{r.desc}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </Section>

        </main>
      </div>
    </div>
  );
}
