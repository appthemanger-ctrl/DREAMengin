import {
  FEATURE_MANIFESTS,
  calculateProgress,
  computeAllBuildCycleStates,
  type BuildCycleState,
  type DaydreamEnginManifest,
  type FeatureEntry,
} from '@/lib/feature-build';
import { createPatchPlan, type PatchPlan } from '@/lib/agents/idari';
import { getSetupStatus, type SetupCheckSummary } from '@/lib/setup/checks';

export type UpgradeApprovalStatus = 'approved' | 'rejected' | 'pending';

export interface UpgradeApproval {
  status: UpgradeApprovalStatus;
  note: string;
}

export interface BuildReadinessSummary {
  states: BuildCycleState[];
  totalImplemented: number;
  totalPlanned: number;
  totalMaxFeatures: number;
  overallProgressPct: number;
  buildPairs: number;
  refinePairs: number;
}

export interface UpgradeTarget {
  manifest: DaydreamEnginManifest;
  state: BuildCycleState;
  nextFeature: FeatureEntry;
  file: string;
  projectedProgressPct: number;
}

export interface UpgradeProposal {
  id: string;
  title: string;
  impact: string;
  idari: UpgradeApproval;
  boogieman: UpgradeApproval;
  dreams: UpgradeApproval;
  plan: PatchPlan;
  checklist: string[];
}

export interface UpgradeReadinessSnapshot {
  setup: SetupCheckSummary;
  build: BuildReadinessSummary;
  nextTarget: UpgradeTarget | null;
  proposals: UpgradeProposal[];
  blockers: string[];
}

export function summarizeBuildReadiness(
  manifests: readonly DaydreamEnginManifest[] = FEATURE_MANIFESTS,
): BuildReadinessSummary {
  const states = computeAllBuildCycleStates(manifests);
  const totalImplemented = states.reduce((sum, state) => sum + state.featuresImplemented, 0);
  const totalPlanned = states.reduce((sum, state) => sum + state.featurePlanned, 0);
  const totalMaxFeatures = states.reduce((sum, state) => sum + state.maxFeatures, 0);

  return {
    states,
    totalImplemented,
    totalPlanned,
    totalMaxFeatures,
    overallProgressPct: calculateProgress(totalImplemented, totalMaxFeatures),
    buildPairs: states.filter((state) => state.phase === 'BUILD').length,
    refinePairs: states.filter((state) => state.phase === 'REFINE').length,
  };
}

export function selectNextUpgradeTarget(
  manifests: readonly DaydreamEnginManifest[] = FEATURE_MANIFESTS,
): UpgradeTarget | null {
  const states = computeAllBuildCycleStates(manifests);
  const candidates = manifests
    .map((manifest, index) => ({ manifest, state: states[index] }))
    .filter(({ state }) => state.featurePlanned > 0)
    .map(({ manifest, state }) => {
      const nextFeature = manifest.features.find((feature) => feature.status === 'planned');
      if (!nextFeature) return null;

      return {
        manifest,
        state,
        nextFeature,
        file: nextFeature.detectPaths[0] ?? 'lib/feature-build/featureManifest.ts',
        projectedProgressPct: calculateProgress(state.featuresImplemented + 1, state.maxFeatures),
      };
    })
    .filter((candidate): candidate is UpgradeTarget => candidate !== null)
    .sort((left, right) =>
      right.state.progressPct - left.state.progressPct ||
      right.state.featuresImplemented - left.state.featuresImplemented ||
      left.state.featurePlanned - right.state.featurePlanned ||
      left.manifest.domain.localeCompare(right.manifest.domain),
    );

  return candidates[0] ?? null;
}

export function buildPatchPlanChecklist(plan: PatchPlan): string[] {
  return [
    `Confirm root cause: ${plan.cause}`,
    `Apply smallest safe fix: ${plan.fix}`,
    ...plan.steps.map((step) => `Update ${step.file} — ${step.diff}`),
    `Verify outcome: ${plan.verification}`,
    ...(plan.rollback ? [`Rollback plan: ${plan.rollback}`] : []),
  ];
}

export function describeUpgradeBlockers(setup: SetupCheckSummary): string[] {
  const blockers: string[] = [];

  if (setup.missingRequired.length > 0) {
    blockers.push(
      `Missing required setup: ${setup.missingRequired.map((check) => check.key).join(', ')}`,
    );
  }

  if (setup.missingOptional.length > 0) {
    blockers.push(
      `Optional integrations still disconnected: ${setup.missingOptional.map((check) => check.key).join(', ')}`,
    );
  }

  if (blockers.length === 0) {
    blockers.push('No upgrade blockers detected. Required setup checks are passing.');
  }

  return blockers;
}

export function createUpgradeProposal(
  target: UpgradeTarget,
  setup: SetupCheckSummary,
): UpgradeProposal {
  const { manifest, state, nextFeature, file, projectedProgressPct } = target;
  const setupGateNote = setup.ok
    ? 'Required setup checks are passing, so this can move into a contained implementation cycle now.'
    : `Waiting on required setup: ${setup.missingRequired.map((check) => check.key).join(', ')}.`;

  const plan = createPatchPlan({
    id: `upgrade-${manifest.domain.toLowerCase()}-${nextFeature.id}`,
    title: `Upgrade ${manifest.domain} / ${manifest.engin} with ${nextFeature.label}`,
    cause: `${manifest.domain} / ${manifest.engin} is still in BUILD phase with ${state.featurePlanned} planned features remaining. The next manifest gap is "${nextFeature.label}".`,
    impact: `Without this upgrade, ${manifest.domain} creators stay at ${state.progressPct}% completion and the platform remains short of one of its planned next-level capabilities.`,
    fix: `Implement the smallest production-ready slice of "${nextFeature.label}" in ${file} and promote the manifest entry once the capability is genuinely live.`,
    verification: `Exercise the ${manifest.domain} surface, confirm "${nextFeature.label}" is visible and working, then rerun focused Vitest coverage plus a Next.js build for the affected area.`,
    steps: [
      {
        file,
        diff: `Add the "${nextFeature.label}" capability described by the feature manifest.`,
      },
      {
        file: 'lib/feature-build/featureManifest.ts',
        diff: `Mark ${nextFeature.id} as implemented only after the capability is fully wired and testable.`,
      },
      {
        file: 'tests/feature-build.test.ts',
        diff: 'Keep build-cycle coverage aligned with the updated manifest and progress totals.',
      },
    ],
    risk: 'medium',
  });

  return {
    id: plan.id,
    title: plan.title,
    impact: `Moves ${manifest.domain} / ${manifest.engin} from ${state.progressPct}% to ${projectedProgressPct}% by shipping ${nextFeature.label}.`,
    idari: {
      status: 'approved',
      note: `${manifest.domain} / ${manifest.engin} is the most ready BUILD pair at ${state.progressPct}% complete with ${state.featurePlanned} planned features left.`,
    },
    boogieman: {
      status: setup.ok ? 'approved' : 'pending',
      note: setupGateNote,
    },
    dreams: {
      status: setup.ok ? 'approved' : 'pending',
      note: setup.ok
        ? `User impact is isolated to the ${manifest.domain} runtime and can be verified before shipping platform-wide.`
        : 'User-impact review stays pending until required setup blockers are cleared.',
    },
    plan,
    checklist: buildPatchPlanChecklist(plan),
  };
}

export function createUpgradeReadinessSnapshot(options?: {
  manifests?: readonly DaydreamEnginManifest[];
  setup?: SetupCheckSummary;
}): UpgradeReadinessSnapshot {
  const manifests = options?.manifests ?? FEATURE_MANIFESTS;
  const setup = options?.setup ?? getSetupStatus();
  const build = summarizeBuildReadiness(manifests);
  const nextTarget = selectNextUpgradeTarget(manifests);

  return {
    setup,
    build,
    nextTarget,
    proposals: nextTarget ? [createUpgradeProposal(nextTarget, setup)] : [],
    blockers: describeUpgradeBlockers(setup),
  };
}
