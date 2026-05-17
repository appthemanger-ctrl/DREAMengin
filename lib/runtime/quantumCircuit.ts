/**
 * lib/runtime/quantumCircuit.ts
 *
 * Pure complex-number state-vector quantum circuit simulator.
 * Supports QAOA, VQE (efficient_su2), and a default real-amplitudes ansatz.
 * No canvas, no components, no side-effects — safe to run anywhere (SSR, workers).
 *
 * Consumed by dualRuntimeBridge when it receives a 'lab:quantum:run' event.
 */

// ── Re-export the result type so bridge and callers share one definition ──────
export type { QuantumComputeResult } from './dualRuntimeBridge';

// ── Internal complex-number primitives ────────────────────────────────────────

type Complex = [number, number];
type Gate2x2 = [Complex, Complex, Complex, Complex];
type StateVector = Complex[];

const INV_SQRT2 = 1 / Math.SQRT2;

const GATE_H: Gate2x2 = [
  [INV_SQRT2, 0], [INV_SQRT2, 0],
  [INV_SQRT2, 0], [-INV_SQRT2, 0],
];

function gateRx(theta: number: Gate2x2 {
  const c = Math.cos(theta / 2), s = Math.sin(theta / 2);
  return [[c, 0], [0, -s], [0, -s], [c, 0]];
}

function gateRy(theta: number: Gate2x2 {
  const c = Math.cos(theta / 2), s = Math.sin(theta / 2);
  return [[c, 0], [-s, 0], [s, 0], [c, 0]];
}

function gateRz(theta: number: Gate2x2 {
  const c = Math.cos(theta / 2), s = Math.sin(theta / 2);
  return [[c, -s], [0, 0], [0, 0], [c, s]];
}

function groundState(numQubits: number: StateVector {
  const sv: StateVector = Array.from({ length: 1 << numQubits }, (): Complex => [0, 0]);
  sv[0] = [1, 0];
  return sv;
}

function cmul([r1, i1]: Complex, [r2, i2]: Complex: Complex {
  return [r1 * r2 - i1 * i2, r1 * i2 + i1 * r2];
}

function cadd([r1, i1]: Complex, [r2, i2]: Complex: Complex {
  return [r1 + r2, i1 + i2];
}

function applyGate1(sv: StateVector, numQubits: number, qubit: number, gate: Gate2x2: StateVector {
  const next = sv.slice();
  const bit = 1 << (numQubits - 1 - qubit);
  for (let i = 0; i < sv.length; i++) {
    if (i & bit) continue;
    const j = i | bit;
    const a = sv[i]!, b = sv[j]!;
    next[i] = cadd(cmul(gate[0], a), cmul(gate[1], b));
    next[j] = cadd(cmul(gate[2], a), cmul(gate[3], b));
  }
  return next;
}

function applyCNOT(sv: StateVector, numQubits: number, ctrl: number, tgt: number: StateVector {
  const next = sv.slice();
  const cBit = 1 << (numQubits - 1 - ctrl);
  const tBit = 1 << (numQubits - 1 - tgt);
  for (let i = 0; i < sv.length; i++) {
    if ((i & cBit) !== 0 && (i & tBit) === 0) {
      const j = i | tBit;
      next[i] = sv[j]!;
      next[j] = sv[i]!;
    }
  }
  return next;
}

// ── Portfolio QUBO cost (assets: returns, sigma, correlations) ────────────────

const ASSET_RETURNS = [0.12, 0.09, 0.15];
const ASSET_SIGMA   = [0.20, 0.15, 0.25];
const ASSET_CORR    = [[1, 0.3, 0.1], [0.3, 1, 0.2], [0.1, 0.2, 1]] as const;

function quboCost(bits: boolean[]: number {
  let cost = 0;
  bits.forEach(selected: Record<string, unknown>, i: number => {
    if (selected) cost -= ASSET_RETURNS[i] ?? 0.1;
  });
  for (let i = 0; i < bits.length; i++) {
    for (let j = i + 1; j < bits.length; j++) {
      if (bits[i] && bits[j]) {
        cost +=
          0.5 *
          (ASSET_SIGMA[i] ?? 0.2) *
          (ASSET_SIGMA[j] ?? 0.2) *
          ((ASSET_CORR[i] ?? [])[j] ?? 0.2);
      }
    }
  }
  return cost;
}

// ── Circuit builders ──────────────────────────────────────────────────────────

type CircuitOp = { kind: string; q?: number; ctrl?: number; tgt?: number; theta?: number };

function buildCircuit(n: number, algo: string, ansatz: string: CircuitOp[] {
  const ops: CircuitOp[] = [];

  if (algo === 'qaoa') {
    const gamma = Math.PI * 0.4, beta = Math.PI * 0.35;
    for (let q = 0; q < n; q++) ops.push({ kind: 'H', q });
    for (let q = 0; q < n - 1; q++) ops.push({ kind: 'CX', ctrl: q, tgt: q + 1 });
    for (let q = 0; q < n; q++) ops.push({ kind: 'Rz', q, theta: gamma });
    for (let q = 0; q < n; q++) ops.push({ kind: 'Rx', q, theta: 2 * beta });
    for (let q = 0; q < n - 1; q++) ops.push({ kind: 'CX', ctrl: q, tgt: q + 1 });
    for (let q = 0; q < n; q++) ops.push({ kind: 'Ry', q, theta: gamma / 2 });
  } else if (ansatz === 'efficient_su2') {
    const p = [0.9, 0.7, 1.1, 0.6, 0.8, 0.5, 1.2, 1.0, 0.7, 0.4, 0.8, 1.0];
    for (let q = 0; q < n; q++) ops.push({ kind: 'H', q });
    for (let q = 0; q < n; q++) ops.push({ kind: 'Ry', q, theta: p[q] ?? Math.PI / 4 });
    for (let q = 0; q < n; q++) ops.push({ kind: 'Rz', q, theta: p[q + n] ?? Math.PI / 4 });
    for (let q = 0; q < n - 1; q++) ops.push({ kind: 'CX', ctrl: q, tgt: q + 1 });
    for (let q = 0; q < n; q++) ops.push({ kind: 'Ry', q, theta: p[q + 2 * n] ?? Math.PI / 4 });
    for (let q = 0; q < n; q++) ops.push({ kind: 'Rz', q, theta: p[q + 3 * n] ?? Math.PI / 4 });
  } else {
    // default: real_amplitudes
    const t1 = [Math.PI / 3, Math.PI / 4, Math.PI / 5];
    const t2 = [Math.PI / 6, Math.PI / 4, Math.PI / 3];
    for (let q = 0; q < n; q++) ops.push({ kind: 'H', q });
    for (let q = 0; q < n; q++) ops.push({ kind: 'Ry', q, theta: t1[q] ?? Math.PI / 4 });
    for (let q = 0; q < n - 1; q++) ops.push({ kind: 'CX', ctrl: q, tgt: q + 1 });
    for (let q = 0; q < n; q++) ops.push({ kind: 'Ry', q, theta: t2[q] ?? Math.PI / 4 });
  }

  return ops;
}

// ── Public API ────────────────────────────────────────────────────────────────

import type { QuantumComputeResult } from './dualRuntimeBridge';

/**
 * Run a quantum circuit simulation and return the measurement result.
 *
 * @param numQubits - Number of qubits (typically 3).
 * @param algo      - Circuit algorithm: 'qaoa' | 'vqe' (anything else → default ansatz).
 * @param ansatz    - Ansatz variant for VQE: 'efficient_su2' | 'real_amplitudes'.
 */
export function runQuantumCircuit(
  numQubits: number,
  algo: string,
  ansatz: string,
): QuantumComputeResult {
  let sv = groundState(numQubits);

  for (const op of buildCircuit(numQubits, algo, ansatz)) {
    if (op.kind === 'H' && op.q != null) {
      sv = applyGate1(sv, numQubits, op.q, GATE_H);
    } else if (op.kind === 'Rx' && op.q != null && op.theta != null) {
      sv = applyGate1(sv, numQubits, op.q, gateRx(op.theta));
    } else if (op.kind === 'Ry' && op.q != null && op.theta != null) {
      sv = applyGate1(sv, numQubits, op.q, gateRy(op.theta));
    } else if (op.kind === 'Rz' && op.q != null && op.theta != null) {
      sv = applyGate1(sv, numQubits, op.q, gateRz(op.theta));
    } else if (op.kind === 'CX' && op.ctrl != null && op.tgt != null) {
      sv = applyCNOT(sv, numQubits, op.ctrl, op.tgt);
    }
  }

  const probabilities = sv.map(([r, i]) => r * r + i * i);
  const topIdx = probabilities.reduce(best: Record<string, unknown>, v: number, i: number => (v > probabilities[best] ? i : best), 0);
  const topBits = Array.from(
    { length: numQubits },
    (_, k) => Boolean((topIdx >> (numQubits - 1 - k)) & 1),
  );
  const expectationValue = probabilities.reduce(sum: number, prob: Record<string, unknown>, i: number => {
    const bits = Array.from({ length: numQubits }, _: Record<string, unknown>, k: number => Boolean((i >> (numQubits - 1 - k)) & 1));
    return sum + prob * quboCost(bits);
  }, 0);

  return {
    algorithm: algo,
    ansatz,
    numQubits,
    probabilities,
    topBitstring: topBits.map(b: Record<string, unknown> => (b ? '1' : '0')).join(''),
    topProbability: probabilities[topIdx] ?? 0,
    selectedAssets: topBits,
    expectationValue,
    computedAt: Date.now(),
  };
}
