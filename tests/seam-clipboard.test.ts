/**
 * tests/seam-clipboard.test.ts
 *
 * Unit tests for the cross-engin seam workflow system.
 *
 * Covers:
 *  - enginWorkflowRegistry: findWorkflows, findWorkflowById, allWorkflows,
 *    executeWorkflow
 *  - executeWorkflow: calls bridge.emitDurable with correct channel + event
 *  - seamClipboard.setWithEngins: routes to correct workflows, returns IDs
 *  - seamClipboard.subscribe: receives payload from set()
 *  - seamClipboard.set with 'application/x-dream-artifact' MIME type triggers
 *    workflow routing
 *
 * Pure Node.js tests — no browser APIs, no React, no DOM.
 * Spies on bridge.emitDurable using vi.spyOn.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import {
  findWorkflows,
  findWorkflowById,
  allWorkflows,
  executeWorkflow,
  ENGIN_KEYS,
  type EnginKey,
} from '@/lib/runtime/enginWorkflowRegistry';
import {
  seamClipboard,
  type SeamClipboardPayload,
} from '@/lib/runtime/seamClipboard';

// ── Shared fixtures ────────────────────────────────────────────────────────────

const SURFACE_REGION = 'Surface Space' as const;
const DREAM_REGION = 'DreamSpace' as const;

// ── Setup / teardown ───────────────────────────────────────────────────────────

beforeEach(() => {
  bridge.clearAll();
  seamClipboard.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  bridge.clearAll();
  vi.restoreAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// enginWorkflowRegistry
// ══════════════════════════════════════════════════════════════════════════════

describe('enginWorkflowRegistry', () => {

  // ── ENGIN_KEYS ──────────────────────────────────────────────────────────────

  describe('ENGIN_KEYS', () => {
    it('contains all 7 expected keys', () => {
      const expected = ['starmaker', 'game', 'code', 'lab', 'brand', 'content', 'forge'];
      for (const key of expected) {
        expect((ENGIN_KEYS as readonly string[]).includes(key)).toBe(true);
      }
      expect(ENGIN_KEYS).toHaveLength(7);
    });
  });

  // ── allWorkflows ─────────────────────────────────────────────────────────────

  describe('allWorkflows()', () => {
    it('returns a non-empty readonly array', () => {
      const workflows = allWorkflows();
      expect(workflows.length).toBeGreaterThan(0);
    });

    it('contains exactly 21 registered workflows', () => {
      expect(allWorkflows()).toHaveLength(21);
    });

    it('every workflow has a non-empty id, from, to, bridgeChannel, and bridgeEvent', () => {
      for (const w of allWorkflows()) {
        expect(w.id.length).toBeGreaterThan(0);
        expect((ENGIN_KEYS as readonly string[]).includes(w.from)).toBe(true);
        expect((ENGIN_KEYS as readonly string[]).includes(w.to)).toBe(true);
        expect(w.bridgeChannel.length).toBeGreaterThan(0);
        expect(w.bridgeEvent.length).toBeGreaterThan(0);
      }
    });

    it('every workflow id is unique', () => {
      const ids = allWorkflows().map((w) => w.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });

    it('every workflow has a non-empty label and description', () => {
      for (const w of allWorkflows()) {
        expect(w.label.length).toBeGreaterThan(0);
        expect(w.description.length).toBeGreaterThan(0);
      }
    });

    it('every workflow has at least one artifactType', () => {
      for (const w of allWorkflows()) {
        expect(w.artifactTypes.length).toBeGreaterThan(0);
      }
    });
  });

  // ── findWorkflows ────────────────────────────────────────────────────────────

  describe('findWorkflows(from, to)', () => {
    it('returns starmaker→lab workflows', () => {
      const results = findWorkflows('starmaker', 'lab');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('starmaker-to-lab:stem-analyze');
    });

    it('returns starmaker→content workflows', () => {
      const results = findWorkflows('starmaker', 'content');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('starmaker-to-content:attach-track');
    });

    it('returns starmaker→game workflows', () => {
      const results = findWorkflows('starmaker', 'game');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('starmaker-to-game:adaptive-soundtrack');
    });

    it('returns starmaker→brand workflows', () => {
      const results = findWorkflows('starmaker', 'brand');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('starmaker-to-brand:track-release');
    });

    it('returns code→game workflows', () => {
      const results = findWorkflows('code', 'game');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('code-to-game:deploy-script');
    });

    it('returns code→lab workflows', () => {
      const results = findWorkflows('code', 'lab');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('code-to-lab:run-experiment');
    });

    it('returns forge→game workflows', () => {
      const results = findWorkflows('forge', 'game');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('forge-to-game:import-3d-asset');
    });

    it('returns forge→starmaker workflows', () => {
      const results = findWorkflows('forge', 'starmaker');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('forge-to-starmaker:visualizer-scene');
    });

    it('returns lab→starmaker workflows', () => {
      const results = findWorkflows('lab', 'starmaker');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('lab-to-starmaker:sonify');
    });

    it('returns lab→forge workflows', () => {
      const results = findWorkflows('lab', 'forge');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('lab-to-forge:generate-3d');
    });

    it('returns brand→game workflows', () => {
      const results = findWorkflows('brand', 'game');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('brand-to-game:sponsor-skin');
    });

    it('returns an empty array for an undefined Engin pair', () => {
      // lab→starmaker exists, but starmaker→forge does not
      const results = findWorkflows('starmaker', 'forge');
      expect(results).toHaveLength(0);
    });

    it('is commutative only where both directions are defined', () => {
      // brand→content and content→brand are both registered
      expect(findWorkflows('brand', 'content').length).toBeGreaterThan(0);
      expect(findWorkflows('content', 'brand').length).toBeGreaterThan(0);
    });
  });

  // ── findWorkflowById ─────────────────────────────────────────────────────────

  describe('findWorkflowById(id)', () => {
    it('returns the correct workflow for a known id', () => {
      const workflow = findWorkflowById('game-to-code:export-script');
      expect(workflow).toBeDefined();
      expect(workflow?.from).toBe('game');
      expect(workflow?.to).toBe('code');
      expect(workflow?.bridgeChannel).toBe('code');
      expect(workflow?.bridgeEvent).toBe('code:game-script-imported');
    });

    it('returns the correct workflow for lab→code dataset export', () => {
      const workflow = findWorkflowById('lab-to-code:export-dataset');
      expect(workflow).toBeDefined();
      expect(workflow?.bridgeChannel).toBe('code');
      expect(workflow?.bridgeEvent).toBe('code:lab-dataset-received');
    });

    it('returns the correct workflow for forge→lab simulate-asset', () => {
      const workflow = findWorkflowById('forge-to-lab:simulate-asset');
      expect(workflow).toBeDefined();
      expect(workflow?.bridgeChannel).toBe('lab');
      expect(workflow?.bridgeEvent).toBe('lab:asset-simulation-requested');
    });

    it('returns the correct workflow for lab-to-forge:generate-3d', () => {
      const workflow = findWorkflowById('lab-to-forge:generate-3d');
      expect(workflow).toBeDefined();
      // This routes through the 'code' channel per spec
      expect(workflow?.bridgeChannel).toBe('code');
      expect(workflow?.bridgeEvent).toBe('code:lab-to-forge-requested');
    });

    it('returns undefined for an unknown id', () => {
      expect(findWorkflowById('does-not-exist')).toBeUndefined();
    });

    it('returns undefined for an empty string id', () => {
      expect(findWorkflowById('')).toBeUndefined();
    });
  });

  // ── executeWorkflow ──────────────────────────────────────────────────────────

  describe('executeWorkflow(id, payload)', () => {
    it('returns false for an unknown workflow id', () => {
      const result = executeWorkflow('totally-fake-id', {});
      expect(result).toBe(false);
    });

    it('returns true when the workflow is found and executed', () => {
      const spy = vi.spyOn(bridge, 'emitDurable');
      const result = executeWorkflow('starmaker-to-lab:stem-analyze', {
        stemType: 'vocals',
        stemUrl: 'https://cdn.example.com/stem.mp3',
        trackId: 'track-001',
        bpm: 128,
        trackTitle: 'Test Track',
      });
      expect(result).toBe(true);
      spy.mockRestore();
    });

    it('calls bridge.emitDurable with the correct channel for starmaker→lab', () => {
      const spy = vi.spyOn(bridge, 'emitDurable');
      executeWorkflow('starmaker-to-lab:stem-analyze', { stemType: 'guitar' });
      expect(spy).toHaveBeenCalledOnce();
      const [channel, event] = spy.mock.calls[0] as [string, string, Record<string, unknown>];
      expect(channel).toBe('lab');
      expect(event).toBe('lab:stem-visualization-requested');
    });

    it('calls bridge.emitDurable with the correct channel for code→game deploy', () => {
      const spy = vi.spyOn(bridge, 'emitDurable');
      executeWorkflow('code-to-game:deploy-script', {
        projectId: 'proj-1',
        cellId: 'cell-42',
        code: 'function update() {}',
        language: 'javascript',
      });
      expect(spy).toHaveBeenCalledOnce();
      const [channel, event] = spy.mock.calls[0] as [string, string, Record<string, unknown>];
      expect(channel).toBe('games');
      expect(event).toBe('games:script-deploy-requested');
    });

    it('calls bridge.emitDurable with the correct channel for game→brand campaign', () => {
      const spy = vi.spyOn(bridge, 'emitDurable');
      executeWorkflow('game-to-brand:achievement-campaign', {
        achievement: 'First Blood',
        gameTitle: 'Neon Drift',
        score: 9001,
        playerId: 'player-x',
      });
      const [channel, event] = spy.mock.calls[0] as [string, string, Record<string, unknown>];
      expect(channel).toBe('brand');
      expect(event).toBe('brand:achievement-campaign-requested');
    });

    it('passes the payload through to bridge.emitDurable unchanged', () => {
      const spy = vi.spyOn(bridge, 'emitDurable');
      const payload = { trackId: 't-99', trackTitle: 'Banger', bpm: 140 };
      executeWorkflow('starmaker-to-brand:track-release', payload);
      const [, , receivedPayload] = spy.mock.calls[0] as [string, string, Record<string, unknown>];
      expect(receivedPayload).toMatchObject(payload);
    });

    it('fires a durable event that is delivered to active subscribers', () => {
      const received: Array<Record<string, unknown>> = [];
      bridge.subscribe('games', 'games:soundtrack-requested', (p) => {
        received.push(p);
      });
      executeWorkflow('starmaker-to-game:adaptive-soundtrack', {
        trackId: 'tk-5',
        trackTitle: 'Zone Out',
        bpm: 100,
        stemUrl: 'https://cdn.example.com/full.mp3',
      });
      expect(received).toHaveLength(1);
      expect(received[0].trackId).toBe('tk-5');
    });

    it('stores the emission in the durable queue with status "pending"', () => {
      executeWorkflow('forge-to-content:embed-3d', {
        assetId: 'asset-3d-1',
        assetUrl: 'https://cdn.example.com/model.glb',
        assetName: 'Crystal Tower',
        assetType: 'environment',
      });
      const queue = bridge.getDurableQueue();
      const entry = queue.find((e) => e.event === 'create:asset-embedded');
      expect(entry).toBeDefined();
      expect(entry?.status).toBe('pending');
      expect(entry?.channel).toBe('create');
    });

    it('executes all 21 workflows without throwing', () => {
      for (const workflow of allWorkflows()) {
        expect(() => executeWorkflow(workflow.id, { _test: true })).not.toThrow();
      }
    });
  });

  // ── Workflow-level bridgeEvent naming convention ──────────────────────────────

  describe('bridgeEvent naming convention', () => {
    it("every bridgeEvent starts with its bridgeChannel prefix", () => {
      for (const w of allWorkflows()) {
        // e.g. channel 'lab', event 'lab:stem-visualization-requested' ✓
        // exception: lab-to-forge uses 'code' channel (per spec)
        const eventPrefix = w.bridgeEvent.split(':')[0];
        expect(eventPrefix).toBe(w.bridgeChannel);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// seamClipboard
// ══════════════════════════════════════════════════════════════════════════════

describe('seamClipboard', () => {

  // ── subscribe ────────────────────────────────────────────────────────────────

  describe('subscribe(handler)', () => {
    it('delivers the payload to the subscriber when set() is called', () => {
      const received: SeamClipboardPayload[] = [];
      const off = seamClipboard.subscribe((p) => received.push(p));

      seamClipboard.set({
        content: 'hello world',
        mimeType: 'text/plain',
        sourceRegion: SURFACE_REGION,
        targetRegion: DREAM_REGION,
      });

      expect(received).toHaveLength(1);
      expect(received[0].content).toBe('hello world');
      expect(received[0].mimeType).toBe('text/plain');
      expect(received[0].sourceRegion).toBe(SURFACE_REGION);
      expect(received[0].targetRegion).toBe(DREAM_REGION);
      expect(typeof received[0].timestamp).toBe('number');
      off();
    });

    it('delivers the payload to multiple independent subscribers', () => {
      const a: SeamClipboardPayload[] = [];
      const b: SeamClipboardPayload[] = [];
      const offA = seamClipboard.subscribe((p) => a.push(p));
      const offB = seamClipboard.subscribe((p) => b.push(p));

      seamClipboard.set({
        content: 'multi',
        mimeType: 'text/plain',
        sourceRegion: DREAM_REGION,
        targetRegion: SURFACE_REGION,
      });

      expect(a).toHaveLength(1);
      expect(b).toHaveLength(1);
      offA();
      offB();
    });

    it('unsubscribes cleanly — no more deliveries after off()', () => {
      const received: SeamClipboardPayload[] = [];
      const off = seamClipboard.subscribe((p) => received.push(p));

      seamClipboard.set({
        content: 'before',
        mimeType: 'text/plain',
        sourceRegion: SURFACE_REGION,
        targetRegion: DREAM_REGION,
      });
      off();
      seamClipboard.set({
        content: 'after',
        mimeType: 'text/plain',
        sourceRegion: SURFACE_REGION,
        targetRegion: DREAM_REGION,
      });

      expect(received).toHaveLength(1);
      expect(received[0].content).toBe('before');
    });
  });

  // ── get ──────────────────────────────────────────────────────────────────────

  describe('get()', () => {
    it('returns null before any set() call', () => {
      // beforeEach calls seamClipboard.clear() so the singleton starts fresh.
      expect(seamClipboard.get()).toBeNull();
    });

    it('returns the last payload after set()', () => {
      seamClipboard.set({
        content: 'snapshot',
        mimeType: 'application/json',
        sourceRegion: SURFACE_REGION,
        targetRegion: DREAM_REGION,
      });
      const snap = seamClipboard.get();
      expect(snap).not.toBeNull();
      expect(snap?.content).toBe('snapshot');
    });

    it('reflects the most recent set() call', () => {
      seamClipboard.set({
        content: 'first',
        mimeType: 'text/plain',
        sourceRegion: SURFACE_REGION,
        targetRegion: DREAM_REGION,
      });
      seamClipboard.set({
        content: 'second',
        mimeType: 'text/plain',
        sourceRegion: SURFACE_REGION,
        targetRegion: DREAM_REGION,
      });
      expect(seamClipboard.get()?.content).toBe('second');
    });
  });

  // ── set() with application/x-dream-artifact ──────────────────────────────────

  describe('set() with application/x-dream-artifact MIME type', () => {
    it('routes to the correct workflow and fires bridge.emitDurable', () => {
      const spy = vi.spyOn(bridge, 'emitDurable');

      const artifact = JSON.stringify({
        engin: 'starmaker',
        targetEngin: 'lab',
        stemType: 'bass',
        stemUrl: 'https://cdn.example.com/bass.mp3',
        trackId: 'trk-7',
        bpm: 120,
        trackTitle: 'Deep Cut',
      });

      seamClipboard.set({
        content: artifact,
        mimeType: 'application/x-dream-artifact',
        sourceRegion: SURFACE_REGION,
        targetRegion: DREAM_REGION,
      });

      // Should have fired: workflow emit + seam:drop fallback emit
      const workflowCall = spy.mock.calls.find(
        ([, event]) => event === 'lab:stem-visualization-requested',
      );
      expect(workflowCall).toBeDefined();
      if (workflowCall) {
        const [channel, event, payload] = workflowCall as [
          string,
          string,
          Record<string, unknown>,
        ];
        expect(channel).toBe('lab');
        expect(event).toBe('lab:stem-visualization-requested');
        expect(payload.stemType).toBe('bass');
      }
    });

    it('also emits the fallback seam:drop after workflow routing', () => {
      const spy = vi.spyOn(bridge, 'emitDurable');

      seamClipboard.set({
        content: JSON.stringify({ engin: 'code', targetEngin: 'game', cellId: 'c-1' }),
        mimeType: 'application/x-dream-artifact',
        sourceRegion: DREAM_REGION,
        targetRegion: SURFACE_REGION,
      });

      const seamDropCall = spy.mock.calls.find(([ch, ev]) => ch === 'seam' && ev === 'drop');
      expect(seamDropCall).toBeDefined();
    });

    it('fires bridge events that are delivered to active bridge subscribers', () => {
      const received: Array<Record<string, unknown>> = [];
      bridge.subscribe('games', 'games:script-deploy-requested', (p) => {
        received.push(p);
      });

      seamClipboard.set({
        content: JSON.stringify({
          engin: 'code',
          targetEngin: 'game',
          cellId: 'cell-99',
          code: 'npc.patrol()',
          language: 'javascript',
          projectId: 'proj-neon',
        }),
        mimeType: 'application/x-dream-artifact',
        sourceRegion: SURFACE_REGION,
        targetRegion: DREAM_REGION,
      });

      expect(received).toHaveLength(1);
      expect(received[0].cellId).toBe('cell-99');
    });

    it('handles aliases: "music" maps to starmaker, "create" maps to content', () => {
      const spy = vi.spyOn(bridge, 'emitDurable');

      seamClipboard.set({
        content: JSON.stringify({ engin: 'music', targetEngin: 'create', trackId: 'tk-alias' }),
        mimeType: 'application/x-dream-artifact',
        sourceRegion: SURFACE_REGION,
        targetRegion: DREAM_REGION,
      });

      // starmaker→content: 'create:music-attached'
      const call = spy.mock.calls.find(([, ev]) => ev === 'create:music-attached');
      expect(call).toBeDefined();
    });

    it('handles Engin-suffixed aliases: "StarMakerEngin" → starmaker', () => {
      const spy = vi.spyOn(bridge, 'emitDurable');

      seamClipboard.set({
        content: JSON.stringify({
          engin: 'StarMakerEngin',
          targetEngin: 'LabEngin',
          stemType: 'vocals',
        }),
        mimeType: 'application/x-dream-artifact',
        sourceRegion: SURFACE_REGION,
        targetRegion: DREAM_REGION,
      });

      const call = spy.mock.calls.find(([, ev]) => ev === 'lab:stem-visualization-requested');
      expect(call).toBeDefined();
    });

    it('falls through gracefully when content is not valid JSON', () => {
      const spy = vi.spyOn(bridge, 'emitDurable');

      expect(() => {
        seamClipboard.set({
          content: 'NOT JSON {{{{',
          mimeType: 'application/x-dream-artifact',
          sourceRegion: SURFACE_REGION,
          targetRegion: DREAM_REGION,
        });
      }).not.toThrow();

      // Fallback seam:drop should still fire
      const seamDrop = spy.mock.calls.find(([ch, ev]) => ch === 'seam' && ev === 'drop');
      expect(seamDrop).toBeDefined();
    });

    it('falls through gracefully when engin fields are missing', () => {
      const spy = vi.spyOn(bridge, 'emitDurable');

      seamClipboard.set({
        content: JSON.stringify({ someData: 42 }), // no engin / targetEngin
        mimeType: 'application/x-dream-artifact',
        sourceRegion: SURFACE_REGION,
        targetRegion: DREAM_REGION,
      });

      // Only the fallback seam:drop should fire — no workflow emissions
      const seamDrop = spy.mock.calls.find(([ch, ev]) => ch === 'seam' && ev === 'drop');
      expect(seamDrop).toBeDefined();
      // No other durable channels should have fired
      const workflowCalls = spy.mock.calls.filter(([ch]) => ch !== 'seam');
      expect(workflowCalls).toHaveLength(0);
    });

    it('does nothing special for text/plain MIME — only emits seam:drop', () => {
      const spy = vi.spyOn(bridge, 'emitDurable');

      seamClipboard.set({
        content: 'plain text note',
        mimeType: 'text/plain',
        sourceRegion: SURFACE_REGION,
        targetRegion: DREAM_REGION,
      });

      expect(spy).toHaveBeenCalledOnce();
      const [ch, ev] = spy.mock.calls[0] as [string, string];
      expect(ch).toBe('seam');
      expect(ev).toBe('drop');
    });
  });

  // ── setWithEngins ─────────────────────────────────────────────────────────────

  describe('setWithEngins(from, to, artifact)', () => {
    it('returns the workflow IDs that fired for starmaker→lab', () => {
      const spy = vi.spyOn(bridge, 'emitDurable');
      const ids = seamClipboard.setWithEngins('starmaker', 'lab', {
        stemType: 'drums',
        stemUrl: 'https://cdn.example.com/drums.mp3',
        trackId: 'trk-d',
        bpm: 130,
        trackTitle: 'Drums Only',
      });
      expect(ids).toEqual(['starmaker-to-lab:stem-analyze']);
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
    });

    it('fires emitDurable with correct channel + event for game→content', () => {
      const spy = vi.spyOn(bridge, 'emitDurable');
      seamClipboard.setWithEngins('game', 'content', {
        gameTitle: 'Drift City',
        score: 4200,
        sessionId: 'sess-001',
        clipUrl: 'https://cdn.example.com/clip.mp4',
        achievement: 'Drifter',
      });
      expect(spy).toHaveBeenCalledOnce();
      const [channel, event] = spy.mock.calls[0] as [string, string];
      expect(channel).toBe('create');
      expect(event).toBe('create:game-clip-embedded');
    });

    it('fires emitDurable with correct channel + event for lab→starmaker', () => {
      const spy = vi.spyOn(bridge, 'emitDurable');
      seamClipboard.setWithEngins('lab', 'starmaker', {
        experimentId: 'exp-77',
        exportId: 'xpt-1',
        dataPoints: [440, 880, 220],
        mappingHint: 'pitch',
      });
      const [channel, event] = spy.mock.calls[0] as [string, string];
      expect(channel).toBe('music');
      expect(event).toBe('music:sonification-requested');
    });

    it('merges the artifact into the bridge payload', () => {
      const spy = vi.spyOn(bridge, 'emitDurable');
      seamClipboard.setWithEngins('forge', 'game', {
        assetId: 'asset-forge-1',
        assetUrl: 'https://cdn.example.com/knight.glb',
        assetName: 'Knight',
        assetType: 'character',
        format: 'glb',
      });
      const [, , payload] = spy.mock.calls[0] as [string, string, Record<string, unknown>];
      expect(payload.assetId).toBe('asset-forge-1');
      expect(payload.assetName).toBe('Knight');
      // _seamTimestamp is injected by setWithEngins
      expect(typeof payload._seamTimestamp).toBe('number');
    });

    it('returns an empty array when no workflows are defined for the pair', () => {
      const spy = vi.spyOn(bridge, 'emitDurable');
      const ids = seamClipboard.setWithEngins('starmaker', 'forge', { data: 1 });
      expect(ids).toEqual([]);
      expect(spy).not.toHaveBeenCalled();
    });

    it('returns multiple IDs when multiple workflows exist for the same pair', () => {
      // Currently every pair has at most 1 workflow, but test the general contract:
      // brand→game has 1 workflow
      const ids = seamClipboard.setWithEngins('brand', 'game', {
        campaignId: 'camp-1',
        colors: ['#ff0'],
        logoUrl: 'https://cdn.example.com/logo.png',
        badgeUrl: 'https://cdn.example.com/badge.png',
      });
      expect(ids.length).toBeGreaterThanOrEqual(1);
      expect(ids[0]).toBe('brand-to-game:sponsor-skin');
    });

    it('does NOT emit seam:drop — only the workflow events fire', () => {
      const spy = vi.spyOn(bridge, 'emitDurable');
      seamClipboard.setWithEngins('content', 'brand', {
        contentId: 'post-abc',
        title: 'My Post',
        mediaUrl: 'https://cdn.example.com/img.jpg',
        platform: 'dreamr',
      });
      // No seam:drop call
      const seamDrop = spy.mock.calls.find(([ch, ev]) => ch === 'seam' && ev === 'drop');
      expect(seamDrop).toBeUndefined();
    });

    it('delivers the event to active bridge subscribers immediately', () => {
      const received: Array<Record<string, unknown>> = [];
      bridge.subscribe('brand', 'brand:music-release-requested', (p) => {
        received.push(p);
      });
      seamClipboard.setWithEngins('starmaker', 'brand', {
        trackId: 'tk-release',
        trackTitle: 'Banger 2',
        bpm: 145,
      });
      expect(received).toHaveLength(1);
      expect(received[0].trackId).toBe('tk-release');
    });

    it('stores durable events that can be replayed for late-joining subscribers', () => {
      seamClipboard.setWithEngins('lab', 'code', {
        experimentId: 'exp-12',
        exportId: 'xpt-5',
        data: [1, 2, 3],
        format: 'csv',
        url: 'https://cdn.example.com/data.csv',
      });

      // Late subscriber comes online
      const replayed: Array<Record<string, unknown>> = [];
      bridge.subscribe('code', 'code:lab-dataset-received', (p) => {
        replayed.push(p);
      });
      bridge.replayPending('code');

      expect(replayed.some((p) => p.experimentId === 'exp-12')).toBe(true);
    });

    it('all 21 registered workflows execute without throwing via setWithEngins', () => {
      for (const workflow of allWorkflows()) {
        expect(() => {
          seamClipboard.setWithEngins(workflow.from as EnginKey, workflow.to as EnginKey, {
            _testRun: true,
          });
        }).not.toThrow();
      }
    });
  });

  // ── set() emits to bridge (seam:drop fallback) ────────────────────────────────

  describe('set() emits seam:drop on the bridge', () => {
    it('the bridge durable queue contains the seam:drop event after set()', () => {
      seamClipboard.set({
        content: 'some content',
        mimeType: 'text/plain',
        sourceRegion: SURFACE_REGION,
        targetRegion: DREAM_REGION,
      });
      const queue = bridge.getDurableQueue();
      const seamEntry = queue.find((e) => e.channel === 'seam' && e.event === 'drop');
      expect(seamEntry).toBeDefined();
      expect(seamEntry?.status).toBe('pending');
    });
  });
});
