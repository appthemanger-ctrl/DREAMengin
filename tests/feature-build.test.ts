/**
 * tests/feature-build.test.ts
 *
 * Unit tests for lib/feature-build — the feature build progression system.
 *
 * Coverage:
 *   1. featureManifest   — all 6 manifests load, domains/engins are canonical, maxFeatures consistent
 *   2. buildCycle        — getBuildPhase, calculateProgress, computeBuildCycleState, allPairsInRefinePhase
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
  computeBuildCycleState,
  computeAllBuildCycleStates,
  allPairsInRefinePhase,
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

  it('every feature status is either implemented or planned', () => {
    for (const m of FEATURE_MANIFESTS) {
      for (const f of m.features) {
        expect(['implemented', 'planned']).toContain(f.status);
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
  it('returns BUILD when featuresImplemented < maxFeatures', () => {
    expect(getBuildPhase(5, 10)).toBe('BUILD');
    expect(getBuildPhase(0, 10)).toBe('BUILD');
    expect(getBuildPhase(9, 10)).toBe('BUILD');
  });

  it('returns REFINE when featuresImplemented === maxFeatures', () => {
    expect(getBuildPhase(10, 10)).toBe('REFINE');
  });

  it('returns REFINE when featuresImplemented > maxFeatures', () => {
    expect(getBuildPhase(11, 10)).toBe('REFINE');
  });

  it('returns REFINE when both are 0', () => {
    expect(getBuildPhase(0, 0)).toBe('REFINE');
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

  it('implemented + planned equals maxFeatures', () => {
    for (const m of FEATURE_MANIFESTS) {
      const impl = countFeaturesByStatus(m, 'implemented');
      const plan = countFeaturesByStatus(m, 'planned');
      expect(impl + plan).toBe(m.maxFeatures);
    }
  });
});

describe('computeBuildCycleState()', () => {
  it('returns a valid BuildCycleState for every manifest', () => {
    for (const m of FEATURE_MANIFESTS) {
      const state = computeBuildCycleState(m);
      expect(state.domain).toBe(m.domain);
      expect(state.engin).toBe(m.engin);
      expect(['BUILD', 'REFINE']).toContain(state.phase);
      expect(state.featuresImplemented + state.featurePlanned).toBe(m.maxFeatures);
      expect(state.progressPct).toBeGreaterThanOrEqual(0);
      expect(state.progressPct).toBeLessThanOrEqual(100);
    }
  });

  it('phase is BUILD when planned features remain', () => {
    // All current manifests have at least one planned feature → should all be BUILD
    for (const m of FEATURE_MANIFESTS) {
      const hasPlanned = m.features.some((f) => f.status === 'planned');
      const state = computeBuildCycleState(m);
      if (hasPlanned) {
        expect(state.phase).toBe('BUILD');
      }
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
  it('returns false when any pair is in BUILD phase', () => {
    const states = computeAllBuildCycleStates(FEATURE_MANIFESTS);
    // All manifests currently have planned features → all BUILD
    const anyBuild = states.some((s) => s.phase === 'BUILD');
    if (anyBuild) {
      expect(allPairsInRefinePhase(states)).toBe(false);
    }
  });

  it('returns true when all states are REFINE', () => {
    const allRefine = FEATURE_MANIFESTS.map((m) => ({
      domain: m.domain,
      engin: m.engin,
      phase: 'REFINE' as const,
      featuresImplemented: m.maxFeatures,
      featurePlanned: 0,
      maxFeatures: m.maxFeatures,
      progressPct: 100,
    }));
    expect(allPairsInRefinePhase(allRefine)).toBe(true);
  });

  it('returns false for an empty array', () => {
    expect(allPairsInRefinePhase([])).toBe(false);
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
