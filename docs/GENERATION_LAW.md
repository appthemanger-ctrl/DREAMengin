/**
 * GENERATION LAW (ι‑Engine)
 * 
 * Documentation Owner: José Mancilla (appthemanger-ctrl)
 * Effective Date: 2026-04-12
 * Status: binding AI build constraint – supersedes previous Generation Law (2026-04-06)
 * 
 * This file replaces README.md §27 and the old allowed‑output / χ framework.
 * Every generation pass is governed by the Invention Force metric ι.
 */

// ============================================================================
// 1. Invention Force (ι)
// ============================================================================

interface InventionPass {
  n: number;  // Novelty 0-10
  a: number;  // Autonomy 0-10
  s: number;  // Synthesis 0-10
  v: number;  // Vision 0-10
  xi: number; // Entropy 0-10
}

const WEIGHTS = {
  novelty: 1.5,
  autonomy: 1.2,
  synthesis: 1.3,
  vision: 1.0,
  entropy: 1.5
} as const;

function calculateInventionForce(pass: InventionPass): number {
  const { n, a, s, v, xi } = pass;
  return (n * WEIGHTS.novelty) +
         (a * WEIGHTS.autonomy) +
         (s * WEIGHTS.synthesis) +
         (v * WEIGHTS.vision) +
         (xi * WEIGHTS.entropy);
}

// ============================================================================
// 2. Protocol Thresholds
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
      action: 'Standard refinement. Low‑risk execution.',
      environment: 'Direct commit to main branch allowed.',
      permissions: 'No isolation required.'
    };
  } else if (iota >= 15 && iota < 35) {
    return {
      protocol: 'SYNTHESIZE',
      action: 'Integration phase. Wiring systems while managing experimental friction.',
      environment: 'Must run in a feature branch.',
      permissions: 'All changes require a review residual log.'
    };
  } else {
    return {
      protocol: 'MANIFEST',
      action: 'UNSTABLE INVENTION. The pass is dominated by chaos and novelty.',
      environment: 'Isolated environment required (experiments/ folder, feature flag, or separate branch).',
      permissions: 'Must not affect production paths until ι is reduced via refactor passes.'
    };
  }
}

// Rule: If a planned pass would exceed ι ≥ 35, split it into sub‑passes
function enforceSplitThreshold(pass: InventionPass): InventionPass[] {
  const iota = calculateInventionForce(pass);
  if (iota < 35) return [pass];
  
  // Split into two sub-passes: one with reduced entropy/novelty, one isolated
  const highEntropyPart: InventionPass = { ...pass, xi: Math.min(pass.xi, 10), n: Math.min(pass.n, 8) };
  const lowEntropyPart: InventionPass = { ...pass, xi: 0, n: Math.min(pass.n, 3) };
  return [highEntropyPart, lowEntropyPart];
}

// ============================================================================
// 3. Computing Dimension Scores (Rubrics)
// ============================================================================

// 3.1 Novelty (n)
function scoreNovelty(description: string): number {
  const rubrics: Record<string, number> = {
    'exact copy': 0,
    'minor adaptation': 3,
    'new algorithm or state machine': 6,
    'first-principles': 10
  };
  // Usage: manually match
  return rubrics[description] ?? 0;
}

// 3.2 Autonomy (a)
function scoreAutonomy(description: string): number {
  const rubrics: Record<string, number> = {
    'adds manual step': 0,
    'keeps friction identical': 3,
    'automates one manual step': 6,
    'removes entire class of decisions': 10
  };
  return rubrics[description] ?? 0;
}

// 3.3 Synthesis (s)
function scoreSynthesis(description: string): number {
  const rubrics: Record<string, number> = {
    'one file/subsystem': 0,
    'connects two subsystems': 3,
    'bridge between three subsystems': 6,
    'weaves ≥4 subsystems': 10
  };
  return rubrics[description] ?? 0;
}

// 3.4 Vision (v)
function scoreVision(description: string): number {
  const rubrics: Record<string, number> = {
    'contradicts roadmap': 0,
    'neutral': 3,
    'aligns with milestone': 6,
    'completes milestone': 10
  };
  return rubrics[description] ?? 0;
}

// 3.5 Entropy (xi)
function scoreEntropy(description: string): number {
  const rubrics: Record<string, number> = {
    'fully deterministic': 0,
    'experimental library with fallback': 3,
    'new untested pattern': 6,
    'what-if logic breaks assumptions': 10
  };
  return rubrics[description] ?? 0;
}

// ============================================================================
// 4. Residual Classes
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

// Log residual to BUGS.md (simulated here)
const BUGS_LOG: Residual[] = [];

function logResidual(residual: Residual): void {
  BUGS_LOG.push(residual);
  console.error(`[RESIDUAL] ${residual.class}: ${residual.description}${residual.file ? ` (${residual.file})` : ''}`);
}

// Post-pass audit function
function auditPostPass(passDescription: string, residuals: Residual[]): void {
  console.log(`\n=== POST-PASS AUDIT: ${passDescription} ===`);
  for (const residual of residuals) {
    logResidual(residual);
  }
  if (residuals.length === 0) {
    console.log('✅ No residuals found.');
  } else {
    console.log(`⚠️ ${residuals.length} residual(s) logged. Must fix in a FLOW pass before next SYNTHESIZE/MANIFEST.`);
  }
}

// ============================================================================
// 5. Per-Pass Audit Checklist
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
    const hasIsolation = confirmIsolationEnvironment(); // user must confirm
    if (!hasIsolation) {
      console.error('❌ MANIFEST requires isolated environment. Abort pass.');
      return false;
    }
  }
  
  if (BUGS_LOG.length > 0) {
    console.error(`❌ Unresolved residuals in BUGS.md (${BUGS_LOG.length}). Fix them in a FLOW pass first.`);
    return false;
  }
  
  console.log('✅ Pre-pass checks passed.');
  return true;
}

function confirmIsolationEnvironment(): boolean {
  // In practice, this checks for experiments/ folder, feature flag, or separate branch
  return true; // placeholder – user must verify
}

// ============================================================================
// 6. Relationship to Other Docs (metadata)
// ============================================================================

const DOC_RELATIONSHIPS = {
  'README.md': 'Primary spec – used for naming & vision alignment.',
  'LAW.md': 'Naming residuals are caught against it.',
  'THEME.md': 'Token residuals are caught against it.',
  'SECURITY.md': 'Privacy residuals are caught against it.',
  'ARCHITECTURE.md': 'Layer definitions for architecture residuals.',
  'ROADMAP.md': 'Source of truth for vision (v) scoring.',
  'BUGS.md': 'Residual log. All unresolved residuals live here.',
  'FEATURE_STATUS.md': 'Tracks feature completeness (no longer used for output formula).'
};

// ============================================================================
// 7. Example
// ============================================================================

function exampleUsage(): void {
  // A pass that introduces a new AI‑driven content summarizer
  const experimentalPass: InventionPass = {
    n: 7,  // novel algorithm
    a: 8,  // removes manual tagging
    s: 6,  // wires AI + DB + UI
    v: 9,  // aligns with Q3 roadmap
    xi: 9  // experimental transformer model
  };
  
  const iota = calculateInventionForce(experimentalPass);
  const protocol = getPassProtocol(iota);
  
  console.log('\n=== EXAMPLE ===');
  console.log(`Invention Force (ι): ${iota.toFixed(2)}`); // 50.4
  console.log(`Protocol: ${protocol.protocol}`);
  console.log(`Action: ${protocol.action}`);
  console.log(`Environment: ${protocol.environment}`);
  
  // Split because ι >= 35
  const subPasses = enforceSplitThreshold(experimentalPass);
  console.log(`Split into ${subPasses.length} sub-pass(es). High-entropy part goes into experiments/ folder.`);
}

// Run example if this file is executed directly
if (require.main === module) {
  exampleUsage();
}

// Export public API for use in other modules
export {
  calculateInventionForce,
  getPassProtocol,
  enforceSplitThreshold,
  scoreNovelty,
  scoreAutonomy,
  scoreSynthesis,
  scoreVision,
  scoreEntropy,
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
