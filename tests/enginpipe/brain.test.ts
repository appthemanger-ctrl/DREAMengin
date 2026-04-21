/**
 * tests/enginpipe/brain.test.ts
 *
 * Unit tests for the EnginPipe Knowledge Brain (Component 2).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createBrain,
  hydrateBrain,
  seedDefaultPrinciples,
  type Brain,
} from '@/lib/enginpipe/brain';

describe('enginpipe / brain — principles', () => {
  let brain: Brain;
  beforeEach(() => { brain = createBrain(); });

  it('adds a principle and retrieves it by id', () => {
    const p = brain.addPrinciple({
      category:  'behavior',
      statement: 'Every action does real work.',
      source:    'LAW.md §3',
      priority:  10,
    });
    expect(brain.getPrinciple(p.id)).toBe(p);
  });

  it('getPrinciplesByCategory returns only matching principles', () => {
    brain.addPrinciple({ category: 'behavior',     statement: 'A', source: 'x', priority: 5 });
    brain.addPrinciple({ category: 'architecture', statement: 'B', source: 'y', priority: 8 });
    brain.addPrinciple({ category: 'behavior',     statement: 'C', source: 'z', priority: 3 });

    const behavioral = brain.getPrinciplesByCategory('behavior');
    expect(behavioral).toHaveLength(2);
    // Should be sorted descending by priority.
    expect(behavioral[0].priority).toBeGreaterThanOrEqual(behavioral[1].priority);
  });

  it('seedDefaultPrinciples adds 8 core DREAMengin principles', () => {
    seedDefaultPrinciples(brain);
    const all = [...brain.principles.values()];
    expect(all.length).toBeGreaterThanOrEqual(8);
    // At least one privacy principle with priority 10.
    const privacy = brain.getPrinciplesByCategory('privacy');
    expect(privacy.length).toBeGreaterThan(0);
    expect(privacy[0].priority).toBe(10);
  });
});

describe('enginpipe / brain — patterns', () => {
  let brain: Brain;
  beforeEach(() => { brain = createBrain(); });

  it('adds a pattern and retrieves by kind', () => {
    brain.addPattern({ kind: 'hook', name: 'useDualRuntime', description: 'DRT hook', confidence: 0.8 });
    brain.addPattern({ kind: 'api',  name: 'runTriadConsensus', description: 'Triad gate', confidence: 0.95 });

    const hooks = brain.getPatternsByKind('hook');
    expect(hooks).toHaveLength(1);
    expect(hooks[0].name).toBe('useDualRuntime');
  });

  it('usePattern increments useCount and raises confidence toward 1', () => {
    const pat = brain.addPattern({ kind: 'schema', name: 'EnginManifest', description: 'd', confidence: 0.5 });
    brain.usePattern(pat.id);
    const updated = brain.patterns.get(pat.id)!;
    expect(updated.useCount).toBe(1);
    expect(updated.confidence).toBeGreaterThan(0.5);
    expect(updated.confidence).toBeLessThanOrEqual(1);
  });

  it('usePattern returns undefined for unknown id', () => {
    expect(brain.usePattern('not-real')).toBeUndefined();
  });

  it('patterns returned by kind are sorted by confidence descending', () => {
    brain.addPattern({ kind: 'workflow', name: 'A', description: '', confidence: 0.3 });
    brain.addPattern({ kind: 'workflow', name: 'B', description: '', confidence: 0.9 });
    brain.addPattern({ kind: 'workflow', name: 'C', description: '', confidence: 0.6 });
    const sorted = brain.getPatternsByKind('workflow');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].confidence).toBeGreaterThanOrEqual(sorted[i].confidence);
    }
  });
});

describe('enginpipe / brain — sessions', () => {
  let brain: Brain;
  beforeEach(() => { brain = createBrain(); });

  it('starts and ends a session', () => {
    const s = brain.startSession('code');
    expect(s.active).toBe(true);
    expect(s.enginId).toBe('code');

    brain.endSession(s.sessionId);
    expect(brain.getSession(s.sessionId)?.active).toBe(false);
    expect(brain.getSession(s.sessionId)?.endedAt).toBeDefined();
  });

  it('records events to an active session', () => {
    const s = brain.startSession('music');
    brain.recordEvent(s.sessionId, { type: 'observe', payload: { signal: 'test' } });
    brain.recordEvent(s.sessionId, { type: 'generate', payload: {} });
    expect(s.events).toHaveLength(2);
    expect(s.events[0].type).toBe('observe');
  });

  it('does not record events to a closed session', () => {
    const s = brain.startSession('lab');
    brain.endSession(s.sessionId);
    brain.recordEvent(s.sessionId, { type: 'deploy', payload: {} });
    expect(s.events).toHaveLength(0);
  });

  it('getActiveSessions returns only open sessions', () => {
    const s1 = brain.startSession('brand');
    const s2 = brain.startSession('create');
    brain.endSession(s1.sessionId);
    const active = brain.getActiveSessions();
    expect(active).toHaveLength(1);
    expect(active[0].sessionId).toBe(s2.sessionId);
  });
});

describe('enginpipe / brain — predictions', () => {
  let brain: Brain;
  beforeEach(() => { brain = createBrain(); });

  it('adds predictions and ranks them', () => {
    brain.addPrediction({ trigger: 'low quality', action: 'analyze signals', confidence: 0.4 });
    brain.addPrediction({ trigger: 'error spike',  action: 'run pulse cycle', confidence: 0.9 });
    brain.addPrediction({ trigger: 'idle',          action: 'optimize assets', confidence: 0.2 });

    const ranked = brain.rankPredictions();
    // Higher confidence should produce higher weight, generally.
    expect(ranked[0].confidence).toBeGreaterThanOrEqual(ranked[ranked.length - 1].confidence);
  });

  it('topPredictions returns at most N entries', () => {
    for (let i = 0; i < 10; i++) {
      brain.addPrediction({ trigger: `t${i}`, action: `a${i}`, confidence: Math.random() });
    }
    expect(brain.topPredictions(3)).toHaveLength(3);
    expect(brain.topPredictions(100)).toHaveLength(10);
  });
});

describe('enginpipe / brain — serialisation', () => {
  it('serialize and hydrateBrain produce a functionally equivalent brain', () => {
    const original = createBrain();
    seedDefaultPrinciples(original);
    original.addPattern({ kind: 'test', name: 'TestPat', description: 'x', confidence: 0.7 });
    original.addPrediction({ trigger: 'trigger', action: 'action', confidence: 0.5 });

    const snapshot = original.serialize();
    expect(snapshot.version).toBe(1);
    expect(snapshot.principles.length).toBeGreaterThan(0);
    expect(snapshot.patterns.length).toBe(1);

    const restored = hydrateBrain(snapshot);
    expect([...restored.principles.values()].length).toBe([...original.principles.values()].length);
    expect([...restored.patterns.values()].length).toBe(1);
    expect(restored.predictions.length).toBe(1);
  });
});
