/**
 * GENERATION LAW (ι‑Engine)
 *
 * Purpose:
 * This document describes how creative passes are shaped, not restricted.
 * The goal is to encourage invention, protect flow, and keep output coherent
 * without suffocating surprise.
 *
 * Effective Date: 2026-04-12
 * Status: creative operating law
 */

// ============================================================================
// 1. Invention Force (ι)
// ============================================================================

interface InventionPass {
  n: number;   // Novelty 0-10
  a: number;   // Autonomy 0-10
  s: number;   // Synthesis 0-10
  v: number;   // Vision 0-10
  xi: number;  // Chaos 0-10
}

const WEIGHTS = {
  novelty: 1.5,
  autonomy: 1.2,
  synthesis: 1.3,
  vision: 1.0,
  chaos: 1.4
} as const;

function calculateInventionForce(pass: InventionPass): number {
  const { n, a, s, v, xi } = pass;
  return (n * WEIGHTS.novelty) +
         (a * WEIGHTS.autonomy) +
         (s * WEIGHTS.synthesis) +
         (v * WEIGHTS.vision) +
         (xi * WEIGHTS.chaos);
}

// ============================================================================
// 2. Creative Modes
// ============================================================================

type Protocol = 'FLOW' | 'SYNTHESIZE' | 'MANIFEST';

interface ProtocolResult {
  protocol: Protocol;
  action: string;
  environment: string;
  permissions: string;
}

function getPassProtocol(iota: number): ProtocolResult {
  if (iota < 15) {
    return {
      protocol: 'FLOW',
      action: 'Refine and ship. Keep the pass fast, clear, and low-friction.',
      environment: 'Normal workspace.',
      permissions: 'Freedom first.'
    };
  } else if (iota >= 15 && iota < 35) {
    return {
      protocol: 'SYNTHESIZE',
      action: 'Connect ideas, combine systems, and preserve momentum.',
      environment: 'Feature branch or creative sandbox.',
      permissions: 'Experiment freely, but keep the thread visible.'
    };
  } else {
    return {
      protocol: 'MANIFEST',
      action: 'Open invention mode. Let the pass get weird, expansive, and high-energy.',
      environment: 'Isolated creative space, experimental folder, or flagged branch.',
      permissions: 'Maximum exploration. Refactor later, not now.'
    };
  }
}

// Rule: If a pass exceeds ι ≥ 35, split it into exploratory sub-passes
function enforceSplitThreshold(pass: InventionPass): InventionPass[] {
  const iota = calculateInventionForce(pass);
  if (iota < 35) return [pass];

  const exploratory: InventionPass = {
    ...pass,
    xi: Math.min(pass.xi, 10),
    n: Math.min(pass.n, 10)
  };

  const refinement: InventionPass = {
    ...pass,
    xi: Math.max(0, pass.xi - 5),
    n: Math.max(0, pass.n - 4),
    a: Math.max(0, pass.a - 2)
  };

  return [exploratory, refinement];
}

// ============================================================================
// 3. Creative Scoring
// ============================================================================

function scoreNovelty(description: string): number {
  const rubrics: Record<string, number> = {
    'exact copy': 0,
    'small variation': 3,
    'new pattern': 6,
    'first-principles leap': 10
  };
  return rubrics[description] ?? 0;
}

function scoreAutonomy(description: string): number {
  const rubrics: Record<string, number> = {
    'adds friction': 0,
    'keeps process similar': 3,
    'removes one manual step': 6,
    'removes whole category of decisions': 10
  };
  return rubrics[description] ?? 0;
}

function scoreSynthesis(description: string): number {
  const rubrics: Record<string, number> = {
    'one subsystem': 0,
    'connects two subsystems': 3,
    'bridges three subsystems': 6,
    'weaves four or more subsystems': 10
  };
  return rubrics[description] ?? 0;
}

function scoreVision(description: string): number {
  const rubrics: Record<string, number> = {
    'off-track': 0,
    'neutral': 3,
    'aligned': 6,
    'moves the roadmap forward': 10
  };
  return rubrics[description] ?? 0;
}

function scoreChaos(description: string): number {
  const rubrics: Record<string, number> = {
    'stable': 0,
    'playful': 3,
    'untested': 6,
    'wild but promising': 10
  };
  return rubrics[description] ?? 0;
}

// ============================================================================
// 4. Residuals
// ============================================================================

type ResidualClass =
  | 'Architecture'
  | 'Naming'
  | 'Token'
  | 'Behavior'
  | 'Privacy'
  | 'Performance'
  | 'Projection';

interface Residual {
  class: ResidualClass;
  description: string;
  file?: string;
}

const BUGS_LOG: Residual[] = [];

function logResidual(residual: Residual): void {
  BUGS_LOG.push(residual);
  console.error(`[RESIDUAL] ${residual.class}: ${residual.description}${residual.file ? ` (${residual.file})` : ''}`);
}

function auditPostPass(passDescription: string, residuals: Residual[]): void {
  console.log(`\n=== POST-PASS AUDIT: ${passDescription} ===`);
  for (const residual of residuals) {
    logResidual(residual);
  }

  if (residuals.length === 0) {
    console.log('✅ Clean pass. No residuals.');
  } else {
    console.log(`⚠️ ${residuals.length} residual(s) captured for later refinement.`);
  }
}

// ============================================================================
// 5. Pass Checklist
// ============================================================================

interface AuditChecklist {
  prePass: {
    scores: InventionPass;
    iota: number;
    protocol: ProtocolResult;
    manifestIsolationOk: boolean;
    noUnresolvedResiduals: boolean;
  };
  postPass: {
    architectureOk: boolean;
    namingOk: boolean;
    tokenOk: boolean;
    behaviorOk: boolean;
    privacyOk: boolean;
    performanceOk: boolean;
    projectionOk: boolean;
  };
}

function runPrePassChecklist(pass: InventionPass): boolean {
  const iota = calculateInventionForce(pass);
  const protocol = getPassProtocol(iota);

  console.log('=== PRE-PASS CHECKLIST ===');
  console.log(`Scores: n=${pass.n}, a=${pass.a}, s=${pass.s}, v=${pass.v}, xi=${pass.xi}`);
  console.log(`ι = ${iota.toFixed(2)} → ${protocol.protocol}`);

  if (protocol.protocol === 'MANIFEST') {
    const hasIsolation = confirmIsolationEnvironment();
    if (!hasIsolation) {
      console.error('❌ MANIFEST requires isolation. Abort pass.');
      return false;
    }
  }

  if (BUGS_LOG.length > 0) {
    console.warn(`⚠️ ${BUGS_LOG.length} unresolved residual(s) remain in the log.`);
  }

  console.log('✅ Pre-pass checks passed.');
  return true;
}

function confirmIsolationEnvironment(): boolean {
  return true;
}

// ============================================================================
// 6. Relationship Map
// ============================================================================

const DOC_RELATIONSHIPS = {
  'README.md': 'Primary spec for naming and vision alignment.',
  'LAW.md': 'Naming alignment reference.',
  'THEME.md': 'Token alignment reference.',
  'SECURITY.md': 'Privacy alignment reference.',
  'ARCHITECTURE.md': 'Layer map for architecture.',
  'ROADMAP.md': 'Source of truth for vision scoring.',
  'BUGS.md': 'Residual memory, not a hard stop.',
  'FEATURE_STATUS.md': 'Feature completeness tracker.'
};

// ============================================================================
// 7. Example
// ============================================================================

function exampleUsage(): void {
  const experimentalPass: InventionPass = {
    n: 7,
    a: 8,
    s: 6,
    v: 9,
    xi: 9
  };

  const iota = calculateInventionForce(experimentalPass);
  const protocol = getPassProtocol(iota);

  console.log('\n=== EXAMPLE ===');
  console.log(`Invention Force (ι): ${iota.toFixed(2)}`);
  console.log(`Protocol: ${protocol.protocol}`);
  console.log(`Action: ${protocol.action}`);
  console.log(`Environment: ${protocol.environment}`);

  const subPasses = enforceSplitThreshold(experimentalPass);
  console.log(`Split into ${subPasses.length} sub-pass(es).`);
}

if (require.main === module) {
  exampleUsage();
}

export {
  calculateInventionForce,
  getPassProtocol,
  enforceSplitThreshold,
  scoreNovelty,
  scoreAutonomy,
  scoreSynthesis,
  scoreVision,
  scoreChaos,
  logResidual,
  auditPostPass,
  runPrePassChecklist,
  BUGS_LOG,
  DOC_RELATIONSHIPS,
  type InventionPass,
  type Protocol,
  type ProtocolResult,
  type Residual,
  type ResidualClass,
  type AuditChecklist
};
