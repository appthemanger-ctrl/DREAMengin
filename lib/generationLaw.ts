/**
 * Generation Law — ι-Engine
 *
 * Implements the GENERATION_LAW.md specification exactly.
 *
 * Formula:
 *   ι = ΔP × ( n·1 + a·λ + s·λ² + v·λ³ + xi·λ⁴ )
 *
 * where ΔP = 0.1, λ = 1.71
 *
 * Protocols:
 *   ι < 2.88         → FLOW      (throttle / skip)
 *   2.88 ≤ ι < 9.59  → SYNTHESIZE
 *   ι ≥ 9.59         → MANIFEST  (build immediately)
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const DELTA_P = 0.1;
export const LAMBDA   = 1.71;

/** Maximum theoretical ι: ΔP × (10·Σ λ^k, k=0..4) */
export const IOTA_MAX = DELTA_P * (10 * (1 + LAMBDA + LAMBDA ** 2 + LAMBDA ** 3 + LAMBDA ** 4));

/** Protocol thresholds (15 % and 50 % of IOTA_MAX ≈ 19.18) */
export const THRESHOLD_FLOW      = IOTA_MAX * 0.15;  // ≈ 2.88
export const THRESHOLD_SYNTHESIZE = IOTA_MAX * 0.50; // ≈ 9.59

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreativePass {
  /** Pass identifier / name */
  id: string;
  /** Description of what is being built */
  description: string;
  /** Novelty (0–10) */
  n: number;
  /** Autonomy (0–10) */
  a: number;
  /** Synthesis (0–10) */
  s: number;
  /** Vision alignment (0–10) */
  v: number;
  /** Chaos / weirdness (0–10) */
  xi: number;
}

export type Protocol = 'FLOW' | 'SYNTHESIZE' | 'MANIFEST';

export interface InventionResult {
  iota: number;
  protocol: Protocol;
  rawSum: number;
}

export interface ResidualClass {
  class: 'Architecture' | 'Naming' | 'Token' | 'Behavior' | 'Privacy' | 'Performance' | 'Projection';
  note: string;
  passId: string;
  timestamp: string;
}

export interface PrePassChecklist {
  passId: string;
  iotaComputed: boolean;
  protocolDetermined: boolean;
  iota: number;
  protocol: Protocol;
  approved: boolean;
  reason: string;
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * calculateInventionForce(pass)
 *
 * Computes ι for a creative pass using the weighted formula.
 */
export function calculateInventionForce(pass: CreativePass): InventionResult {
  const { n, a, s, v, xi } = pass;
  const rawSum =
    n  * 1           +
    a  * LAMBDA      +
    s  * LAMBDA ** 2 +
    v  * LAMBDA ** 3 +
    xi * LAMBDA ** 4;

  const iota = DELTA_P * rawSum;
  const protocol = getPassProtocol(iota);

  return { iota, protocol, rawSum };
}

/**
 * getPassProtocol(iota)
 *
 * Maps an ι value to its creative protocol.
 */
export function getPassProtocol(iota: number): Protocol {
  if (iota >= THRESHOLD_SYNTHESIZE) return 'MANIFEST';
  if (iota >= THRESHOLD_FLOW)       return 'SYNTHESIZE';
  return 'FLOW';
}

/**
 * runPrePassChecklist(pass)
 *
 * Validates a creative pass before execution.
 * MANIFEST passes are always approved.
 * FLOW passes are flagged but not blocked.
 */
export function runPrePassChecklist(pass: CreativePass): PrePassChecklist {
  const { iota, protocol } = calculateInventionForce(pass);

  let approved = true;
  let reason   = 'Pass approved.';

  if (protocol === 'FLOW') {
    reason = `Low ι (${iota.toFixed(3)}) — consider throttling or skipping.`;
    // Not blocked per law §4: residuals are observations, not obstacles
  }

  if (protocol === 'SYNTHESIZE') {
    reason = `Mid ι (${iota.toFixed(3)}) — synthesize freely.`;
  }

  if (protocol === 'MANIFEST') {
    reason = `High ι (${iota.toFixed(3)}) — MANIFEST: build immediately. No isolation. No permission.`;
  }

  return {
    passId: pass.id,
    iotaComputed: true,
    protocolDetermined: true,
    iota,
    protocol,
    approved,
    reason,
  };
}

// ─── Residual Logging ─────────────────────────────────────────────────────────

/** In-memory residual log. Non-blocking — per law §5. */
export const BUGS_LOG: ResidualClass[] = [];

/**
 * logResidual(residual)
 *
 * Records a residual observation.  Does NOT stop execution.
 */
export function logResidual(
  residual: Omit<ResidualClass, 'timestamp'>
): void {
  BUGS_LOG.push({
    ...residual,
    timestamp: new Date().toISOString(),
  });
}

/**
 * auditPostPass(passId)
 *
 * Returns all residuals recorded for a given pass.
 */
export function auditPostPass(passId: string): ResidualClass[] {
  return BUGS_LOG.filter((r) => r.passId === passId);
}

// ─── Doc Relationships ────────────────────────────────────────────────────────

export const DOC_RELATIONSHIPS: Record<string, string> = {
  'README.md':        'Naming and vision alignment.',
  'LAW.md':           'Naming reference.',
  'THEME.md':         'Token reference.',
  'SECURITY.md':      'Privacy reference.',
  'ARCHITECTURE.md':  'Layer map.',
  'ROADMAP.md':       'Vision scoring.',
  'BUGS.md':          'Residual memory (not a stop).',
  'FEATURE_STATUS.md':'Feature completeness.',
};
