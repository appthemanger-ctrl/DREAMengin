/**
 * tests/feature-build.test.ts
 *
 * Unit tests for lib/feature-build — the feature build progression system.
 *
 * Coverage:
 *   1. featureManifest   — all 6 manifests load, domains/engins are canonical, maxFeatures consistent
 *   2. buildCycle        — getBuildPhase, calculateProgress, computeBuildCycleState, countUsableFeatures,
 *                          allPairsInRefinePhase, allPairsMovingForward
 *   3. uiQualityCriteria — SICC_GLOBAL_CRITERIA structure, dimension filtering, SICC_DIMENSIONS
 */

import { describe, it, expect } from 'vitest';

import {
  FEATURE_MANIFESTS,
  getManifest,
  type DaydreamEnginManifest,
} from '@/lib/feature-build/featureManifest';

import {
  getBuildPhase,
  calculateProgress,
  countFeaturesByStatus,
  countUsableFeatures,
  computeBuildCycleState,
  computeAllBuildCycleStates,
  allPairsInRefinePhase,
  allPairsMovingForward,
} from '@/lib/feature-build/buildCycle';

import {
  SICC_GLOBAL_CRITERIA,
  SICC_DIMENSIONS,
  getCriteriaForDimension,
} from '@/lib/feature-build/uiQualityCriteria';

import {
  DAYDREAM_DOMAINS,
  ENGIN_SURFACES,
} from '@/lib/identity/canonical-names';

const VALID_DAYDREAM_DOMAINS = Object.values(DAYDREAM_DOMAINS);
const VALID_ENGIN_SURFACES   = Object.values(ENGIN_SURFACES);

// ─── 1. featureManifest ───────────────────────────────────────────────────────

describe('FEATURE_MANIFESTS', () => {
  it('contains exactly 6 manifests (one per canonical Daydream+Engin pair)', () => {
    expect(FEATURE_MANIFESTS).toHaveLength(6);
  });

  it('every manifest domain is a valid DaydreamDomain', () => {
    for (const m of FEATURE_MANIFESTS) {
      expect(VALID_DAYDREAM_DOMAINS).toContain(m.domain);
    }
  });

  it('every manifest engin is a valid EnginSurface', () => {
    for (const m of FEATURE_MANIFESTS) {
      expect(VALID_ENGIN_SURFACES).toContain(m.engin);
    }
  });

  it('all domain values are unique', () => {
    const domains = FEATURE_MANIFESTS.map((m) => m.domain);
    expect(new Set(domains).size).toBe(domains.length);
  });

  it('all engin values are unique', () => {
    const engins = FEATURE_MANIFESTS.map((m) => m.engin);
    expect(new Set(engins).size).toBe(engins.length);
  });

  it('maxFeatures equals features.length for every manifest', () => {
    for (const m of FEATURE_MANIFESTS) {
      expect(m.features).toHaveLength(m.maxFeatures);
    }
  });

  it('every feature id is unique within its manifest', () => {
    for (const m of FEATURE_MANIFESTS) {
      const ids = m.features.map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('every feature has a non-empty label and description', () => {
    for (const m of FEATURE_MANIFESTS) {
      for (const f of m.features) {
        expect(f.label.trim().length).toBeGreaterThan(0);
        expect(f.description.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('every feature status is implemented, active, or planned', () => {
    for (const m of FEATURE_MANIFESTS) {
      for (const f of m.features) {
        expect(['implemented', 'active', 'planned']).toContain(f.status);
      }
    }
  });

  it('at least one feature is implemented per manifest (pairs have existing work)', () => {
    for (const m of FEATURE_MANIFESTS) {
      const count = m.features.filter((f) => f.status === 'implemented').length;
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  it('accentColor is a valid hex colour string', () => {
    for (const m of FEATURE_MANIFESTS) {
      expect(m.accentColor).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('uiRefinements is a non-empty array of strings', () => {
    for (const m of FEATURE_MANIFESTS) {
      expect(m.uiRefinements.length).toBeGreaterThan(0);
      for (const r of m.uiRefinements) {
        expect(typeof r).toBe('string');
        expect(r.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('refineThreshold is a number between 0 and 1 for every manifest', () => {
    for (const m of FEATURE_MANIFESTS) {
      expect(typeof m.refineThreshold).toBe('number');
      expect(m.refineThreshold).toBeGreaterThan(0);
      expect(m.refineThreshold).toBeLessThanOrEqual(1);
    }
  });

  it('implemented + active + planned equals maxFeatures for every manifest', () => {
    for (const m of FEATURE_MANIFESTS) {
      const impl   = countFeaturesByStatus(m, 'implemented');
      const active = countFeaturesByStatus(m, 'active');
      const plan   = countFeaturesByStatus(m, 'planned');
      expect(impl + active + plan).toBe(m.maxFeatures);
    }
  });
});

describe('getManifest()', () => {
  it('returns the correct manifest for each valid domain', () => {
    for (const m of FEATURE_MANIFESTS) {
      const found = getManifest(m.domain);
      expect(found.domain).toBe(m.domain);
    }
  });

  it('throws for an unknown domain', () => {
    expect(() => getManifest('Unknown' as never)).toThrow();
  });
});

// ─── 2. buildCycle ────────────────────────────────────────────────────────────

describe('getBuildPhase()', () => {
  // getBuildPhase(featuresUsable, featuresImplemented, maxFeatures, refineThreshold)

  it('returns BUILD when usable fraction is below refineThreshold', () => {
    // 4 usable / 10 max = 40% < 60% threshold
    expect(getBuildPhase(4, 4, 10, 0.6)).toBe('BUILD');
    expect(getBuildPhase(0, 0, 10, 0.6)).toBe('BUILD');
  });

  it('returns UPGRADE when usable fraction meets threshold but not all implemented', () => {
    // 6 usable (4 implemented + 2 active) / 10 max = 60% ≥ 60% threshold, not fully implemented
    expect(getBuildPhase(6, 4, 10, 0.6)).toBe('UPGRADE');
    // 8 usable / 10 = 80% ≥ 60%, 8 implemented < 10 max
    expect(getBuildPhase(8, 8, 10, 0.6)).toBe('UPGRADE');
  });

  it('returns UPGRADE at exactly the refineThreshold', () => {
    // 6 / 10 = 0.6 exactly
    expect(getBuildPhase(6, 5, 10, 0.6)).toBe('UPGRADE');
  });

  it('returns REFINE when all features are implemented regardless of threshold', () => {
    expect(getBuildPhase(10, 10, 10, 0.6)).toBe('REFINE');
    expect(getBuildPhase(10, 10, 10, 0.3)).toBe('REFINE');
  });

  it('returns REFINE when featuresImplemented > maxFeatures', () => {
    expect(getBuildPhase(11, 11, 10, 0.6)).toBe('REFINE');
  });

  it('returns REFINE when both are 0 (empty manifest edge case)', () => {
    expect(getBuildPhase(0, 0, 0, 0.6)).toBe('REFINE');
  });

  it('a higher threshold keeps pair in BUILD longer', () => {
    // 7 usable / 10 = 70% — passes 60% but not 80%
    expect(getBuildPhase(7, 5, 10, 0.6)).toBe('UPGRADE');
    expect(getBuildPhase(7, 5, 10, 0.8)).toBe('BUILD');
  });
});

describe('calculateProgress()', () => {
  it('returns 0 for 0 implemented out of any max', () => {
    expect(calculateProgress(0, 10)).toBe(0);
  });

  it('returns 50 for half implemented', () => {
    expect(calculateProgress(5, 10)).toBe(50);
  });

  it('returns 100 when fully implemented', () => {
    expect(calculateProgress(10, 10)).toBe(100);
  });

  it('clamps at 100 even when implemented exceeds max', () => {
    expect(calculateProgress(12, 10)).toBe(100);
  });

  it('returns 0 when maxFeatures is 0', () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });

  it('rounds to nearest integer', () => {
    // 1/3 ≈ 33.33 → 33
    expect(calculateProgress(1, 3)).toBe(33);
  });
});

describe('countFeaturesByStatus()', () => {
  it('counts implemented features correctly', () => {
    const manifest = getManifest('Music');
    const implemented = manifest.features.filter((f) => f.status === 'implemented').length;
    expect(countFeaturesByStatus(manifest, 'implemented')).toBe(implemented);
  });

  it('counts planned features correctly', () => {
    const manifest = getManifest('Music');
    const planned = manifest.features.filter((f) => f.status === 'planned').length;
    expect(countFeaturesByStatus(manifest, 'planned')).toBe(planned);
  });

  it('counts active features correctly', () => {
    const manifest = getManifest('Music');
    const active = manifest.features.filter((f) => f.status === 'active').length;
    expect(countFeaturesByStatus(manifest, 'active')).toBe(active);
  });

  it('implemented + active + planned equals maxFeatures', () => {
    for (const m of FEATURE_MANIFESTS) {
      const impl   = countFeaturesByStatus(m, 'implemented');
      const active = countFeaturesByStatus(m, 'active');
      const plan   = countFeaturesByStatus(m, 'planned');
      expect(impl + active + plan).toBe(m.maxFeatures);
    }
  });
});

describe('countUsableFeatures()', () => {
  it('returns implemented + active for every manifest', () => {
    for (const m of FEATURE_MANIFESTS) {
      const impl   = countFeaturesByStatus(m, 'implemented');
      const active = countFeaturesByStatus(m, 'active');
      expect(countUsableFeatures(m)).toBe(impl + active);
    }
  });

  it('usable count is always >= implemented count', () => {
    for (const m of FEATURE_MANIFESTS) {
      const impl = countFeaturesByStatus(m, 'implemented');
      expect(countUsableFeatures(m)).toBeGreaterThanOrEqual(impl);
    }
  });

  it('usable count is always <= maxFeatures', () => {
    for (const m of FEATURE_MANIFESTS) {
      expect(countUsableFeatures(m)).toBeLessThanOrEqual(m.maxFeatures);
    }
  });
});

describe('computeBuildCycleState()', () => {
  it('returns a valid BuildCycleState for every manifest', () => {
    for (const m of FEATURE_MANIFESTS) {
      const state = computeBuildCycleState(m);
      expect(state.domain).toBe(m.domain);
      expect(state.engin).toBe(m.engin);
      expect(['BUILD', 'UPGRADE', 'REFINE']).toContain(state.phase);
      expect(state.featuresImplemented + state.featuresActive + state.featurePlanned).toBe(m.maxFeatures);
      expect(state.progressPct).toBeGreaterThanOrEqual(0);
      expect(state.progressPct).toBeLessThanOrEqual(100);
      expect(state.usablePct).toBeGreaterThanOrEqual(0);
      expect(state.usablePct).toBeLessThanOrEqual(100);
    }
  });

  it('usablePct is always >= progressPct (active features add forward motion)', () => {
    for (const m of FEATURE_MANIFESTS) {
      const state = computeBuildCycleState(m);
      expect(state.usablePct).toBeGreaterThanOrEqual(state.progressPct);
    }
  });

  it('phase is UPGRADE or REFINE for manifests that meet their refineThreshold', () => {
    for (const m of FEATURE_MANIFESTS) {
      const usable = countUsableFeatures(m);
      const meetsThreshold = usable / m.maxFeatures >= m.refineThreshold;
      const state = computeBuildCycleState(m);
      if (meetsThreshold) {
        expect(['UPGRADE', 'REFINE']).toContain(state.phase);
      }
    }
  });

  it('featuresActive reflects the active feature count from the manifest', () => {
    for (const m of FEATURE_MANIFESTS) {
      const state  = computeBuildCycleState(m);
      const active = m.features.filter((f) => f.status === 'active').length;
      expect(state.featuresActive).toBe(active);
    }
  });
});

describe('computeAllBuildCycleStates()', () => {
  it('returns one state per manifest', () => {
    const states = computeAllBuildCycleStates(FEATURE_MANIFESTS);
    expect(states).toHaveLength(FEATURE_MANIFESTS.length);
  });

  it('each state domain matches the source manifest domain', () => {
    const states = computeAllBuildCycleStates(FEATURE_MANIFESTS);
    states.forEach((s, i) => {
      expect(s.domain).toBe(FEATURE_MANIFESTS[i].domain);
    });
  });
});

describe('allPairsInRefinePhase()', () => {
  it('returns false when any pair is not in REFINE phase', () => {
    const states = computeAllBuildCycleStates(FEATURE_MANIFESTS);
    const anyNonRefine = states.some((s) => s.phase !== 'REFINE');
    if (anyNonRefine) {
      expect(allPairsInRefinePhase(states)).toBe(false);
    }
  });

  it('returns true when all states are REFINE', () => {
    const allRefine = FEATURE_MANIFESTS.map((m) => ({
      domain:               m.domain,
      engin:                m.engin,
      phase:                'REFINE' as const,
      featuresImplemented:  m.maxFeatures,
      featuresActive:       0,
      featurePlanned:       0,
      maxFeatures:          m.maxFeatures,
      progressPct:          100,
      usablePct:            100,
    }));
    expect(allPairsInRefinePhase(allRefine)).toBe(true);
  });

  it('returns false for an empty array', () => {
    expect(allPairsInRefinePhase([])).toBe(false);
  });
});

describe('allPairsMovingForward()', () => {
  it('returns true when all pairs are in UPGRADE or REFINE phase', () => {
    const forwardStates = FEATURE_MANIFESTS.map((m) => ({
      domain:               m.domain,
      engin:                m.engin,
      phase:                'UPGRADE' as const,
      featuresImplemented:  Math.ceil(m.maxFeatures * 0.6),
      featuresActive:       0,
      featurePlanned:       Math.floor(m.maxFeatures * 0.4),
      maxFeatures:          m.maxFeatures,
      progressPct:          60,
      usablePct:            60,
    }));
    expect(allPairsMovingForward(forwardStates)).toBe(true);
  });

  it('returns true when all pairs are in REFINE phase', () => {
    const allRefine = FEATURE_MANIFESTS.map((m) => ({
      domain:               m.domain,
      engin:                m.engin,
      phase:                'REFINE' as const,
      featuresImplemented:  m.maxFeatures,
      featuresActive:       0,
      featurePlanned:       0,
      maxFeatures:          m.maxFeatures,
      progressPct:          100,
      usablePct:            100,
    }));
    expect(allPairsMovingForward(allRefine)).toBe(true);
  });

  it('returns false when any pair is still in BUILD phase', () => {
    const states = computeAllBuildCycleStates(FEATURE_MANIFESTS);
    const anyBuild = states.some((s) => s.phase === 'BUILD');
    if (anyBuild) {
      expect(allPairsMovingForward(states)).toBe(false);
    }
  });

  it('returns false for an empty array', () => {
    expect(allPairsMovingForward([])).toBe(false);
  });
});

// ─── 3. uiQualityCriteria ─────────────────────────────────────────────────────

describe('SICC_GLOBAL_CRITERIA', () => {
  it('contains at least one criterion per SICC dimension', () => {
    const dims = ['stylized', 'intuitive', 'cohesive', 'coherent'] as const;
    for (const dim of dims) {
      const count = SICC_GLOBAL_CRITERIA.filter((c) => c.dimension === dim).length;
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  it('every criterion has a unique id', () => {
    const ids = SICC_GLOBAL_CRITERIA.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every criterion has a non-empty label and description', () => {
    for (const c of SICC_GLOBAL_CRITERIA) {
      expect(c.label.trim().length).toBeGreaterThan(0);
      expect(c.description.trim().length).toBeGreaterThan(0);
    }
  });

  it('every dimension is one of the four SICC values', () => {
    const valid = ['stylized', 'intuitive', 'cohesive', 'coherent'];
    for (const c of SICC_GLOBAL_CRITERIA) {
      expect(valid).toContain(c.dimension);
    }
  });
});

describe('getCriteriaForDimension()', () => {
  it('returns only criteria matching the requested dimension', () => {
    for (const dim of ['stylized', 'intuitive', 'cohesive', 'coherent'] as const) {
      const results = getCriteriaForDimension(dim);
      expect(results.every((c) => c.dimension === dim)).toBe(true);
    }
  });

  it('returns a non-empty array for every dimension', () => {
    for (const dim of ['stylized', 'intuitive', 'cohesive', 'coherent'] as const) {
      expect(getCriteriaForDimension(dim).length).toBeGreaterThan(0);
    }
  });
});

describe('SICC_DIMENSIONS', () => {
  it('contains all four SICC dimensions', () => {
    const ids = SICC_DIMENSIONS.map((d) => d.id);
    expect(ids).toContain('stylized');
    expect(ids).toContain('intuitive');
    expect(ids).toContain('cohesive');
    expect(ids).toContain('coherent');
  });

  it('every dimension has a label and emoji', () => {
    for (const d of SICC_DIMENSIONS) {
      expect(d.label.trim().length).toBeGreaterThan(0);
      expect(d.emoji.trim().length).toBeGreaterThan(0);
    }
  });
});
