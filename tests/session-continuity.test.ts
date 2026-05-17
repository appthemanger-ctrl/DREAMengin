import { describe, it, expect, beforeEach } from 'vitest';
import {
  SessionContinuity,
  type SessionStorageBackend,
  type StoredSession,
} from '@/lib/intelligence/sessionContinuity';

// ── In-memory test backend ────────────────────────────────────────────────────
// Injected via the constructor so tests run in any environment (node or jsdom)
// without needing IndexedDB or localStorage at all.

function makeMemoryBackend(initial: StoredSession[] = []): SessionStorageBackend {
  let store: StoredSession[] = [...initial];
  return {
    async read() { return [...store]; },
    async write(sessions) { store = [...sessions]; },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SessionContinuity', () => {
  let backend: SessionStorageBackend;

  beforeEach(() => {
    backend = makeMemoryBackend();
  });

  it('initialises with empty last-session (fresh install)', async () => {
    const c = new SessionContinuity(backend);
    await c.init();
    expect(c.getLastSessionSummary()).toBeNull();
    expect(c.getSessionDiff()).toBeNull();
  });

  it('records activations into the current session', () => {
    const c = new SessionContinuity(backend);
    c.recordActivation('CodeEngin');
    c.recordActivation('LabEngin');

    const summary = c.getCurrentSessionSummary();
    expect(summary.subsystemsVisited).toContain('CodeEngin');
    expect(summary.subsystemsVisited).toContain('LabEngin');
    expect(summary.subsystemActivationCount).toBe(1);
  });

  it('updates artifact metadata', () => {
    const c = new SessionContinuity(backend);
    c.updateArtifacts(5, ['code-run', 'prompt'], 'My Draft');

    const summary = c.getCurrentSessionSummary();
    expect(summary.artifactCount).toBe(5);
    expect(summary.artifactKinds).toContain('code-run');
    expect(summary.lastArtifactTitle).toBe('My Draft');
  });

  it('identifies the primary subsystem (most visited)', () => {
    const c = new SessionContinuity(backend);
    c.recordActivation('CodeEngin');
    c.recordActivation('LabEngin');
    c.recordActivation('CodeEngin');
    c.recordActivation('CodeEngin');

    expect(c.getCurrentSessionSummary().primarySubsystem).toBe('CodeEngin');
  });

  it('getSessionDiff returns null before any past sessions', async () => {
    const c = new SessionContinuity(backend);
    await c.init();
    c.recordActivation('CodeEngin');
    expect(c.getSessionDiff()).toBeNull();
  });

  it('computes correct diff: new and dropped subsystems', async () => {
    const pastSession: StoredSession = {
      id: 'past-1',
      startedAt: Date.now() - 86400000,
      endedAt: Date.now() - 82800000,
      activations: ['GameEngin', 'CodeEngin'],
      artifactKinds: ['event'],
      lastArtifactTitle: 'old artifact',
      artifactCount: 3,
    };
    const c = new SessionContinuity(makeMemoryBackend([pastSession]));
    await c.init();

    // LabEngin is new; GameEngin is dropped.
    c.recordActivation('LabEngin');
    c.recordActivation('CodeEngin');

    const diff = c.getSessionDiff();
    expect(diff).not.toBeNull();
    expect(diff!.newSubsystems).toContain('LabEngin');
    expect(diff!.droppedSubsystems).toContain('GameEngin');
    expect(diff!.continueFrom).toBe('CodeEngin');
  });

  it('diff recommendation hints at continueFrom when current session is empty', async () => {
    const pastSession: StoredSession = {
      id: 'past-2',
      startedAt: Date.now() - 86400000,
      endedAt: Date.now() - 82800000,
      activations: ['LabEngin', 'GameEngin'],
      artifactKinds: [],
      lastArtifactTitle: null,
      artifactCount: 0,
    };
    const c = new SessionContinuity(makeMemoryBackend([pastSession]));
    await c.init();

    const diff = c.getSessionDiff();
    expect(diff).not.toBeNull();
    expect(diff!.recommendation.toLowerCase()).toContain('gameengin');
    expect(diff!.continueFrom).toBe('GameEngin');
  });

  it('recommendation says "starting fresh" with no prior continueFrom', async () => {
    const pastSession: StoredSession = {
      id: 'past-empty',
      startedAt: Date.now() - 86400000,
      endedAt: Date.now() - 82800000,
      activations: [],
      artifactKinds: [],
      lastArtifactTitle: null,
      artifactCount: 0,
    };
    const c = new SessionContinuity(makeMemoryBackend([pastSession]));
    await c.init();

    const diff = c.getSessionDiff();
    expect(diff).not.toBeNull();
    expect(diff!.recommendation.toLowerCase()).toContain('starting fresh');
  });

  it('isReady() is false before init and true after', async () => {
    const c = new SessionContinuity(backend);
    expect(c.isReady()).toBe(false);
    await c.init();
    expect(c.isReady()).toBe(true);
  });

  it('persist() writes current session to backend', async () => {
    let written: StoredSession[] = [];
    const trackingBackend: SessionStorageBackend = {
      async read() { return []; },
      async write(sessions) { written = sessions; },
    };
    const c = new SessionContinuity(trackingBackend);
    await c.init();
    c.recordActivation('CodeEngin');
    await c.persist();

    expect(written.length).toBeGreaterThan(0);
    expect(written[0].activations).toContain('CodeEngin');
  });

  it('getPastSessions returns sessions in the order the backend provides', async () => {
    const older: StoredSession = {
      id: 'old-1',
      startedAt: Date.now() - 200000,
      endedAt: Date.now() - 190000,
      activations: ['CodeEngin'],
      artifactKinds: [],
      lastArtifactTitle: null,
      artifactCount: 1,
    };
    const newer: StoredSession = {
      id: 'new-1',
      startedAt: Date.now() - 5000,
      endedAt: Date.now() - 1000,
      activations: ['LabEngin'],
      artifactKinds: [],
      lastArtifactTitle: null,
      artifactCount: 2,
    };
    // Backend returns most-recent first (as real backends do).
    const c = new SessionContinuity(makeMemoryBackend([newer, older]));
    await c.init();

    const past = c.getPastSessions();
    expect(past.length).toBe(2);
    expect(past[0].id).toBe(newer.id);
    expect(past[1].id).toBe(older.id);
  });

  it('diff "new territory" recommendation when only new subsystems appear', async () => {
    const pastSession: StoredSession = {
      id: 'past-3',
      startedAt: Date.now() - 86400000,
      endedAt: Date.now() - 82800000,
      activations: ['CodeEngin'],
      artifactKinds: [],
      lastArtifactTitle: null,
      artifactCount: 0,
    };
    const c = new SessionContinuity(makeMemoryBackend([pastSession]));
    await c.init();

    c.recordActivation('LabEngin');
    c.recordActivation('CodeEngin');

    const diff = c.getSessionDiff();
    expect(diff).not.toBeNull();
    expect(diff!.newSubsystems).toContain('LabEngin');
    expect(diff!.recommendation.toLowerCase()).toContain('new territory');
  });
});
