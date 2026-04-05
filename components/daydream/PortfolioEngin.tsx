'use client';

/**
 * PortfolioEngin — Side B control layer for the Optimizero Daydream.
 *
 * Lets the user configure and trigger a Markowitz / QUBO portfolio optimization
 * run directly from the DREAMengin UI.  All computation is dispatched to the
 * GitHub Actions workflow via the /api/ai/idari admin endpoint.
 *
 * Architecture: docs/ARCHITECTURE.md §1 (Daydream pair system)
 * Privacy:      all runs are owner-scoped (no public exposure)
 * Performance:  render-on-demand; no polling or continuous loops
 */

import { useState } from 'react';
import { ArrowLeft, TrendingUp, Activity, ShieldCheck, Cpu } from 'lucide-react';
import QuantumCircuitCanvas from './QuantumCircuitCanvas';
import { useForgeActivity } from '@/lib/forge/useForgeActivity';
import { recordForgeTransfer } from '@/lib/forge/forgeIntelligence';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import JourneyTrail from '@/components/daydream/JourneyTrail';

interface Props {
  onBack: () => void;
}

// ── design token ──────────────────────────────────────────────
const ACCENT  = '#2a8ab8';   // DREAMengin light-blue (live / connected state)
const GOLD    = '#c8981a';   // DREAMengin gold (action / confirm)
const PURPLE  = '#8b5cf6';   // quantum / ansatz accent

// ── option types ──────────────────────────────────────────────
type Algorithm = 'vqe' | 'qaoa';
type Backend   = 'local_simulator' | 'ibm_quantum';
type Ansatz    = 'real_amplitudes' | 'efficient_su2';

interface RunResult {
  algorithm: string;
  backend: string;
  objectiveValue: string;
  expectedReturn: string;
  portfolioRisk: string;
  sharpeRatio: string;
}

// ── feature-flag metadata ─────────────────────────────────────
const FEATURES = [
  { key: 'cvar_qaoa',       label: 'CVaR',  desc: 'Conditional Value-at-Risk objective',         color: PURPLE },
  { key: 'xy_mixer',        label: 'XY',    desc: 'Cardinality-preserving XY mixer',             color: '#0ea5e9' },
  { key: 'esg_constraints', label: 'ESG',   desc: 'Environmental, Social & Governance filters',  color: '#22c55e' },
  { key: 'mip_baseline',    label: 'MIP',   desc: 'Classical Mixed-Integer baseline',            color: '#f59e0b' },
  { key: 'zne_local',       label: 'ZNE',   desc: 'Zero-Noise Extrapolation (local)',            color: '#ec4899' },
] as const;

export default function PortfolioEngin({ onBack }: Props) {
  const [algorithm, setAlgorithm] = useState<Algorithm>('vqe');
  const [backend,   setBackend]   = useState<Backend>('local_simulator');
  const [ansatz,    setAnsatz]    = useState<Ansatz>('real_amplitudes');
  const [running,   setRunning]   = useState(false);
  const [result,    setResult]    = useState<RunResult | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  // Portfolio lives under Lab Daydream — pulse to Forge under that enginId
  const forge = useForgeActivity({ enginId: 'lab' });

  async function handleRun() {
    setRunning(true);
    setResult(null);
    setError(null);
    forge.record('Started optimization run');
    try {
      const res = await fetch('/api/ai/idari', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'PORTFOLIO_OPTIMIZE',
          payload: { algorithm, backend, ansatz },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.error ?? body?.message ?? `Server error ${res.status}`;
        throw new Error(msg);
      }
      const data = await res.json();
      const runResult: RunResult = {
        algorithm:      data.algorithm      ?? algorithm,
        backend:        data.backend        ?? backend,
        objectiveValue: data.objectiveValue ?? '—',
        expectedReturn: data.expectedReturn ?? '—',
        portfolioRisk:  data.portfolioRisk  ?? '—',
        sharpeRatio:    data.sharpeRatio    ?? '—',
      };
      setResult(runResult);

      // Record the completed optimization as a Forge transfer (lab → lab)
      forge.record('Optimization run completed');
      recordForgeTransfer('lab', 'lab', 'optimization', 'Portfolio optimization complete', {
        algorithm: runResult.algorithm,
        backend: runResult.backend,
      });

      // Emit lab:result-ready so other Engins know results are available
      bridge.emit('lab', 'lab:result-ready', {
        experimentId: `portfolio-${Date.now()}`,
        resultType: 'portfolio-optimization',
        data: runResult,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Optimization failed');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="de-sky-bg min-h-screen">

      {/* ── Header ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full"
            style={{
              background: 'rgba(160,195,240,0.15)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Back to Optimizero"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </button>

          <div
            style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              background: `linear-gradient(135deg, ${ACCENT}, ${GOLD})`,
            }}
          />

          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1 }}>
              Optimizero
            </div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Quantum Optimizero · Control Layer</div>
          </div>

          <span
            className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}
          >
            Side B
          </span>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pb-32" style={{ paddingTop: 20 }}>

        {/* Algorithm picker */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Algorithm</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(['vqe', 'qaoa'] as Algorithm[]).map(alg => (
                <button
                  key={alg}
                  type="button"
                  onClick={() => setAlgorithm(alg)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 12,
                    border: `2px solid ${algorithm === alg ? ACCENT : 'rgba(160,195,240,0.3)'}`,
                    background: algorithm === alg ? `${ACCENT}12` : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: algorithm === alg ? ACCENT : 'var(--de-heading)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {alg}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 3 }}>
                    {alg === 'vqe' ? 'Variational Quantum Eigensolver' : 'Quantum Approx. Optimisation'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Backend picker */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Backend</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {([
                { value: 'local_simulator', label: 'Local', sub: 'Simulator' },
                { value: 'ibm_quantum',     label: 'IBM',   sub: 'Quantum Hardware' },
              ] as { value: Backend; label: string; sub: string }[]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBackend(opt.value)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 12,
                    border: `2px solid ${backend === opt.value ? GOLD : 'rgba(160,195,240,0.3)'}`,
                    background: backend === opt.value ? `${GOLD}10` : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: backend === opt.value ? GOLD : 'var(--de-heading)' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 3 }}>
                    {opt.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ansatz picker */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Ansatz</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {([
                { value: 'real_amplitudes', label: 'RealAmplitudes',  sub: 'Default, hardware-efficient' },
                { value: 'efficient_su2',   label: 'EfficientSU2',    sub: 'Wider expressibility' },
              ] as { value: Ansatz; label: string; sub: string }[]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAnsatz(opt.value)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 12,
                    border: `2px solid ${ansatz === opt.value ? PURPLE : 'rgba(160,195,240,0.3)'}`,
                    background: ansatz === opt.value ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'left' as const,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: ansatz === opt.value ? PURPLE : 'var(--de-heading)', letterSpacing: '0.02em' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 3 }}>
                    {opt.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active features */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Active Features</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FEATURES.map(f => (
                <div
                  key={f.key}
                  title={f.desc}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 999,
                    background: `${f.color}12`,
                    border: `1px solid ${f.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <ShieldCheck style={{ width: 11, height: 11, color: f.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: f.color }}>{f.label}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 10, lineHeight: 1.5 }}>
              Max 25 assets · QUBO formulation · Markowitz mean-variance objective
            </p>
          </div>
        </div>

        {/* Quantum circuit visualizer */}
        <div className="de-widget" style={{ marginBottom: 14, overflow: 'hidden' }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Quantum Circuit</span>
            {running && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}>
                Active
              </span>
            )}
          </div>
          <div style={{ padding: '0 0 4px' }}>
            <QuantumCircuitCanvas
              active={running}
              accentColor={ACCENT}
              secondaryColor={PURPLE}
              height={120}
            />
          </div>
        </div>

        {/* Run button */}
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="de-btn de-btn-gold"
          style={{ width: '100%', fontSize: 14, fontWeight: 800, padding: '14px 0', borderRadius: 14, marginBottom: 14, opacity: running ? 0.7 : 1,
            // Optimised touch: disable 300 ms delay on mobile tap
            touchAction: 'manipulation',
          }}
        >
          {running ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Cpu style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
              Running Optimization…
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <TrendingUp style={{ width: 16, height: 16 }} />
              Run Optimizero
            </span>
          )}
        </button>

        {/* Error state */}
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 12, marginBottom: 14,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          }}>
            <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Optimization Results</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${ACCENT}18`, color: ACCENT }}>
                {result.algorithm.toUpperCase()} · {result.backend.replace('_', ' ')}
              </span>
            </div>
            <div className="de-widget-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {[
                  { icon: TrendingUp,  label: 'Expected Return', value: result.expectedReturn,  unit: '%',  color: '#22c55e'  },
                  { icon: Activity,    label: 'Portfolio Risk',  value: result.portfolioRisk,   unit: '%',  color: '#f59e0b'  },
                  { icon: ShieldCheck, label: 'Sharpe Ratio',   value: result.sharpeRatio,     unit: '',   color: ACCENT     },
                  { icon: Cpu,         label: 'Objective',      value: result.objectiveValue,  unit: '',   color: PURPLE    },
                ].map(({ icon: Icon, label, value, unit, color }) => (
                  <div
                    key={label}
                    className="de-metric de-surface"
                    style={{ borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}
                  >
                    <Icon style={{ width: 16, height: 16, color, margin: '0 auto 6px' }} />
                    <div className="de-metric-value" style={{ fontSize: 20, fontWeight: 800, color: 'var(--de-heading)' }}>
                      {value}{unit}
                    </div>
                    <div className="de-metric-label" style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 2 }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Placeholder state (no result yet) */}
        {!result && !running && !error && (
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Last Results</span>
            </div>
            <div className="de-widget-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[['—', 'Return'], ['—', 'Risk'], ['—', 'Sharpe']].map(([val, lbl]) => (
                  <div key={lbl} className="de-metric de-surface" style={{ borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                    <span className="de-metric-value" style={{ fontSize: 18, fontWeight: 800, color: 'var(--de-heading)', display: 'block' }}>{val}</span>
                    <span className="de-metric-label" style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{lbl}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 10, lineHeight: 1.5 }}>
                Configure your algorithm and backend above, then tap <strong>Run Optimizero</strong> to see results here.
              </p>
            </div>
          </div>
        )}

        {/* ── Journey Trail ── */}
        <JourneyTrail compact />

      </div>
    </div>
  );
}
