'use client';

/**
 * QuantumPanel — Quantum circuit designer for the Lab Engine app.
 *
 * Drag-and-drop gate canvas with live measurement simulation.
 * Lives at /engines/lab/quantum.
 */

import { useState, useCallback } from 'react';
import { Zap, RotateCcw, Play, Info } from 'lucide-react';

type GateType = 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'T' | 'S' | 'M';

interface Gate {
  id: string;
  type: GateType;
  qubit: number;
  col: number;
}

interface GateDef {
  type: GateType;
  label: string;
  color: string;
  description: string;
}

const GATE_DEFS: GateDef[] = [
  { type: 'H',    label: 'H',     color: '#6366f1', description: 'Hadamard — superposition' },
  { type: 'X',    label: 'X',     color: '#ef4444', description: 'Pauli-X — NOT gate' },
  { type: 'Y',    label: 'Y',     color: '#f59e0b', description: 'Pauli-Y — bit+phase flip' },
  { type: 'Z',    label: 'Z',     color: '#10b981', description: 'Pauli-Z — phase flip' },
  { type: 'T',    label: 'T',     color: '#a855f7', description: 'T gate — π/8 rotation' },
  { type: 'S',    label: 'S',     color: '#0891b2', description: 'S gate — π/4 rotation' },
  { type: 'CNOT', label: '⊕',     color: '#c8981a', description: 'CNOT — controlled NOT' },
  { type: 'M',    label: '⊗',     color: '#64748b', description: 'Measure qubit' },
];

const QUBITS = 4;
const COLS = 8;

function gateDef(type: GateType) {
  return GATE_DEFS.find((g) => g.type === type)!;
}

function simulateMeasurements(gates: Gate[]): string {
  const results: string[] = [];
  for (let q = 0; q < QUBITS; q++) {
    const qubitGates = gates.filter((g) => g.qubit === q).sort((a, b) => a.col - b.col);
    let hasH = qubitGates.some((g) => g.type === 'H');
    let hasMeasure = qubitGates.some((g) => g.type === 'M');
    if (!hasMeasure) { results.push(`|q${q}⟩ = |0⟩ (not measured)`); continue; }
    if (hasH) {
      results.push(`|q${q}⟩ → ${Math.random() > 0.5 ? '|0⟩' : '|1⟩'} (50/50 superposition collapsed)`);
    } else {
      const hasX = qubitGates.some((g) => g.type === 'X');
      results.push(`|q${q}⟩ → ${hasX ? '|1⟩' : '|0⟩'} (deterministic)`);
    }
  }
  return results.join('\n');
}

export default function QuantumPanel() {
  const [gates, setGates] = useState<Gate[]>([]);
  const [selectedGate, setSelectedGate] = useState<GateType>('H');
  const [result, setResult] = useState<string | null>(null);

  const placeGate = useCallback((qubit: number, col: number) => {
    setGates((prev) => {
      // Replace existing gate at same position
      const filtered = prev.filter((g) => !(g.qubit === qubit && g.col === col));
      return [...filtered, { id: `${qubit}-${col}-${Date.now()}`, type: selectedGate, qubit, col }];
    });
    setResult(null);
  }, [selectedGate]);

  const removeGate = useCallback((id: string) => {
    setGates((prev) => prev.filter((g) => g.id !== id));
    setResult(null);
  }, []);

  function clear() {
    setGates([]);
    setResult(null);
  }

  function measure() {
    setResult(simulateMeasurements(gates));
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-white mb-1">Quantum Circuit</h1>
          <p className="text-sm text-white/50">Design circuits · simulate measurements</p>
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

        {/* Circuit grid */}
        <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30 mb-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-16 py-2 text-[10px] text-white/20 font-normal">Qubit</th>
                  {Array.from({ length: COLS }, (_, i) => (
                    <th key={i} className="w-12 py-2 text-[10px] text-white/20 font-normal">{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: QUBITS }, (_, q) => (
                  <tr key={q} className="border-t border-white/[0.04]">
                    <td className="py-2 px-3 text-xs text-white/40 font-mono">|q{q}⟩</td>
                    {Array.from({ length: COLS }, (_, col) => {
                      const gate = gates.find((g) => g.qubit === q && g.col === col);
                      const def = gate ? gateDef(gate.type) : null;
                      return (
                        <td
                          key={col}
                          className="relative p-1 text-center"
                          style={{ cursor: gate ? 'pointer' : 'crosshair' }}
                          onClick={() => gate ? removeGate(gate.id) : placeGate(q, col)}
                          title={gate ? `${gate.type} — click to remove` : `Place ${selectedGate} gate`}
                        >
                          {/* Wire */}
                          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 -translate-y-1/2 pointer-events-none" />
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

        <div className="flex items-center gap-2 text-xs text-white/30 mb-5">
          <Info size={12} />
          Click a cell to place the selected gate · click a gate to remove it
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={measure}
            disabled={gates.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#10b981] hover:bg-[#059669] text-black text-sm font-bold transition-colors disabled:opacity-40"
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
          <div className="mt-5 rounded-xl bg-black/40 border border-[#10b981]/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={13} className="text-[#10b981]" />
              <span className="text-xs font-semibold text-[#10b981] uppercase tracking-wider">Measurement Results</span>
            </div>
            <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
