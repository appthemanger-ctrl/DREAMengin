/**
 * ForgeEngin Tests
 *
 * Tests for the ForgeEngin meta-creation engine registry, activity pulse system,
 * and integration wiring.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// ── Mock localStorage (test environment is 'node', no browser globals) ───────
const localStorageStore: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => localStorageStore[key] ?? null,
  setItem: (key: string, value: string) => { localStorageStore[key] = value; },
  removeItem: (key: string) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); },
};
vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('window', { localStorage: localStorageMock });

import {
  ENGIN_REGISTRY,
  CREATIVE_ENGINES,
  FORGE_WORKFLOWS,
  recordForgeActivity,
  readForgeActivity,
  getForgeHeat,
  formatRelativeTime,
  type EnginEntry,
  type ForgeActivityPulse,
} from '@/lib/forge/forgeRegistry';

// ── Registry tests ────────────────────────────────────────────────────────────

describe('ENGIN_REGISTRY', () => {
  it('contains 7 entries (6 creative + forge)', () => {
    expect(ENGIN_REGISTRY).toHaveLength(7);
  });

  it('includes ForgeEngin as the last entry', () => {
    const forge = ENGIN_REGISTRY[ENGIN_REGISTRY.length - 1];
    expect(forge.id).toBe('forge');
    expect(forge.name).toBe('ForgeEngin');
    expect(forge.emoji).toBe('🔥');
  });

  it('every entry has required fields', () => {
    for (const entry of ENGIN_REGISTRY) {
      expect(entry.id).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.emoji).toBeTruthy();
      expect(entry.accent).toMatch(/^#/);
      expect(entry.desc).toBeTruthy();
      expect(entry.daydreamHref).toMatch(/^\//);
      expect(entry.enginHref).toMatch(/^\//);
      expect(entry.capabilities.length).toBeGreaterThan(0);
    }
  });

  it('has unique ids', () => {
    const ids = ENGIN_REGISTRY.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique names', () => {
    const names = ENGIN_REGISTRY.map(e => e.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('CREATIVE_ENGINES', () => {
  it('contains 6 entries (no forge)', () => {
    expect(CREATIVE_ENGINES).toHaveLength(6);
  });

  it('does not include forge', () => {
    expect(CREATIVE_ENGINES.find(e => e.id === 'forge')).toBeUndefined();
  });

  it('includes all 6 creative engine ids', () => {
    const ids = CREATIVE_ENGINES.map(e => e.id);
    expect(ids).toContain('games');
    expect(ids).toContain('music');
    expect(ids).toContain('code');
    expect(ids).toContain('lab');
    expect(ids).toContain('brand');
    expect(ids).toContain('create');
  });
});

// ── Activity Pulse tests ──────────────────────────────────────────────────────

describe('Forge Activity Pulse', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('readForgeActivity returns empty array when no data', () => {
    expect(readForgeActivity()).toEqual([]);
  });

  it('recordForgeActivity stores a pulse', () => {
    recordForgeActivity('games', 'Launched MADMAXI');
    const activity = readForgeActivity();
    expect(activity).toHaveLength(1);
    expect(activity[0].enginId).toBe('games');
    expect(activity[0].label).toBe('Launched MADMAXI');
  });

  it('recordForgeActivity overwrites same engine', () => {
    recordForgeActivity('games', 'First action');
    recordForgeActivity('games', 'Second action');
    const activity = readForgeActivity();
    expect(activity).toHaveLength(1);
    expect(activity[0].label).toBe('Second action');
  });

  it('stores multiple engines independently', () => {
    recordForgeActivity('games', 'Play');
    recordForgeActivity('music', 'Record');
    recordForgeActivity('code', 'Edit');
    const activity = readForgeActivity();
    expect(activity).toHaveLength(3);
  });

  it('heat decays over time', () => {
    // Record activity in the past
    const pastTime = new Date(Date.now() - 15 * 60 * 1000).toISOString(); // 15 min ago
    localStorage.setItem('de:forge:activity', JSON.stringify({
      games: { enginId: 'games', lastActive: pastTime, heat: 1.0, label: 'test' },
    }));
    const activity = readForgeActivity();
    expect(activity[0].heat).toBeGreaterThan(0);
    expect(activity[0].heat).toBeLessThan(1);
    // 15 min = half of 30 min decay → heat should be ~0.5
    expect(activity[0].heat).toBeCloseTo(0.5, 1);
  });

  it('heat reaches 0 after 30 minutes', () => {
    const pastTime = new Date(Date.now() - 31 * 60 * 1000).toISOString(); // 31 min ago
    localStorage.setItem('de:forge:activity', JSON.stringify({
      games: { enginId: 'games', lastActive: pastTime, heat: 1.0, label: 'test' },
    }));
    const activity = readForgeActivity();
    expect(activity[0].heat).toBe(0);
  });

  it('fresh activity has heat 1.0', () => {
    recordForgeActivity('music', 'Beat drop');
    const activity = readForgeActivity();
    // Heat should be very close to 1.0 (just recorded)
    expect(activity[0].heat).toBeGreaterThan(0.99);
  });
});

describe('getForgeHeat', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null for unknown engine', () => {
    expect(getForgeHeat('nonexistent')).toBeNull();
  });

  it('returns pulse for known engine', () => {
    recordForgeActivity('lab', 'Experiment');
    const pulse = getForgeHeat('lab');
    expect(pulse).not.toBeNull();
    expect(pulse!.enginId).toBe('lab');
  });
});

// ── formatRelativeTime tests ──────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  it('returns "just now" for recent timestamps', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('returns minutes for timestamps < 1h ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours for timestamps < 1d ago', () => {
    const threeHrsAgo = new Date(Date.now() - 3 * 3600_000).toISOString();
    expect(formatRelativeTime(threeHrsAgo)).toBe('3h ago');
  });

  it('returns days for older timestamps', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400_000).toISOString();
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d ago');
  });
});

// ── Integration wiring tests ──────────────────────────────────────────────────

describe('ForgeEngin integration wiring', () => {
  it('ForgeEngin is listed in ENGIN_REGISTRY with correct accent', () => {
    const forge = ENGIN_REGISTRY.find(e => e.id === 'forge');
    expect(forge).toBeDefined();
    expect(forge!.accent).toBe('#ef4444');
  });

  it('ForgeEngin daydreamHref points to /daydream/forge', () => {
    const forge = ENGIN_REGISTRY.find(e => e.id === 'forge');
    expect(forge!.daydreamHref).toBe('/daydream/forge');
  });

  it('every creative engine has daydream and engin routes', () => {
    for (const engine of CREATIVE_ENGINES) {
      expect(engine.daydreamHref).toMatch(/^\/daydream\//);
      expect(engine.enginHref).toMatch(/^\/engines\//);
    }
  });

  it('all engine accents are valid hex colors', () => {
    for (const engine of ENGIN_REGISTRY) {
      expect(engine.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

// ── FORGE_WORKFLOWS tests ─────────────────────────────────────────────────────

describe('FORGE_WORKFLOWS', () => {
  it('has at least 3 workflows', () => {
    expect(FORGE_WORKFLOWS.length).toBeGreaterThanOrEqual(3);
  });

  it('every workflow has unique id', () => {
    const ids = FORGE_WORKFLOWS.map(w => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every workflow references valid engine ids', () => {
    const validIds = new Set(ENGIN_REGISTRY.map(e => e.id));
    for (const wf of FORGE_WORKFLOWS) {
      for (const eid of wf.engines) {
        expect(validIds.has(eid)).toBe(true);
      }
    }
  });

  it('every workflow has at least one step', () => {
    for (const wf of FORGE_WORKFLOWS) {
      expect(wf.steps.length).toBeGreaterThan(0);
    }
  });

  it('every workflow has a valid accent hex colour', () => {
    for (const wf of FORGE_WORKFLOWS) {
      expect(wf.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('every workflow engines list is non-empty', () => {
    for (const wf of FORGE_WORKFLOWS) {
      expect(wf.engines.length).toBeGreaterThan(0);
    }
  });
});

// ── useForgeActivity hook unit test (non-React) ───────────────────────────────

describe('useForgeActivity integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('recordForgeActivity from multiple engines produces combined timeline', () => {
    recordForgeActivity('games', 'Launched MADMAXI');
    recordForgeActivity('music', 'Published release');
    recordForgeActivity('code', 'Ran CI');
    const timeline = readForgeActivity();
    expect(timeline).toHaveLength(3);
    const ids = timeline.map(p => p.enginId);
    expect(ids).toContain('games');
    expect(ids).toContain('music');
    expect(ids).toContain('code');
  });

  it('each engine pulse has a label matching the recorded action', () => {
    recordForgeActivity('lab', 'Ran simulation');
    const pulse = readForgeActivity().find(p => p.enginId === 'lab');
    expect(pulse).toBeDefined();
    expect(pulse!.label).toBe('Ran simulation');
  });
});

// ── Forge Intelligence Tests ──────────────────────────────────────────────────

import {
  appendForgeHistory,
  readForgeHistory,
  clearForgeHistory,
  predictNextEngines,
  generateSuggestions,
  parseGoalToWorkflow,
  recordForgeTransfer,
  readForgeTransfers,
  clearForgeTransfers,
  saveCustomWorkflow,
  readCustomWorkflows,
  deleteCustomWorkflow,
  clearCustomWorkflows,
  startWorkflowRun,
  updateWorkflowStep,
  getActiveWorkflowRun,
  clearWorkflowRun,
  getFailureRecovery,
  type ForgeHistoryEntry,
} from '@/lib/forge/forgeIntelligence';

describe('Forge History', () => {
  beforeEach(() => localStorage.clear());

  it('appendForgeHistory stores entries', () => {
    appendForgeHistory('games', 'Played');
    appendForgeHistory('music', 'Mixed');
    const h = readForgeHistory();
    expect(h).toHaveLength(2);
    expect(h[0].enginId).toBe('games');
    expect(h[1].enginId).toBe('music');
  });

  it('readForgeHistory returns empty array when no data', () => {
    expect(readForgeHistory()).toEqual([]);
  });

  it('clearForgeHistory removes all entries', () => {
    appendForgeHistory('code', 'Coded');
    clearForgeHistory();
    expect(readForgeHistory()).toEqual([]);
  });

  it('recordForgeActivity also feeds history', () => {
    recordForgeActivity('brand', 'Built logo');
    const h = readForgeHistory();
    expect(h.length).toBeGreaterThan(0);
    expect(h[h.length - 1].enginId).toBe('brand');
  });

  it('preserves full history (not just last per engine)', () => {
    appendForgeHistory('games', 'Action 1');
    appendForgeHistory('games', 'Action 2');
    appendForgeHistory('games', 'Action 3');
    const h = readForgeHistory();
    expect(h).toHaveLength(3);
    expect(h[0].label).toBe('Action 1');
    expect(h[2].label).toBe('Action 3');
  });
});

describe('Pattern Prediction', () => {
  beforeEach(() => localStorage.clear());

  it('predictNextEngines returns empty for empty history', () => {
    expect(predictNextEngines('games', [])).toEqual([]);
  });

  it('predictNextEngines detects A→B patterns', () => {
    const history: ForgeHistoryEntry[] = [
      { enginId: 'music', label: 'Mix', timestamp: new Date().toISOString() },
      { enginId: 'create', label: 'Post', timestamp: new Date().toISOString() },
      { enginId: 'music', label: 'Mix2', timestamp: new Date().toISOString() },
      { enginId: 'create', label: 'Post2', timestamp: new Date().toISOString() },
    ];
    const predicted = predictNextEngines('music', history);
    expect(predicted.length).toBeGreaterThan(0);
    expect(predicted[0].engine.id).toBe('create');
    expect(predicted[0].confidence).toBe(1); // 100% music→create
  });

  it('predictNextEngines ranks by frequency', () => {
    const history: ForgeHistoryEntry[] = [
      { enginId: 'code', label: 'A', timestamp: '' },
      { enginId: 'games', label: 'B', timestamp: '' },
      { enginId: 'code', label: 'C', timestamp: '' },
      { enginId: 'games', label: 'D', timestamp: '' },
      { enginId: 'code', label: 'E', timestamp: '' },
      { enginId: 'lab', label: 'F', timestamp: '' },
    ];
    const predicted = predictNextEngines('code', history);
    expect(predicted[0].engine.id).toBe('games');
    expect(predicted[0].confidence).toBeGreaterThan(0.5);
  });
});

describe('Contextual Suggestions', () => {
  beforeEach(() => localStorage.clear());

  it('returns empty for null action', () => {
    expect(generateSuggestions(null)).toEqual([]);
  });

  it('suggests workflows matching current engine', () => {
    const suggestions = generateSuggestions({ enginId: 'music', label: 'Mixed a track' });
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it('suggests content creation after publish action', () => {
    const suggestions = generateSuggestions({ enginId: 'music', label: 'Published release' });
    const contentSuggestion = suggestions.find(s => s.title === 'Create a post about it');
    expect(contentSuggestion).toBeDefined();
  });

  it('suggests GameEngin for audio-related actions', () => {
    const suggestions = generateSuggestions({ enginId: 'music', label: 'Created a beat' });
    const gameSug = suggestions.find(s => s.title === 'Wire into GameEngin');
    expect(gameSug).toBeDefined();
  });
});

describe('Goal → Workflow Parser', () => {
  it('returns null for empty string', () => {
    expect(parseGoalToWorkflow('')).toBeNull();
    expect(parseGoalToWorkflow('   ')).toBeNull();
  });

  it('returns null when no engines match', () => {
    expect(parseGoalToWorkflow('do something random xyz')).toBeNull();
  });

  it('parses "make a game with music" into games + music', () => {
    const wf = parseGoalToWorkflow('make a game with music');
    expect(wf).not.toBeNull();
    expect(wf!.engines).toContain('games');
    expect(wf!.engines).toContain('music');
  });

  it('adds content engine when "publish" is mentioned', () => {
    const wf = parseGoalToWorkflow('build a game and publish it');
    expect(wf).not.toBeNull();
    expect(wf!.engines).toContain('create');
  });

  it('generates steps for each engine', () => {
    const wf = parseGoalToWorkflow('experiment with data and code it');
    expect(wf).not.toBeNull();
    expect(wf!.steps.length).toBe(wf!.engines.length);
  });

  it('uses primary engine accent and emoji', () => {
    const wf = parseGoalToWorkflow('produce music');
    expect(wf).not.toBeNull();
    expect(wf!.emoji).toBe('🎵');
    expect(wf!.accent).toBe('#a855f7');
  });

  it('truncates long goals', () => {
    const longGoal = 'I want to create a game that has amazing music and publish it with a brand campaign and analytics';
    const wf = parseGoalToWorkflow(longGoal);
    expect(wf).not.toBeNull();
    expect(wf!.title.length).toBeLessThanOrEqual(50);
  });
});

describe('Cross-Engine Transfers', () => {
  beforeEach(() => localStorage.clear());

  it('recordForgeTransfer stores a transfer', () => {
    recordForgeTransfer('music', 'create', 'stem', 'Exported drums stem');
    const transfers = readForgeTransfers();
    expect(transfers).toHaveLength(1);
    expect(transfers[0].fromEnginId).toBe('music');
    expect(transfers[0].toEnginId).toBe('create');
  });

  it('stores multiple transfers', () => {
    recordForgeTransfer('music', 'games', 'audio', 'BGM track');
    recordForgeTransfer('code', 'games', 'script', 'AI logic');
    expect(readForgeTransfers()).toHaveLength(2);
  });

  it('clearForgeTransfers removes all', () => {
    recordForgeTransfer('lab', 'code', 'data', 'Dataset');
    clearForgeTransfers();
    expect(readForgeTransfers()).toEqual([]);
  });

  it('transfer entry has correct structure', () => {
    const entry = recordForgeTransfer('brand', 'create', 'logo', 'Brand logo', { format: 'svg' });
    expect(entry.id).toMatch(/^xfer-/);
    expect(entry.status).toBe('complete');
    expect(entry.metadata).toEqual({ format: 'svg' });
  });
});

describe('Custom Workflows', () => {
  beforeEach(() => localStorage.clear());

  it('saveCustomWorkflow stores a workflow', () => {
    const wf: import('@/lib/forge/forgeRegistry').ForgeWorkflow = {
      id: 'test-1', title: 'Test', emoji: '⚡', accent: '#ef4444',
      desc: 'test', engines: ['music', 'games'], steps: ['Step A', 'Step B'],
    };
    saveCustomWorkflow(wf);
    const customs = readCustomWorkflows();
    expect(customs).toHaveLength(1);
    expect(customs[0].id).toBe('test-1');
  });

  it('deleteCustomWorkflow removes by id', () => {
    const wf: import('@/lib/forge/forgeRegistry').ForgeWorkflow = {
      id: 'del-me', title: 'Del', emoji: '⚡', accent: '#ef4444',
      desc: 'test', engines: ['code'], steps: ['Step'],
    };
    saveCustomWorkflow(wf);
    deleteCustomWorkflow('del-me');
    expect(readCustomWorkflows()).toHaveLength(0);
  });

  it('clearCustomWorkflows removes all', () => {
    saveCustomWorkflow({
      id: 'a', title: 'A', emoji: '⚡', accent: '#ef4444',
      desc: 'test', engines: ['lab'], steps: ['S'],
    });
    clearCustomWorkflows();
    expect(readCustomWorkflows()).toEqual([]);
  });

  it('replaces workflow with same id', () => {
    saveCustomWorkflow({
      id: 'same', title: 'V1', emoji: '⚡', accent: '#ef4444',
      desc: 'v1', engines: ['lab'], steps: ['S1'],
    });
    saveCustomWorkflow({
      id: 'same', title: 'V2', emoji: '⚡', accent: '#ef4444',
      desc: 'v2', engines: ['lab', 'code'], steps: ['S1', 'S2'],
    });
    const customs = readCustomWorkflows();
    expect(customs).toHaveLength(1);
    expect(customs[0].title).toBe('V2');
  });
});

describe('Workflow Run Tracking', () => {
  beforeEach(() => localStorage.clear());

  it('startWorkflowRun creates a run with pending steps', () => {
    const run = startWorkflowRun('music-video', 3);
    expect(run.workflowId).toBe('music-video');
    expect(run.status).toBe('running');
    expect(run.steps).toHaveLength(3);
    expect(run.steps[0].status).toBe('active');
    expect(run.steps[1].status).toBe('pending');
  });

  it('updateWorkflowStep completes a step and activates next', () => {
    startWorkflowRun('test-wf', 3);
    const run = updateWorkflowStep(0, 'complete');
    expect(run).not.toBeNull();
    expect(run!.steps[0].status).toBe('complete');
    expect(run!.steps[1].status).toBe('active');
  });

  it('completing all steps marks run as complete', () => {
    startWorkflowRun('test-wf', 2);
    updateWorkflowStep(0, 'complete');
    const run = updateWorkflowStep(1, 'complete');
    expect(run!.status).toBe('complete');
  });

  it('failing a step marks run as failed when all done', () => {
    startWorkflowRun('test-wf', 2);
    updateWorkflowStep(0, 'complete');
    const run = updateWorkflowStep(1, 'failed', 'Export error');
    expect(run!.status).toBe('failed');
    expect(run!.steps[1].failureReason).toBe('Export error');
  });

  it('getActiveWorkflowRun returns the run', () => {
    startWorkflowRun('abc', 2);
    const run = getActiveWorkflowRun();
    expect(run).not.toBeNull();
    expect(run!.workflowId).toBe('abc');
  });

  it('clearWorkflowRun removes the run', () => {
    startWorkflowRun('abc', 2);
    clearWorkflowRun();
    expect(getActiveWorkflowRun()).toBeNull();
  });
});

describe('Failure Recovery', () => {
  it('suggests retry and skip for failed step', () => {
    const failedStep = {
      workflowId: 'music-video',
      stepIndex: 0,
      status: 'failed' as const,
      failureReason: 'Export failed',
    };
    const workflow = FORGE_WORKFLOWS.find(w => w.id === 'music-video')!;
    const recovery = getFailureRecovery(failedStep, workflow);
    expect(recovery.length).toBeGreaterThan(0);
    // Should have retry suggestion
    const retry = recovery.find(s => s.title.includes('Retry'));
    expect(retry).toBeDefined();
    // Should have skip suggestion (if not last step)
    if (workflow.steps.length > 1) {
      const skip = recovery.find(s => s.title.includes('Skip'));
      expect(skip).toBeDefined();
    }
  });
});
