import { beforeEach, describe, expect, it } from 'vitest';
import { dreamOSBus, deriveAIRuntimeContext } from '@/lib/runtime/dreamOSBus';

describe('dreamOSBus', () => {
  beforeEach(() => {
    dreamOSBus.clearAll();
  });

  it('publishes runtime contexts with derived AI context', () => {
    dreamOSBus.publishRuntimeContext({
      region: 'Surface Space',
      world: { type: 'engin', name: 'CodeEngin' },
      splitRatio: 0.6,
      dominant: true,
    });

    const snapshot = dreamOSBus.getSnapshot();
    expect(snapshot.runtimeContexts).toHaveLength(1);
    expect(snapshot.runtimeContexts[0]?.aiContext).toBe('code');
    expect(snapshot.runtimeContexts[0]?.subsystemId).toBe('CodeEngin');
  });

  it('stores shared artifacts in newest-first order', () => {
    dreamOSBus.upsertArtifact({
      id: 'artifact-1',
      kind: 'code-run',
      title: 'Code run',
      sourceSubsystem: 'CodeEngin',
      relatedSubsystems: ['LabEngin'],
      payload: { ok: true },
      updatedAt: 1,
    });
    dreamOSBus.upsertArtifact({
      id: 'artifact-2',
      kind: 'lab-result',
      title: 'Lab result',
      sourceSubsystem: 'LabEngin',
      relatedSubsystems: ['CodeEngin'],
      payload: { ok: true },
      updatedAt: 2,
    });

    const snapshot = dreamOSBus.getSnapshot();
    expect(snapshot.artifacts.map((artifact) => artifact.id)).toEqual(['artifact-2', 'artifact-1']);
  });
});

describe('deriveAIRuntimeContext', () => {
  it('maps runtime worlds to subsystem-aware AI modes', () => {
    expect(deriveAIRuntimeContext({ type: 'engin', name: 'LabEngin' })).toBe('lab');
    expect(deriveAIRuntimeContext({ type: 'engin', name: 'GameEngin' })).toBe('game');
    expect(deriveAIRuntimeContext('DreamSpace')).toBe('general');
  });
});
