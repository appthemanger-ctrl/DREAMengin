// components/dreamengin/engine/math.ts
// Deterministic math helpers for DREAMengin's toroidal navigation + "quantum" yaw.

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

// Positive modulo wrap for JavaScript (handles negative values)
export function wrap(v: number, size: number): number {
  const r = v % size;
  return r < 0 ? r + size : r;
}

// Unit-complex yaw representation q = (cosθ, sinθ).
export type UnitComplex = Float32Array; // [re, im]

export function unitComplexFromAngle(thetaRad: number, out: UnitComplex): UnitComplex {
  out[0] = Math.cos(thetaRad);
  out[1] = Math.sin(thetaRad);
  return out;
}

// q <- q * e^{i dTheta}
export function unitComplexRotate(q: UnitComplex, dThetaRad: number): void {
  const c = Math.cos(dThetaRad);
  const s = Math.sin(dThetaRad);
  const re = q[0];
  const im = q[1];
  // (re + i im) * (c + i s)
  q[0] = re * c - im * s;
  q[1] = re * s + im * c;

  // Renormalize (very cheap) to keep |q|=1 under FP drift.
  const n = Math.hypot(q[0], q[1]) || 1;
  q[0] /= n;
  q[1] /= n;
}
