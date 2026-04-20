'use client';

/**
 * OptimizePanel — Algorithm configuration + quantum run for the Portfolio Engine.
 *
 * Full Markowitz / QUBO optimization runner with algorithm, backend, and ansatz
 * pickers. Lives at /engines/portfolio/optimize.
 */

import { useState } from 'react';
import { TrendingUp, Activity, ShieldCheck, Cpu, Loader2 } from 'lucide-react';
import QuantumCircuitCanvas, {
  type QuantumMeasurementResult,
} from '@/engins/dream.QuantumCircuitCanvas';

type Algorithm = 'vqe' | 'qaoa';
type Backend   = 'local_simulator' | 'ibm_quantum';
type Ansatz    = 'real_amplitudes' | 'efficient_su2';

interface RunResult {
  algorithm:      string;
  backend:        string;
  objectiveValue: string;
  expectedReturn: string;
  portfolioRisk:  string;
  sharpeRatio:    string;
}

const ACCENT = '#2a8ab8';
const GOLD   = '#c8981a';
const PURPLE = '#8b5cf6';

const FEATURES = [
  { key: 'cvar_qaoa',       label: 'CVaR',  desc: 'Conditional Value-at-Risk objective',        color: PURPLE     },
  { key: 'xy_mixer',        label: 'XY',    desc: 'Cardinality-preserving XY mixer',            color: '#0ea5e9'  },
  { key: 'esg_constraints', label: 'ESG',   desc: 'Environmental, Social & Governance filters', color: '#22c55e'  },
  { key: 'mip_baseline',    label: 'MIP',   desc: 'Classical Mixed-Integer baseline',           color: '#f59e0b'  },
  { key: 'zne_local',       label: 'ZNE',   desc: 'Zero-Noise Extrapolation (local)',           color: '#ec4899'  },
] as const;

export default function OptimizePanel() {
  const [algorithm, setAlgorithm] = useState<Algorithm>('vqe');
  const [backend,   setBackend]   = useState<Backend>('local_simulator');
  const [ansatz,    setAnsatz]    = useState<Ansatz>('real_amplitudes');
  const [running,       setRunning]       = useState(false);
  const [result,        setResult]        = useState<RunResult | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const [quantumResult, setQuantumResult] = useState<QuantumMeasurementResult | null>(null);

  async function handleRun() {
    setRunning(true);
    setResult(null);
    setError(null);
    setQuantumResult(null);
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
        throw new Error(body?.error ?? body?.message ?? `Server error ${res.status}`);
      }
      const data = await res.json();
      setResult({
        algorithm:      data.algorithm      ?? algorithm,
        backend:        data.backend        ?? backend,
        objectiveValue: data.objectiveValue ?? '—',
        expectedReturn: data.expectedReturn ?? '—',
        portfolioRisk:  data.portfolioRisk  ?? '—',
        sharpeRatio:    data.sharpeRatio    ?? '—',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Optimization failed');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Optimize</h1>
          <p className="text-sm text-white/50">Configure algorithm · run Markowitz / QUBO optimization</p>
        </div>

        {/* Algorithm */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] text-xs font-semibold text-white/40 uppercase tracking-wider">
            Algorithm
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {(['vqe', 'qaoa'] as Algorithm[]).map((alg) => (
              <button
                key={alg}
                onClick={() => setAlgorithm(alg)}
                className="rounded-xl p-3 text-left transition-all"
                style={{
                  border:     `2px solid ${algorithm === alg ? ACCENT : 'rgba(255,255,255,0.1)'}`,
                  background: algorithm === alg ? `${ACCENT}12` : 'rgba(255,255,255,0.03)',
                }}
              >
                <div className="text-sm font-bold uppercase" style={{ color: algorithm === alg ? ACCENT : 'white' }}>
                  {alg}
                </div>
                <div className="text-[10px] text-white/40 mt-1">
                  {alg === 'vqe' ? 'Variational Quantum Eigensolver' : 'Quantum Approx. Optimisation'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Backend */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] text-xs font-semibold text-white/40 uppercase tracking-wider">
            Backend
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {([
              { value: 'local_simulator', label: 'Local',    sub: 'Simulator' },
              { value: 'ibm_quantum',     label: 'IBM',      sub: 'Quantum Hardware' },
            ] as { value: Backend; label: string; sub: string }[]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setBackend(opt.value)}
                className="rounded-xl p-3 text-left transition-all"
                style={{
                  border:     `2px solid ${backend === opt.value ? GOLD : 'rgba(255,255,255,0.1)'}`,
                  background: backend === opt.value ? `${GOLD}10` : 'rgba(255,255,255,0.03)',
                }}
              >
                <div className="text-sm font-bold" style={{ color: backend === opt.value ? GOLD : 'white' }}>
                  {opt.label}
                </div>
                <div className="text-[10px] text-white/40 mt-1">{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Ansatz */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] text-xs font-semibold text-white/40 uppercase tracking-wider">
            Ansatz
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {([
              { value: 'real_amplitudes', label: 'RealAmplitudes', sub: 'Default, hardware-efficient' },
              { value: 'efficient_su2',   label: 'EfficientSU2',   sub: 'Wider expressibility' },
            ] as { value: Ansatz; label: string; sub: string }[]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAnsatz(opt.value)}
                className="rounded-xl p-3 text-left transition-all"
                style={{
                  border:     `2px solid ${ansatz === opt.value ? PURPLE : 'rgba(255,255,255,0.1)'}`,
                  background: ansatz === opt.value ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)',
                }}
              >
                <div className="text-xs font-bold" style={{ color: ansatz === opt.value ? PURPLE : 'white' }}>
                  {opt.label}
                </div>
                <div className="text-[10px] text-white/40 mt-1">{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Active features */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] mb-4 p-4">
          <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Active Features</div>
          <div className="flex flex-wrap gap-2">
            {FEATURES.map((f) => (
              <div
                key={f.key}
                title={f.desc}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: `${f.color}12`, border: `1px solid ${f.color}30` }}
              >
                <ShieldCheck style={{ width: 10, height: 10, color: f.color }} />
                <span className="text-[11px] font-bold" style={{ color: f.color }}>{f.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-white/30 mt-3 leading-relaxed">
            Max 25 assets · QUBO formulation · Markowitz mean-variance objective
          </p>
        </div>

        {/* Quantum circuit preview */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Quantum Circuit</span>
            {running && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}>
                Simulating
              </span>
            )}
          </div>
          <div className="pb-1">
            <QuantumCircuitCanvas
              active={running}
              accentColor={ACCENT}
              secondaryColor={PURPLE}
              height={120}
              numQubits={3}
              algorithm={algorithm}
              ansatz={ansatz}
              onMeasure={setQuantumResult}
            />
          </div>
        </div>

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={running}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all mb-4"
          style={{
            background: running ? `${GOLD}60` : GOLD,
            color: '#0a0a0f',
            opacity: running ? 0.8 : 1,
          }}
        >
          {running
            ? <><Loader2 size={16} className="animate-spin" /> Running Optimization…</>
            : <><TrendingUp size={16} /> Run Optimizero</>
          }
        </button>

        {/* Error */}
        {error && (
          <div className="rounded-xl p-4 mb-4 bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Results</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${ACCENT}18`, color: ACCENT }}>
                {result.algorithm.toUpperCase()} · {result.backend.replace('_', ' ')}
              </span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {[
                { icon: TrendingUp,  label: 'Expected Return', value: result.expectedReturn, unit: '%', color: '#22c55e' },
                { icon: Activity,    label: 'Portfolio Risk',  value: result.portfolioRisk,  unit: '%', color: '#f59e0b' },
                { icon: ShieldCheck, label: 'Sharpe Ratio',   value: result.sharpeRatio,    unit: '',  color: ACCENT    },
                { icon: Cpu,         label: 'Objective',      value: result.objectiveValue, unit: '',  color: PURPLE    },
              ].map(({ icon: Icon, label, value, unit, color }) => (
                <div key={label} className="flex flex-col items-center p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <Icon style={{ width: 16, height: 16, color, marginBottom: 6 }} />
                  <span className="text-xl font-black text-white">{value}{unit}</span>
                  <span className="text-[10px] text-white/30 mt-1">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quantum result detail */}
        {quantumResult && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden mt-4">
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Quantum Selection</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${PURPLE}15`, color: PURPLE, border: `1px solid ${PURPLE}30` }}>
                ⟨C⟩ = {quantumResult.expectationValue.toFixed(4)}
              </span>
            </div>
            <div className="p-4">
              <div className="flex gap-2 mb-3">
                {quantumResult.selectedAssets.map((selected, i) => (
                  <div
                    key={i}
                    className="flex-1 py-2 rounded-lg text-center transition-all"
                    style={{
                      background: selected ? `${ACCENT}10` : 'transparent',
                      border:     `1px solid ${selected ? ACCENT + '55' : 'rgba(255,255,255,0.06)'}`,
                      opacity:    selected ? 1 : 0.4,
                    }}
                  >
                    <div className="text-[9px] mb-1" style={{ color: ACCENT + 'aa' }}>Asset {i}</div>
                    <div className="text-xs font-black" style={{ color: selected ? ACCENT : '#475569' }}>
                      {selected ? '◉ IN' : '○ OUT'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {quantumResult.probabilities.map((p, i) =>
                  p > 0.02 ? (
                    <span
                      key={i}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        border:     `1px solid ${PURPLE}30`,
                        background: `${PURPLE}08`,
                        color:      i === quantumResult.probabilities.reduce((b, v, j) => (v > quantumResult.probabilities[b] ? j : b), 0)
                          ? ACCENT
                          : `${PURPLE}aa`,
                      }}
                    >
                      {i.toString(2).padStart(3, '0')} {(p * 100).toFixed(1)}%
                    </span>
                  ) : null
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
