'use client';

/**
 * PortfolioQuantumPanel — Quantum circuit designer tuned for portfolio optimization.
 *
 * Gate canvas with QAOA / VQE context. Simulates asset-selection bitstrings.
 * Lives at /engines/portfolio/quantum.
 */

import { useState, useCallback } from 'react';
import { Zap, RotateCcw, Play, Info } from 'lucide-react';

const ACCENT = '#2a8ab8';
const PURPLE = '#8b5cf6';

type GateType = 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'RZ' | 'RX' | 'M';

interface Gate {
  id:    string;
  type:  GateType;
  qubit: number;
  col:   number;
}

interface GateDef {
  type:        GateType;
  label:       string;
  color:       string;
  description: string;
}

const GATE_DEFS: GateDef[] = [
  { type: 'H',    label: 'H',  color: ACCENT,    description: 'Hadamard — equal superposition (asset in/out)' },
  { type: 'RZ',   label: 'Rz', color: PURPLE,    description: 'Rz rotation — cost layer (QAOA phase)' },
  { type: 'RX',   label: 'Rx', color: '#a855f7', description: 'Rx rotation — mixer layer (QAOA diffusion)' },
  { type: 'CNOT', label: '⊕',  color: '#c8981a', description: 'CNOT — entangle asset correlations' },
  { type: 'X',    label: 'X',  color: '#ef4444', description: 'Pauli-X — flip asset selection' },
  { type: 'Z',    label: 'Z',  color: '#10b981', description: 'Pauli-Z — phase kickback' },
  { type: 'Y',    label: 'Y',  color: '#f59e0b', description: 'Pauli-Y — bit + phase flip' },
  { type: 'M',    label: '⊗',  color: '#64748b', description: 'Measure — collapse to asset bitstring' },
];

const QUBITS = 4; // 4 qubits → 4 assets
const COLS   = 8;

function gateDef(type: GateType ){
  return GATE_DEFS.find((g) => g.type === type)!;
}

function simulate(gates: Gate[]): { bitstring: string; interpretation: string } {
  const bits: string[] = [];
  const lines: string[] = [];

  for (let q = 0; q < QUBITS; q++) {
    const qGates = gates.filter((g) => g.qubit === q).sort((a, b) => a.col - b.col);
    const hasMeasure = qGates.some((g) => g.type === 'M');
    if (!hasMeasure) {
      bits.push('?');
      lines.push(`|q${q}⟩ = unmeasured (no M gate)`);
      continue;
    }
    const hasH  = qGates.some((g) => g.type === 'H');
    const hasRz  = qGates.some((g) => g.type === 'RZ');
    const hasX  = qGates.some((g) => g.type === 'X');
    let bit: string;
    if (hasH || hasRz) {
      bit = Math.random() > 0.5 ? '1' : '0';
      lines.push(`|q${q}⟩ → |${bit}⟩  (quantum superposition collapsed)`);
    } else {
      bit = hasX ? '1' : '0';
      lines.push(`|q${q}⟩ → |${bit}⟩  (deterministic)`);
    }
    bits.push(bit);
  }

  const bitstring = bits.join('');
  const selected = bits.reduce<number[]>((acc: number[], b: string, i: number) => (b === '1' ? [...acc, i] : acc), []);
  const interpretation =
    selected.length === 0
      ? 'No assets selected by quantum measurement'
      : `Assets selected: ${selected.map((i: number ) => `Asset ${i}`).join(', ')}`;

  return { bitstring, interpretation: `${interpretation}\n\n${lines.join('\n')}` };
}

export default function PortfolioQuantumPanel( ){
  const [gates,        setGates]        = useState<Gate[]>([]);
  const [selectedGate, setSelectedGate] = useState<GateType>('H');
  const [result,       setResult]       = useState<{ bitstring: string; interpretation: string } | null>(null);

  const placeGate = useCallback((qubit: number, col: number) => {
    setGates((prev) => {
      const filtered = prev.filter((g) => !(g.qubit === qubit && g.col === col));
      return [...filtered, { id: `${qubit}-${col}-${Date.now()}`, type: selectedGate, qubit, col }];
    });
    setResult(null);
  }, [selectedGate]);

  const removeGate = useCallback((id: string) => {
    setGates((prev) => prev.filter((g) => g.id !== id));
    setResult(null);
  }, []);

  function clear( ){ setGates([]); setResult(null); }
  function measure( ){ setResult(simulate(gates)); }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-white mb-1">Quantum Circuit</h1>
          <p className="text-sm text-white/50">
            4 qubits = 4 assets · design QAOA / VQE circuit · measure asset-selection bitstring
          </p>
        </div>

        {/* Gate palette */}
        <div className="flex flex-wrap gap-2 mb-5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
          <span className="text-xs text-white/30 self-center mr-1">Gate:</span>
          {GATE_DEFS.map((gd) => (
            <button
              key={gd.type}
              onClick={() => setSelectedGate(gd.type)}
              title={gd.description}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={
                selectedGate === gd.type
                  ? { background: `${gd.color}33`, color: gd.color, border: `1.5px solid ${gd.color}` }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1.5px solid rgba(255,255,255,0.08)' }
              }
            >
              <span
                className="w-5 h-5 rounded flex items-center justify-center font-bold text-[11px]"
                style={{ background: `${gd.color}22`, color: gd.color }}
              >
                {gd.label}
              </span>
              {gd.type}
            </button>
          ))}
        </div>

        {/* Qubit labels */}
        <div className="flex gap-2 mb-2 px-1">
          {Array.from({ length: QUBITS }, (_, q: number) => (
            <div
              key={q}
              className="flex items-center gap-1 text-[10px] font-mono"
              style={{ color: ACCENT + '99' }}
            >
              |q{q}⟩ = Asset {q}
            </div>
          ))}
        </div>

        {/* Circuit grid */}
        <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30 mb-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-20 py-2 text-[10px] text-white/20 font-normal">Qubit</th>
                  {Array.from({ length: COLS }, (_, i: number ) => (
                    <th key={i} className="w-12 py-2 text-[10px] text-white/20 font-normal">{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: QUBITS }, (_, q: number) => (
                  <tr key={q} className="border-t border-white/[0.04]">
                    <td className="py-2 px-3 text-xs font-mono" style={{ color: ACCENT + 'aa' }}>
                      |q{q}⟩
                    </td>
                    {Array.from({ length: COLS }, (_, col: number ) => {
                      const gate = gates.find((g) => g.qubit === q && g.col === col);
                      const def  = gate ? gateDef(gate.type) : null;
                      return (
                        <td
                          key={col}
                          className="relative p-1 text-center"
                          style={{ cursor: gate ? 'pointer' : 'crosshair' }}
                          onClick={() => gate ? removeGate(gate.id) : placeGate(q, col)}
                          title={gate ? `${gate.type} — click to remove` : `Place ${selectedGate}`}
                        >
                          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.07] -translate-y-1/2 pointer-events-none" />
                          {gate && def && (
                            <span
                              className="relative z-10 inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold"
                              style={{ background: `${def.color}33`, color: def.color, border: `1.5px solid ${def.color}` }}
                            >
                              {def.label}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/25 mb-5">
          <Info size={12} />
          Click a cell to place the selected gate · click a gate to remove it
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={measure}
            disabled={gates.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-40"
            style={{ background: ACCENT, color: '#0a0a0f' }}
          >
            <Play size={14} />
            Simulate
          </button>
          <button
            onClick={clear}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-colors"
          >
            <RotateCcw size={14} />
            Clear
          </button>
        </div>

        {/* Measurement output */}
        {result && (
          <div className="mt-5 rounded-xl border p-4" style={{ background: `${ACCENT}08`, borderColor: `${ACCENT}30` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={13} style={{ color: ACCENT }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: ACCENT }}>
                  Measurement
                </span>
              </div>
              <span
                className="text-sm font-black font-mono px-3 py-1 rounded-lg"
                style={{ background: `${PURPLE}20`, color: PURPLE, border: `1px solid ${PURPLE}40` }}
              >
                |{result.bitstring}⟩
              </span>
            </div>
            <pre className="text-xs font-mono text-white/60 whitespace-pre-wrap leading-relaxed">
              {result.interpretation}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
