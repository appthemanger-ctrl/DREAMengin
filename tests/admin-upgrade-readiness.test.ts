import { describe, expect, it } from 'vitest';

import type { DaydreamEnginManifest } from '@/lib/feature-build';
import {
  buildPatchPlanChecklist,
  createUpgradeReadinessSnapshot,
  selectNextUpgradeTarget,
  summarizeBuildReadiness,
} from '@/lib/admin/upgrade-readiness';
import { summarizeSetupChecks, type SetupCheck } from '@/lib/setup/checks';

function makeManifest(
  domain: DaydreamEnginManifest['domain'],
  engin: DaydreamEnginManifest['engin'],
  implemented: number,
  planned: number,
  path: string,
): DaydreamEnginManifest {
  const implementedFeatures = Array.from({ length: implemented }, (_, index) => ({
    id: `${domain.toLowerCase()}-implemented-${index}`,
    label: `Implemented ${index + 1}`,
    description: `Implemented feature ${index + 1}`,
    status: 'implemented' as const,
    detectPattern: `Implemented${index + 1}`,
    detectPaths: [path],
  }));

  const plannedFeatures = Array.from({ length: planned }, (_, index) => ({
    id: `${domain.toLowerCase()}-planned-${index}`,
    label: `Planned ${index + 1}`,
    description: `Planned feature ${index + 1}`,
    status: 'planned' as const,
    detectPattern: `Planned${index + 1}`,
    detectPaths: [path],
  }));

  return {
    domain,
    engin,
    accentColor: '#123456',
    maxFeatures: implemented + planned,
    features: [...implementedFeatures, ...plannedFeatures],
    uiRefinements: ['Keep the UI cohesive'],
  };
}

function makeSetup(checks: SetupCheck[]) {
  return summarizeSetupChecks(checks);
}

describe('admin upgrade readiness', () => {
  const manifests: DaydreamEnginManifest[] = [
    makeManifest('Music', 'StarMakerEngin', 2, 2, 'engins/StarMakerEngin.tsx'),
    makeManifest('Games', 'GameEngin', 3, 1, 'engins/GameEngin.tsx'),
    makeManifest('Lab', 'LabEngin', 1, 3, 'engins/LabEngin.tsx'),
  ];

  it('summarizes aggregate build readiness across manifests', () => {
    const summary = summarizeBuildReadiness(manifests);

    expect(summary.totalImplemented).toBe(6);
    expect(summary.totalPlanned).toBe(6);
    expect(summary.totalMaxFeatures).toBe(12);
    expect(summary.overallProgressPct).toBe(50);
    expect(summary.buildPairs).toBe(3);
    expect(summary.refinePairs).toBe(0);
  });

  it('selects the most advanced BUILD pair and its next planned feature', () => {
    const target = selectNextUpgradeTarget(manifests);

    expect(target?.manifest.domain).toBe('Games');
    expect(target?.manifest.engin).toBe('GameEngin');
    expect(target?.nextFeature.id).toBe('games-planned-0');
    expect(target?.file).toBe('engins/GameEngin.tsx');
    expect(target?.projectedProgressPct).toBe(100);
  });

  it('keeps proposal gating pending when required setup checks are missing', () => {
    const setup = makeSetup([
      { key: 'SUPABASE_URL', ok: false, required: true },
      { key: 'SUPABASE_ANON_KEY', ok: true, required: true },
      { key: 'OPENAI_API_KEY', ok: false, required: false },
    ]);

    const snapshot = createUpgradeReadinessSnapshot({ manifests, setup });

    expect(snapshot.proposals).toHaveLength(1);
    expect(snapshot.proposals[0].idari.status).toBe('approved');
    expect(snapshot.proposals[0].boogieman.status).toBe('pending');
    expect(snapshot.proposals[0].dreams.status).toBe('pending');
    expect(snapshot.blockers).toContain('Missing required setup: SUPABASE_URL');
  });

  it('builds a real PR checklist when setup is ready', () => {
    const setup = makeSetup([
      { key: 'SUPABASE_URL', ok: true, required: true },
      { key: 'SUPABASE_ANON_KEY', ok: true, required: true },
      { key: 'OPENAI_API_KEY', ok: true, required: false },
    ]);

    const snapshot = createUpgradeReadinessSnapshot({ manifests, setup });
    const proposal = snapshot.proposals[0];
    const checklist = buildPatchPlanChecklist(proposal.plan);

    expect(proposal.boogieman.status).toBe('approved');
    expect(proposal.dreams.status).toBe('approved');
    expect(checklist).toEqual(proposal.checklist);
    expect(checklist.some((item) => item.includes('engins/GameEngin.tsx'))).toBe(true);
    expect(checklist.some((item) => item.includes('lib/feature-build/featureManifest.ts'))).toBe(true);
    expect(checklist.at(-1)).toContain('Verify outcome:');
  });
});
