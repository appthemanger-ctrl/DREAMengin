'use client';

/**
 * PortfolioEngin — Side B control layer for the Optimizero Daydream.
 *
 * Quantum circuit runs are dispatched directly to the dualRuntimeBridge
 * (bridge.emit 'lab:quantum:run') which computes the state-vector simulation
 * inline and emits 'lab:quantum:result'.  Results are auto-ingested by
 * dreamOSBus.  No canvas, no separate visualizer.
 *
 * Architecture: docs/ARCHITECTURE.md §1 (Daydream pair system)
 * Privacy:      all runs are owner-scoped (no public exposure)
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Activity, ShieldCheck, Cpu } from 'lucide-react';
import { useForgeActivity } from '@/lib/forge/useForgeActivity';
import { recordForgeTransfer } from '@/lib/forge/forgeIntelligence';
import { bridge, type QuantumComputeResult } from '@/lib/runtime/dualRuntimeBridge';
import JourneyTrail from '@/components/daydream/JourneyTrail';

interface Props {
  onBack: () => void;
}

const ACCENT = '#2a8ab8';
const GOLD   = '#c8981a';
const PURPLE = '#8b5cf6';

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

const FEATURES = [
  { key: 'cvar_qaoa',       label: 'CVaR', desc: 'Conditional Value-at-Risk objective',        color: PURPLE     },
  { key: 'xy_mixer',        label: 'XY',   desc: 'Cardinality-preserving XY mixer',            color: '#0ea5e9'  },
  { key: 'esg_constraints', label: 'ESG',  desc: 'Environmental, Social & Governance filters', color: '#22c55e'  },
  { key: 'mip_baseline',    label: 'MIP',  desc: 'Classical Mixed-Integer baseline',           color: '#f59e0b'  },
  { key: 'zne_local',       label: 'ZNE',  desc: 'Zero-Noise Extrapolation (local)',           color: '#ec4899'  },
] as const;

const ASSET_LABELS = ['Asset A', 'Asset B', 'Asset C'];

export default function PortfolioEngin({ onBack }: Props) {
  const [algorithm, setAlgorithm] = useState<Algorithm>('vqe');
  const [backend,   setBackend]   = useState<Backend>('local_simulator');
  const [ansatz,    setAnsatz]    = useState<Ansatz>('real_amplitudes');
  const [running,   setRunning]   = useState(false);
  const [result,    setResult]    = useState<RunResult | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [qResult,   setQResult]   = useState<QuantumComputeResult | null>(null);

  const forge = useForgeActivity({ enginId: 'lab' });

  // Subscribe to quantum results emitted by the bridge compute engine
  useEffect(() => {
    return bridge.subscribe('lab', 'quantum:result', (payload) => {
      setQResult(payload as unknown as QuantumComputeResult);
    });
  }, []);

  async function handleRun() {
    setRunning(true);
    setResult(null);
    setError(null);
    setQResult(null);
    forge.record('Started optimization run');

    // Trigger quantum circuit computation in the bridge — synchronous JS math,
    // result is emitted as 'lab:quantum:result' and picked up by the useEffect above.
    bridge.emit('lab', 'quantum:run', { algorithm, ansatz, numQubits: 3 });

    try {
      const res = await fetch('/api/ai/idari', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'PORTFOLIO_OPTIMIZE', payload: { algorithm, backend, ansatz } }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? body?.message ?? `Server error ${res.status}`);
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
      forge.record('Optimization run completed');
      recordForgeTransfer('lab', 'lab', 'optimization', 'Portfolio optimization complete', {
        algorithm: runResult.algorithm, backend: runResult.backend,
      });
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

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button type="button" onClick={onBack} className="p-2 -ml-2 rounded-full"
            style={{ background: 'rgba(160,195,240,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Back to Optimizero">
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </button>
          <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: `linear-gradient(135deg, ${ACCENT}, ${GOLD})` }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1 }}>Optimizero</div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Quantum Optimizero · Control Layer</div>
          </div>
          <span className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}>Side B</span>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pb-32" style={{ paddingTop: 20 }}>

        {/* Algorithm picker */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header"><span className="de-widget-title">Algorithm</span></div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(['vqe', 'qaoa'] as Algorithm[]).map(alg => (
                <button key={alg} type="button" onClick={() => setAlgorithm(alg)} style={{
                  padding: '12px 10px', borderRadius: 12,
                  border: `2px solid ${algorithm === alg ? ACCENT : 'rgba(160,195,240,0.3)'}`,
                  background: algorithm === alg ? `${ACCENT}12` : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: algorithm === alg ? ACCENT : 'var(--de-heading)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{alg}</div>
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
          <div className="de-widget-header"><span className="de-widget-title">Backend</span></div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {([
                { value: 'local_simulator', label: 'Local', sub: 'Simulator' },
                { value: 'ibm_quantum',     label: 'IBM',   sub: 'Quantum Hardware' },
              ] as { value: Backend; label: string; sub: string }[]).map(opt => (
                <button key={opt.value} type="button" onClick={() => setBackend(opt.value)} style={{
                  padding: '12px 10px', borderRadius: 12,
                  border: `2px solid ${backend === opt.value ? GOLD : 'rgba(160,195,240,0.3)'}`,
                  background: backend === opt.value ? `${GOLD}10` : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: backend === opt.value ? GOLD : 'var(--de-heading)' }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 3 }}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ansatz picker */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header"><span className="de-widget-title">Ansatz</span></div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {([
                { value: 'real_amplitudes', label: 'RealAmplitudes',  sub: 'Default, hardware-efficient' },
                { value: 'efficient_su2',   label: 'EfficientSU2',    sub: 'Wider expressibility' },
              ] as { value: Ansatz; label: string; sub: string }[]).map(opt => (
                <button key={opt.value} type="button" onClick={() => setAnsatz(opt.value)} style={{
                  padding: '12px 10px', borderRadius: 12,
                  border: `2px solid ${ansatz === opt.value ? PURPLE : 'rgba(160,195,240,0.3)'}`,
                  background: ansatz === opt.value ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' as const,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: ansatz === opt.value ? PURPLE : 'var(--de-heading)', letterSpacing: '0.02em' }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 3 }}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active features */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header"><span className="de-widget-title">Active Features</span></div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FEATURES.map(f => (
                <div key={f.key} title={f.desc} style={{
                  padding: '5px 10px', borderRadius: 999,
                  background: `${f.color}12`, border: `1px solid ${f.color}30`,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
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

        {/* Run button */}
        <button type="button" onClick={handleRun} disabled={running}
          className="de-btn de-btn-gold"
          style={{ width: '100%', fontSize: 14, fontWeight: 800, padding: '14px 0', borderRadius: 14, marginBottom: 14, opacity: running ? 0.7 : 1, touchAction: 'manipulation' }}>
          {running ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Cpu style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />Running Optimization…
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <TrendingUp style={{ width: 16, height: 16 }} />Run Optimizero
            </span>
          )}
        </button>

        {/* Error state */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 12, marginBottom: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Quantum circuit result — real computed state vector output from bridge */}
        {qResult && (
          <div className="de-widget" style={{ marginBottom: 14 }}>
            <div className="de-widget-header">
              <span className="de-widget-title">Quantum Circuit Output</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${PURPLE}18`, color: PURPLE, border: `1px solid ${PURPLE}35` }}>
                {qResult.algorithm.toUpperCase()} · {qResult.numQubits}q
              </span>
            </div>
            <div className="de-widget-body">
              {/* Top measurement outcome */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                <div className="de-metric de-surface" style={{ borderRadius: 10, padding: '10px 14px', flex: '1 1 auto', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: PURPLE, fontFamily: 'monospace' }}>{qResult.topBitstring}</div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 2 }}>Top bitstring</div>
                </div>
                <div className="de-metric de-surface" style={{ borderRadius: 10, padding: '10px 14px', flex: '1 1 auto', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: ACCENT }}>{(qResult.topProbability * 100).toFixed(1)}%</div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 2 }}>Measurement prob.</div>
                </div>
                <div className="de-metric de-surface" style={{ borderRadius: 10, padding: '10px 14px', flex: '1 1 auto', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: GOLD }}>{qResult.expectationValue.toFixed(4)}</div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 2 }}>⟨ψ|C|ψ⟩ cost</div>
                </div>
              </div>
              {/* Selected assets */}
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 6 }}>Selected portfolio:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {qResult.selectedAssets.map((selected, i) => (
                  <span key={i} style={{
                    padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                    background: selected ? `${ACCENT}18` : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${selected ? ACCENT : 'rgba(0,0,0,0.08)'}`,
                    color: selected ? ACCENT : 'var(--de-text-dim)',
                  }}>
                    {ASSET_LABELS[i] ?? `q${i}`}
                  </span>
                ))}
              </div>
              {/* Probability distribution bar chart — text only, no canvas */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginBottom: 6 }}>Measurement distribution:</div>
                {qResult.probabilities.map((p, i) => {
                  const label = i.toString(2).padStart(qResult.numQubits, '0');
                  const pct   = (p * 100).toFixed(1);
                  const isTop = i === qResult.probabilities.reduce((b, v, j) => (v > qResult.probabilities[b] ? j : b), 0);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 10, fontFamily: 'monospace', color: isTop ? PURPLE : 'var(--de-text-dim)', minWidth: 28 }}>|{label}⟩</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <div style={{ width: `${p * 100}%`, height: '100%', borderRadius: 3, background: isTop ? PURPLE : `${ACCENT}66`, transition: 'width 0.4s ease' }} />
                      </div>
                      <span style={{ fontSize: 10, color: isTop ? PURPLE : 'var(--de-text-dim)', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Server optimization results */}
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
                  { icon: TrendingUp,  label: 'Expected Return', value: result.expectedReturn,  unit: '%', color: '#22c55e' },
                  { icon: Activity,    label: 'Portfolio Risk',  value: result.portfolioRisk,   unit: '%', color: '#f59e0b' },
                  { icon: ShieldCheck, label: 'Sharpe Ratio',   value: result.sharpeRatio,     unit: '',  color: ACCENT   },
                  { icon: Cpu,         label: 'Objective',      value: result.objectiveValue,  unit: '',  color: PURPLE   },
                ].map(({ icon: Icon, label, value, unit, color }) => (
                  <div key={label} className="de-metric de-surface"
                    style={{ borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                    <Icon style={{ width: 16, height: 16, color, margin: '0 auto 6px' }} />
                    <div className="de-metric-value" style={{ fontSize: 20, fontWeight: 800, color: 'var(--de-heading)' }}>{value}{unit}</div>
                    <div className="de-metric-label" style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Placeholder state */}
        {!result && !running && !error && !qResult && (
          <div className="de-widget">
            <div className="de-widget-header"><span className="de-widget-title">Last Results</span></div>
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
                Configure your algorithm and backend above, then tap <strong>Run Optimizero</strong>.
              </p>
            </div>
          </div>
        )}

        <JourneyTrail compact />

      </div>
    </div>
  );
}
