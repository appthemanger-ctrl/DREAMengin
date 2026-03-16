/**
 * tests/dream-window-system.test.ts
 *
 * Comprehensive test suite for Phase 7 Dream Window + Runtime System integration.
 *
 * Coverage:
 *   1. DreamWindowLifecycle — valid/invalid state machine transitions
 *   2. connectionVerbs      — all 7 canonical verbs, rejection of invalid verbs
 *   3. runtimeRegion        — surface activation, mount/dismount, seam clamping, dominance
 *   4. enginConnectionNetwork — 11 paths, domain queries, engin queries, hasConnectionPath
 *   5. dualRuntime          — canonical field names, all functions, worldsEqual
 *
 * Architecture justification: docs/ARCHITECTURE.md §4 (Universal Dream Window model),
 *   §1 (Runtime regions, Daydream Surface Network).
 * Naming: all canonical strings sourced from lib/identity/canonical-names.ts.
 */

import { describe, it, expect } from 'vitest';

// ── System under test ─────────────────────────────────────────────────────────

import {
  DREAM_WINDOW_STATES,
  bindDreamWindow,
  mountDreamWindow,
  collapseDreamWindow,
  activateDreamWindow,
  unmountDreamWindow,
  unbindDreamWindow,
  createDreamWindowInstance,
  type DreamWindowInstance,
} from '@/lib/dream-window/DreamWindowLifecycle';

import {
  dispatch,
  createBindAction,
  createMountAction,
  createActivateAction,
  createAttachAction,
  createRouteIntoAction,
  createOpenIntoAction,
  createConnectAcrossAction,
  CONNECTION_VERBS,
} from '@/lib/dream-window/connectionVerbs';

import {
  DEFAULT_RUNTIME_REGION_STATE,
  activateSurface,
  mountWindowInDreamSpace,
  dismountWindowFromDreamSpace,
  setSeamPosition,
  getSurfaceSpaceSurface,
  isDreamSpaceDominant,
  RUNTIME_REGIONS,
} from '@/lib/dream-window/runtimeRegion';

import {
  ALL_CONNECTION_PATHS,
  getPathsForDomain,
  getPathsForEngin,
  hasConnectionPath,
} from '@/lib/dream-window/enginConnectionNetwork';

import {
  DEFAULT_DUAL_RUNTIME,
  setRuntimeWorld,
  swapDominantRuntime,
  makeHomeActiveTop,
  makeHomeDreamSpaceActive,
  isHomeActiveTop,
  worldsEqual,
  SURFACE_NAMES,
  type RuntimeWorld,
} from '@/lib/runtime/dualRuntime';

import {
  DAYDREAM_DOMAINS,
  ENGIN_SURFACES,
  NETWORK_COUNTS,
  SURFACE_NAMES as CANONICAL_SURFACE_NAMES,
} from '@/lib/identity/canonical-names';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUnbound(overrides: Partial<DreamWindowInstance> = {}): DreamWindowInstance {
  return createDreamWindowInstance({
    id: 'test-window-1',
    type: 'music',
    owner: 'user-abc',
    config: { label: 'My Music Window' },
    size: { width: 400, height: 300 },
    position: { x: 0, y: 0 },
    sourceBindings: ['spotify-connector'],
    destinationRules: [],
    ...overrides,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. DreamWindowLifecycle
// ─────────────────────────────────────────────────────────────────────────────

describe('DreamWindowLifecycle', () => {
  // ── createDreamWindowInstance ──────────────────────────────────────────────

  describe('createDreamWindowInstance', () => {
    it('creates an instance in Unbound state by default', () => {
      const instance = makeUnbound();
      expect(instance.activeState).toBe(DREAM_WINDOW_STATES.UNBOUND);
    });

    it('defaults visibility to private', () => {
      const instance = makeUnbound();
      expect(instance.visibility).toBe('private');
    });

    it('respects explicit visibility override', () => {
      const instance = makeUnbound({ visibility: 'shared' });
      expect(instance.visibility).toBe('shared');
    });

    it('stores all required fields', () => {
      const instance = makeUnbound();
      expect(instance.id).toBe('test-window-1');
      expect(instance.type).toBe('music');
      expect(instance.owner).toBe('user-abc');
      expect(instance.config.label).toBe('My Music Window');
    });
  });

  // ── bindDreamWindow ────────────────────────────────────────────────────────

  describe('bindDreamWindow', () => {
    it('transitions Unbound → Bound when sourceBindings is non-empty', () => {
      const unbound = makeUnbound();
      const bound = bindDreamWindow(unbound);
      expect(bound.activeState).toBe(DREAM_WINDOW_STATES.BOUND);
    });

    it('returns a new object (immutable)', () => {
      const unbound = makeUnbound();
      const bound = bindDreamWindow(unbound);
      expect(bound).not.toBe(unbound);
    });

    it('throws when called from Bound state', () => {
      const bound = bindDreamWindow(makeUnbound());
      expect(() => bindDreamWindow(bound)).toThrow(/invalid transition/i);
      expect(() => bindDreamWindow(bound)).toThrow(DREAM_WINDOW_STATES.BOUND);
    });

    it('throws when called from Mounted state', () => {
      const mounted = mountDreamWindow(bindDreamWindow(makeUnbound()));
      expect(() => bindDreamWindow(mounted)).toThrow(/invalid transition/i);
    });

    it('throws when called from Collapsed state', () => {
      const collapsed = collapseDreamWindow(mountDreamWindow(bindDreamWindow(makeUnbound())));
      expect(() => bindDreamWindow(collapsed)).toThrow(/invalid transition/i);
    });

    it('throws when sourceBindings is empty', () => {
      const unbound = makeUnbound({ sourceBindings: [] });
      expect(() => bindDreamWindow(unbound)).toThrow(/sourceBindings must be non-empty/i);
    });

    it('error message names the window ID when sourceBindings is empty', () => {
      const unbound = makeUnbound({ id: 'my-special-window', sourceBindings: [] });
      expect(() => bindDreamWindow(unbound)).toThrow('my-special-window');
    });
  });

  // ── mountDreamWindow ───────────────────────────────────────────────────────

  describe('mountDreamWindow', () => {
    it('transitions Bound → Mounted', () => {
      const bound = bindDreamWindow(makeUnbound());
      const mounted = mountDreamWindow(bound);
      expect(mounted.activeState).toBe(DREAM_WINDOW_STATES.MOUNTED);
    });

    it('throws when called from Unbound state', () => {
      const unbound = makeUnbound();
      expect(() => mountDreamWindow(unbound)).toThrow(/invalid transition/i);
      expect(() => mountDreamWindow(unbound)).toThrow(DREAM_WINDOW_STATES.UNBOUND);
    });

    it('throws when called from Mounted state', () => {
      const mounted = mountDreamWindow(bindDreamWindow(makeUnbound()));
      expect(() => mountDreamWindow(mounted)).toThrow(/invalid transition/i);
    });

    it('throws when called from Collapsed state', () => {
      const collapsed = collapseDreamWindow(mountDreamWindow(bindDreamWindow(makeUnbound())));
      expect(() => mountDreamWindow(collapsed)).toThrow(/invalid transition/i);
    });
  });

  // ── collapseDreamWindow ────────────────────────────────────────────────────

  describe('collapseDreamWindow', () => {
    it('transitions Mounted → Collapsed', () => {
      const mounted = mountDreamWindow(bindDreamWindow(makeUnbound()));
      const collapsed = collapseDreamWindow(mounted);
      expect(collapsed.activeState).toBe(DREAM_WINDOW_STATES.COLLAPSED);
    });

    it('throws when called from Unbound state', () => {
      expect(() => collapseDreamWindow(makeUnbound())).toThrow(/invalid transition/i);
    });

    it('throws when called from Bound state', () => {
      const bound = bindDreamWindow(makeUnbound());
      expect(() => collapseDreamWindow(bound)).toThrow(/invalid transition/i);
    });

    it('throws when called from Collapsed state (double-collapse)', () => {
      const collapsed = collapseDreamWindow(mountDreamWindow(bindDreamWindow(makeUnbound())));
      expect(() => collapseDreamWindow(collapsed)).toThrow(/invalid transition/i);
    });
  });

  // ── activateDreamWindow ────────────────────────────────────────────────────

  describe('activateDreamWindow', () => {
    it('transitions Collapsed → Mounted', () => {
      const collapsed = collapseDreamWindow(mountDreamWindow(bindDreamWindow(makeUnbound())));
      const reactivated = activateDreamWindow(collapsed);
      expect(reactivated.activeState).toBe(DREAM_WINDOW_STATES.MOUNTED);
    });

    it('throws when called from Unbound state', () => {
      expect(() => activateDreamWindow(makeUnbound())).toThrow(/invalid transition/i);
    });

    it('throws when called from Bound state', () => {
      const bound = bindDreamWindow(makeUnbound());
      expect(() => activateDreamWindow(bound)).toThrow(/invalid transition/i);
    });

    it('throws when called from Mounted state', () => {
      const mounted = mountDreamWindow(bindDreamWindow(makeUnbound()));
      expect(() => activateDreamWindow(mounted)).toThrow(/invalid transition/i);
    });
  });

  // ── unmountDreamWindow ─────────────────────────────────────────────────────

  describe('unmountDreamWindow', () => {
    it('transitions Mounted → Bound', () => {
      const mounted = mountDreamWindow(bindDreamWindow(makeUnbound()));
      const unMounted = unmountDreamWindow(mounted);
      expect(unMounted.activeState).toBe(DREAM_WINDOW_STATES.BOUND);
    });

    it('throws when called from Unbound state', () => {
      expect(() => unmountDreamWindow(makeUnbound())).toThrow(/invalid transition/i);
    });

    it('throws when called from Collapsed state', () => {
      const collapsed = collapseDreamWindow(mountDreamWindow(bindDreamWindow(makeUnbound())));
      expect(() => unmountDreamWindow(collapsed)).toThrow(/invalid transition/i);
    });
  });

  // ── unbindDreamWindow ──────────────────────────────────────────────────────

  describe('unbindDreamWindow', () => {
    it('transitions Bound → Unbound', () => {
      const bound = bindDreamWindow(makeUnbound());
      const unbound = unbindDreamWindow(bound);
      expect(unbound.activeState).toBe(DREAM_WINDOW_STATES.UNBOUND);
    });

    it('throws when called from Unbound state (already unbound)', () => {
      expect(() => unbindDreamWindow(makeUnbound())).toThrow(/invalid transition/i);
      expect(() => unbindDreamWindow(makeUnbound())).toThrow(DREAM_WINDOW_STATES.UNBOUND);
    });

    it('throws when called from Mounted state', () => {
      const mounted = mountDreamWindow(bindDreamWindow(makeUnbound()));
      expect(() => unbindDreamWindow(mounted)).toThrow(/invalid transition/i);
    });
  });

  // ── Full lifecycle round-trip ──────────────────────────────────────────────

  describe('full lifecycle round-trip', () => {
    it('can traverse the complete lifecycle: Unbound→Bound→Mounted→Collapsed→Mounted→Bound→Unbound', () => {
      const w0 = makeUnbound();
      expect(w0.activeState).toBe(DREAM_WINDOW_STATES.UNBOUND);

      const w1 = bindDreamWindow(w0);
      expect(w1.activeState).toBe(DREAM_WINDOW_STATES.BOUND);

      const w2 = mountDreamWindow(w1);
      expect(w2.activeState).toBe(DREAM_WINDOW_STATES.MOUNTED);

      const w3 = collapseDreamWindow(w2);
      expect(w3.activeState).toBe(DREAM_WINDOW_STATES.COLLAPSED);

      const w4 = activateDreamWindow(w3);
      expect(w4.activeState).toBe(DREAM_WINDOW_STATES.MOUNTED);

      const w5 = unmountDreamWindow(w4);
      expect(w5.activeState).toBe(DREAM_WINDOW_STATES.BOUND);

      const w6 = unbindDreamWindow(w5);
      expect(w6.activeState).toBe(DREAM_WINDOW_STATES.UNBOUND);
    });

    it('preserves all non-state fields through transitions', () => {
      const w0 = makeUnbound({ id: 'preserve-me', owner: 'owner-xyz' });
      const w1 = bindDreamWindow(w0);
      const w2 = mountDreamWindow(w1);
      expect(w2.id).toBe('preserve-me');
      expect(w2.owner).toBe('owner-xyz');
      expect(w2.visibility).toBe('private');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. connectionVerbs
// ─────────────────────────────────────────────────────────────────────────────

describe('connectionVerbs', () => {
  // ── Factory functions ──────────────────────────────────────────────────────

  describe('action factories', () => {
    it('createBindAction produces verb: bind', () => {
      const a = createBindAction('src', 'tgt');
      expect(a.verb).toBe('bind');
      expect(a.sourceId).toBe('src');
      expect(a.targetId).toBe('tgt');
    });

    it('createMountAction produces verb: mount', () => {
      expect(createMountAction('s', 't').verb).toBe('mount');
    });

    it('createActivateAction produces verb: activate', () => {
      expect(createActivateAction('s', 't').verb).toBe('activate');
    });

    it('createAttachAction produces verb: attach', () => {
      expect(createAttachAction('s', 't').verb).toBe('attach');
    });

    it('createRouteIntoAction produces verb: route into', () => {
      expect(createRouteIntoAction('s', 't').verb).toBe('route into');
    });

    it('createOpenIntoAction produces verb: open into', () => {
      expect(createOpenIntoAction('s', 't').verb).toBe('open into');
    });

    it('createConnectAcrossAction produces verb: connect across', () => {
      expect(createConnectAcrossAction('s', 't').verb).toBe('connect across');
    });

    it('includes context when provided', () => {
      const a = createBindAction('s', 't', 'HomeDream Surface');
      expect(a.context).toBe('HomeDream Surface');
    });

    it('omits context when not provided', () => {
      const a = createBindAction('s', 't');
      expect(a.context).toBeUndefined();
    });
  });

  // ── dispatch — valid verbs ─────────────────────────────────────────────────

  describe('dispatch — all 7 canonical verbs succeed', () => {
    const validFactories = [
      createBindAction,
      createMountAction,
      createActivateAction,
      createAttachAction,
      createRouteIntoAction,
      createOpenIntoAction,
      createConnectAcrossAction,
    ] as const;

    it.each(CONNECTION_VERBS)('dispatches verb "%s" successfully', (verb) => {
      // Find the matching factory
      const factory = validFactories.find((f) => f('s', 't').verb === verb);
      expect(factory).toBeDefined();
      const action = factory!('window-a', 'engin-b');
      const result = dispatch(action);
      expect(result.ok).toBe(true);
      expect(result.action.verb).toBe(verb);
      expect(result.message).toContain(verb);
      expect(result.message).toContain('window-a');
      expect(result.message).toContain('engin-b');
    });

    it('includes context in the message when provided', () => {
      const action = createBindAction('win-1', 'starmaker-engin', 'DreamSpace');
      const result = dispatch(action);
      expect(result.message).toContain('DreamSpace');
    });
  });

  // ── dispatch — invalid/rejected verbs throw ────────────────────────────────

  describe('dispatch — invalid verbs throw with helpful error', () => {
    const rejectedVerbs = ['link widget', 'open page', 'go to tab', 'launch card'] as const;

    it.each(rejectedVerbs)('throws for rejected verb "%s"', (verb) => {
      expect(() =>
        dispatch({ verb: verb as never, sourceId: 's', targetId: 't' }),
      ).toThrow(verb);
    });

    it('error message for rejected verb lists valid canonical verbs', () => {
      try {
        dispatch({ verb: 'link widget' as never, sourceId: 's', targetId: 't' });
        expect.fail('should have thrown');
      } catch (e: unknown) {
        const msg = (e as Error).message;
        expect(msg).toContain('link widget');
        // Should list at least some valid verbs
        expect(msg).toContain('bind');
        expect(msg).toContain('mount');
      }
    });

    it('throws for completely unknown verbs', () => {
      expect(() =>
        dispatch({ verb: 'navigate to' as never, sourceId: 's', targetId: 't' }),
      ).toThrow(/invalid connection verb/i);
    });

    it('error message for unknown verb names the bad verb', () => {
      try {
        dispatch({ verb: 'totally-made-up' as never, sourceId: 's', targetId: 't' });
        expect.fail('should have thrown');
      } catch (e: unknown) {
        expect((e as Error).message).toContain('totally-made-up');
      }
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. runtimeRegion
// ─────────────────────────────────────────────────────────────────────────────

describe('runtimeRegion', () => {
  // ── Default state ──────────────────────────────────────────────────────────

  describe('DEFAULT_RUNTIME_REGION_STATE', () => {
    it('Surface Space is dominant by default', () => {
      expect(DEFAULT_RUNTIME_REGION_STATE.surfaceSpace.isDominant).toBe(true);
      expect(DEFAULT_RUNTIME_REGION_STATE.dreamSpace.isDominant).toBe(false);
    });

    it('active surface defaults to HomeDream Surface', () => {
      expect(DEFAULT_RUNTIME_REGION_STATE.surfaceSpace.activeSurface).toBe(
        CANONICAL_SURFACE_NAMES.HOME_DREAM_SURFACE,
      );
    });

    it('DreamSpace has no mounted windows by default', () => {
      expect(DEFAULT_RUNTIME_REGION_STATE.dreamSpace.mountedWindows).toHaveLength(0);
    });

    it('seam position defaults to 0', () => {
      expect(DEFAULT_RUNTIME_REGION_STATE.seam.position).toBe(0);
    });

    it('seam label defaults to DreamDM Bar', () => {
      expect(DEFAULT_RUNTIME_REGION_STATE.seam.label).toBe('DreamDM Bar');
    });

    it('surface region label is Surface Space', () => {
      expect(DEFAULT_RUNTIME_REGION_STATE.surfaceSpace.region).toBe(RUNTIME_REGIONS.SURFACE_SPACE);
    });

    it('dream region label is DreamSpace', () => {
      expect(DEFAULT_RUNTIME_REGION_STATE.dreamSpace.region).toBe(RUNTIME_REGIONS.DREAM_SPACE);
    });
  });

  // ── activateSurface ────────────────────────────────────────────────────────

  describe('activateSurface', () => {
    it('updates the active surface name', () => {
      const next = activateSurface(
        DEFAULT_RUNTIME_REGION_STATE,
        CANONICAL_SURFACE_NAMES.MUSIC_DAYDREAM_SURFACE,
      );
      expect(getSurfaceSpaceSurface(next)).toBe(CANONICAL_SURFACE_NAMES.MUSIC_DAYDREAM_SURFACE);
    });

    it('returns a new state object (immutable)', () => {
      const next = activateSurface(DEFAULT_RUNTIME_REGION_STATE, 'Music Daydream Surface');
      expect(next).not.toBe(DEFAULT_RUNTIME_REGION_STATE);
    });

    it('does not affect DreamSpace', () => {
      const next = activateSurface(DEFAULT_RUNTIME_REGION_STATE, 'Brand Daydream Surface');
      expect(next.dreamSpace).toEqual(DEFAULT_RUNTIME_REGION_STATE.dreamSpace);
    });

    it('getSurfaceSpaceSurface returns the active surface', () => {
      expect(getSurfaceSpaceSurface(DEFAULT_RUNTIME_REGION_STATE)).toBe(
        CANONICAL_SURFACE_NAMES.HOME_DREAM_SURFACE,
      );
    });
  });

  // ── mountWindowInDreamSpace ────────────────────────────────────────────────

  describe('mountWindowInDreamSpace', () => {
    it('adds a Dream Window ref to DreamSpace', () => {
      const ref = { id: 'win-1', activeState: DREAM_WINDOW_STATES.MOUNTED };
      const next = mountWindowInDreamSpace(DEFAULT_RUNTIME_REGION_STATE, ref);
      expect(next.dreamSpace.mountedWindows).toHaveLength(1);
      expect(next.dreamSpace.mountedWindows[0].id).toBe('win-1');
    });

    it('can mount multiple windows', () => {
      let state = DEFAULT_RUNTIME_REGION_STATE;
      state = mountWindowInDreamSpace(state, { id: 'win-1', activeState: DREAM_WINDOW_STATES.MOUNTED });
      state = mountWindowInDreamSpace(state, { id: 'win-2', activeState: DREAM_WINDOW_STATES.MOUNTED });
      expect(state.dreamSpace.mountedWindows).toHaveLength(2);
    });

    it('replaces existing window ref with same ID instead of duplicating', () => {
      let state = mountWindowInDreamSpace(DEFAULT_RUNTIME_REGION_STATE, {
        id: 'win-1',
        activeState: DREAM_WINDOW_STATES.MOUNTED,
      });
      state = mountWindowInDreamSpace(state, {
        id: 'win-1',
        activeState: DREAM_WINDOW_STATES.COLLAPSED,
      });
      expect(state.dreamSpace.mountedWindows).toHaveLength(1);
      expect(state.dreamSpace.mountedWindows[0].activeState).toBe(DREAM_WINDOW_STATES.COLLAPSED);
    });
  });

  // ── dismountWindowFromDreamSpace ───────────────────────────────────────────

  describe('dismountWindowFromDreamSpace', () => {
    it('removes a mounted window by ID', () => {
      let state = mountWindowInDreamSpace(DEFAULT_RUNTIME_REGION_STATE, {
        id: 'win-1',
        activeState: DREAM_WINDOW_STATES.MOUNTED,
      });
      state = dismountWindowFromDreamSpace(state, 'win-1');
      expect(state.dreamSpace.mountedWindows).toHaveLength(0);
    });

    it('leaves other windows untouched when removing one', () => {
      let state = DEFAULT_RUNTIME_REGION_STATE;
      state = mountWindowInDreamSpace(state, { id: 'win-1', activeState: DREAM_WINDOW_STATES.MOUNTED });
      state = mountWindowInDreamSpace(state, { id: 'win-2', activeState: DREAM_WINDOW_STATES.MOUNTED });
      state = dismountWindowFromDreamSpace(state, 'win-1');
      expect(state.dreamSpace.mountedWindows).toHaveLength(1);
      expect(state.dreamSpace.mountedWindows[0].id).toBe('win-2');
    });

    it('returns unchanged state when ID not found', () => {
      const next = dismountWindowFromDreamSpace(DEFAULT_RUNTIME_REGION_STATE, 'nonexistent');
      expect(next.dreamSpace.mountedWindows).toHaveLength(0);
    });
  });

  // ── setSeamPosition ────────────────────────────────────────────────────────

  describe('setSeamPosition', () => {
    it('sets seam position to provided value', () => {
      const next = setSeamPosition(DEFAULT_RUNTIME_REGION_STATE, 0.3);
      expect(next.seam.position).toBe(0.3);
    });

    it('clamps position below 0 to 0', () => {
      const next = setSeamPosition(DEFAULT_RUNTIME_REGION_STATE, -0.5);
      expect(next.seam.position).toBe(0);
    });

    it('clamps position above 1 to 1', () => {
      const next = setSeamPosition(DEFAULT_RUNTIME_REGION_STATE, 1.5);
      expect(next.seam.position).toBe(1);
    });

    it('position 0.5 makes DreamSpace dominant', () => {
      const next = setSeamPosition(DEFAULT_RUNTIME_REGION_STATE, 0.5);
      expect(isDreamSpaceDominant(next)).toBe(true);
      expect(next.surfaceSpace.isDominant).toBe(false);
    });

    it('position 0.8 makes DreamSpace dominant', () => {
      const next = setSeamPosition(DEFAULT_RUNTIME_REGION_STATE, 0.8);
      expect(isDreamSpaceDominant(next)).toBe(true);
    });

    it('position 0.3 keeps Surface Space dominant', () => {
      const next = setSeamPosition(DEFAULT_RUNTIME_REGION_STATE, 0.3);
      expect(isDreamSpaceDominant(next)).toBe(false);
      expect(next.surfaceSpace.isDominant).toBe(true);
    });

    it('position 0 keeps Surface Space dominant', () => {
      expect(isDreamSpaceDominant(DEFAULT_RUNTIME_REGION_STATE)).toBe(false);
    });
  });

  // ── isDreamSpaceDominant ───────────────────────────────────────────────────

  describe('isDreamSpaceDominant', () => {
    it('returns false for default state', () => {
      expect(isDreamSpaceDominant(DEFAULT_RUNTIME_REGION_STATE)).toBe(false);
    });

    it('returns true after seam is moved to 0.9', () => {
      const next = setSeamPosition(DEFAULT_RUNTIME_REGION_STATE, 0.9);
      expect(isDreamSpaceDominant(next)).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. enginConnectionNetwork
// ─────────────────────────────────────────────────────────────────────────────

describe('enginConnectionNetwork', () => {
  // ── Path count validation ──────────────────────────────────────────────────

  it(`has exactly ${NETWORK_COUNTS.CONNECTION_PATHS} connection paths`, () => {
    expect(ALL_CONNECTION_PATHS.length).toBe(NETWORK_COUNTS.CONNECTION_PATHS);
    expect(ALL_CONNECTION_PATHS.length).toBe(11);
  });

  it('all path IDs are unique', () => {
    const ids = ALL_CONNECTION_PATHS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all paths use canonical DaydreamDomain values', () => {
    const validDomains = Object.values(DAYDREAM_DOMAINS);
    for (const path of ALL_CONNECTION_PATHS) {
      expect(validDomains).toContain(path.daydreamSurface);
    }
  });

  it('all paths use canonical EnginSurface values', () => {
    const validEngins = Object.values(ENGIN_SURFACES);
    for (const path of ALL_CONNECTION_PATHS) {
      expect(validEngins).toContain(path.enginRuntime);
    }
  });

  it('all paths have non-empty labels', () => {
    for (const path of ALL_CONNECTION_PATHS) {
      expect(path.label.length).toBeGreaterThan(0);
    }
  });

  // ── Expected paths per domain ──────────────────────────────────────────────

  describe('getPathsForDomain', () => {
    it('Music has 3 paths', () => {
      expect(getPathsForDomain(DAYDREAM_DOMAINS.MUSIC)).toHaveLength(3);
    });

    it('Music paths target StarMakerEngin, LabEngin, CodeEngin', () => {
      const paths = getPathsForDomain(DAYDREAM_DOMAINS.MUSIC);
      const engins = paths.map((p) => p.enginRuntime);
      expect(engins).toContain(ENGIN_SURFACES.MUSIC);   // StarMakerEngin
      expect(engins).toContain(ENGIN_SURFACES.LAB);     // LabEngin
      expect(engins).toContain(ENGIN_SURFACES.CODE);    // CodeEngin
    });

    it('Music→StarMakerEngin verb is bind', () => {
      const path = getPathsForDomain(DAYDREAM_DOMAINS.MUSIC).find(
        (p) => p.enginRuntime === ENGIN_SURFACES.MUSIC,
      );
      expect(path?.verb).toBe('bind');
    });

    it('Music→LabEngin verb is route into', () => {
      const path = getPathsForDomain(DAYDREAM_DOMAINS.MUSIC).find(
        (p) => p.enginRuntime === ENGIN_SURFACES.LAB,
      );
      expect(path?.verb).toBe('route into');
    });

    it('Music→CodeEngin verb is connect across', () => {
      const path = getPathsForDomain(DAYDREAM_DOMAINS.MUSIC).find(
        (p) => p.enginRuntime === ENGIN_SURFACES.CODE,
      );
      expect(path?.verb).toBe('connect across');
    });

    it('Games has 3 paths', () => {
      expect(getPathsForDomain(DAYDREAM_DOMAINS.GAMES)).toHaveLength(3);
    });

    it('Games paths target GameEngin, LabEngin, CodeEngin', () => {
      const paths = getPathsForDomain(DAYDREAM_DOMAINS.GAMES);
      const engins = paths.map((p) => p.enginRuntime);
      expect(engins).toContain(ENGIN_SURFACES.GAMES);
      expect(engins).toContain(ENGIN_SURFACES.LAB);
      expect(engins).toContain(ENGIN_SURFACES.CODE);
    });

    it('Brand has 3 paths', () => {
      expect(getPathsForDomain(DAYDREAM_DOMAINS.BRAND)).toHaveLength(3);
    });

    it('Brand paths target BrandingEngin, ContentEngin, LabEngin', () => {
      const paths = getPathsForDomain(DAYDREAM_DOMAINS.BRAND);
      const engins = paths.map((p) => p.enginRuntime);
      expect(engins).toContain(ENGIN_SURFACES.BRAND);
      expect(engins).toContain(ENGIN_SURFACES.CREATE);
      expect(engins).toContain(ENGIN_SURFACES.LAB);
    });

    it('Brand→ContentEngin verb is route into', () => {
      const path = getPathsForDomain(DAYDREAM_DOMAINS.BRAND).find(
        (p) => p.enginRuntime === ENGIN_SURFACES.CREATE,
      );
      expect(path?.verb).toBe('route into');
    });

    it('Brand→LabEngin verb is connect across', () => {
      const path = getPathsForDomain(DAYDREAM_DOMAINS.BRAND).find(
        (p) => p.enginRuntime === ENGIN_SURFACES.LAB,
      );
      expect(path?.verb).toBe('connect across');
    });

    it('Create has 1 path', () => {
      expect(getPathsForDomain(DAYDREAM_DOMAINS.CREATE)).toHaveLength(1);
    });

    it('Create→ContentEngin verb is bind', () => {
      const paths = getPathsForDomain(DAYDREAM_DOMAINS.CREATE);
      expect(paths[0].enginRuntime).toBe(ENGIN_SURFACES.CREATE);
      expect(paths[0].verb).toBe('bind');
    });

    it('Lab has 1 path', () => {
      expect(getPathsForDomain(DAYDREAM_DOMAINS.LAB)).toHaveLength(1);
    });

    it('Lab→LabEngin verb is bind', () => {
      const paths = getPathsForDomain(DAYDREAM_DOMAINS.LAB);
      expect(paths[0].enginRuntime).toBe(ENGIN_SURFACES.LAB);
      expect(paths[0].verb).toBe('bind');
    });

    it('Code Daydream Surface has 0 direct outbound paths (it is a target, not a source here)', () => {
      expect(getPathsForDomain(DAYDREAM_DOMAINS.CODE)).toHaveLength(0);
    });
  });

  // ── getPathsForEngin ───────────────────────────────────────────────────────

  describe('getPathsForEngin', () => {
    it('LabEngin receives paths from Music, Games, Brand, and Lab (4 total)', () => {
      const paths = getPathsForEngin(ENGIN_SURFACES.LAB);
      expect(paths).toHaveLength(4);
      const sources = paths.map((p) => p.daydreamSurface);
      expect(sources).toContain(DAYDREAM_DOMAINS.MUSIC);
      expect(sources).toContain(DAYDREAM_DOMAINS.GAMES);
      expect(sources).toContain(DAYDREAM_DOMAINS.BRAND);
      expect(sources).toContain(DAYDREAM_DOMAINS.LAB);
    });

    it('CodeEngin receives paths from Music and Games (2 total)', () => {
      const paths = getPathsForEngin(ENGIN_SURFACES.CODE);
      expect(paths).toHaveLength(2);
    });

    it('StarMakerEngin receives only 1 path (from Music)', () => {
      const paths = getPathsForEngin(ENGIN_SURFACES.MUSIC);
      expect(paths).toHaveLength(1);
      expect(paths[0].daydreamSurface).toBe(DAYDREAM_DOMAINS.MUSIC);
    });

    it('ContentEngin receives paths from Brand and Create (2 total)', () => {
      const paths = getPathsForEngin(ENGIN_SURFACES.CREATE);
      expect(paths).toHaveLength(2);
    });

    it('GameEngin receives only 1 path (from Games)', () => {
      const paths = getPathsForEngin(ENGIN_SURFACES.GAMES);
      expect(paths).toHaveLength(1);
    });
  });

  // ── hasConnectionPath ──────────────────────────────────────────────────────

  describe('hasConnectionPath', () => {
    it('Music → StarMakerEngin: true', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.MUSIC, ENGIN_SURFACES.MUSIC)).toBe(true);
    });

    it('Music → LabEngin: true', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.MUSIC, ENGIN_SURFACES.LAB)).toBe(true);
    });

    it('Music → CodeEngin: true', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.MUSIC, ENGIN_SURFACES.CODE)).toBe(true);
    });

    it('Music → GameEngin: false (no direct path)', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.MUSIC, ENGIN_SURFACES.GAMES)).toBe(false);
    });

    it('Music → BrandingEngin: false', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.MUSIC, ENGIN_SURFACES.BRAND)).toBe(false);
    });

    it('Music → ContentEngin: false', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.MUSIC, ENGIN_SURFACES.CREATE)).toBe(false);
    });

    it('Games → GameEngin: true', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.GAMES, ENGIN_SURFACES.GAMES)).toBe(true);
    });

    it('Games → LabEngin: true', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.GAMES, ENGIN_SURFACES.LAB)).toBe(true);
    });

    it('Games → CodeEngin: true', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.GAMES, ENGIN_SURFACES.CODE)).toBe(true);
    });

    it('Games → StarMakerEngin: false', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.GAMES, ENGIN_SURFACES.MUSIC)).toBe(false);
    });

    it('Brand → BrandingEngin: true', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.BRAND, ENGIN_SURFACES.BRAND)).toBe(true);
    });

    it('Brand → ContentEngin: true', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.BRAND, ENGIN_SURFACES.CREATE)).toBe(true);
    });

    it('Brand → LabEngin: true', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.BRAND, ENGIN_SURFACES.LAB)).toBe(true);
    });

    it('Brand → GameEngin: false', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.BRAND, ENGIN_SURFACES.GAMES)).toBe(false);
    });

    it('Create → ContentEngin: true', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.CREATE, ENGIN_SURFACES.CREATE)).toBe(true);
    });

    it('Create → LabEngin: false', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.CREATE, ENGIN_SURFACES.LAB)).toBe(false);
    });

    it('Lab → LabEngin: true', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.LAB, ENGIN_SURFACES.LAB)).toBe(true);
    });

    it('Lab → CodeEngin: false', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.LAB, ENGIN_SURFACES.CODE)).toBe(false);
    });

    it('Code → CodeEngin: false (Code is a target, not a source)', () => {
      expect(hasConnectionPath(DAYDREAM_DOMAINS.CODE, ENGIN_SURFACES.CODE)).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. dualRuntime
// ─────────────────────────────────────────────────────────────────────────────

describe('dualRuntime', () => {
  // ── DEFAULT_DUAL_RUNTIME ───────────────────────────────────────────────────

  describe('DEFAULT_DUAL_RUNTIME', () => {
    it('surfaceSpaceWorld is HomeDream Surface (canonical)', () => {
      expect(DEFAULT_DUAL_RUNTIME.surfaceSpaceWorld).toBe(SURFACE_NAMES.HOME_DREAM_SURFACE);
      expect(DEFAULT_DUAL_RUNTIME.surfaceSpaceWorld).toBe('HomeDream Surface');
    });

    it('dreamSpaceWorld is DreamSpace (canonical)', () => {
      expect(DEFAULT_DUAL_RUNTIME.dreamSpaceWorld).toBe('DreamSpace');
    });

    it('dominantRegion is Surface Space (canonical)', () => {
      expect(DEFAULT_DUAL_RUNTIME.dominantRegion).toBe('Surface Space');
    });

    it('does NOT use legacy string "home"', () => {
      expect(DEFAULT_DUAL_RUNTIME.surfaceSpaceWorld).not.toBe('home');
    });

    it('does NOT use legacy string "dreamspace"', () => {
      expect(DEFAULT_DUAL_RUNTIME.dreamSpaceWorld).not.toBe('dreamspace');
    });

    it('does NOT have legacy field "topRuntime"', () => {
      // TypeScript enforces this at compile time; ensure at runtime too
      expect('topRuntime' in DEFAULT_DUAL_RUNTIME).toBe(false);
    });

    it('does NOT have legacy field "bottomRuntime"', () => {
      expect('bottomRuntime' in DEFAULT_DUAL_RUNTIME).toBe(false);
    });

    it('does NOT have legacy field "dominantRuntime"', () => {
      expect('dominantRuntime' in DEFAULT_DUAL_RUNTIME).toBe(false);
    });
  });

  // ── setRuntimeWorld ────────────────────────────────────────────────────────

  describe('setRuntimeWorld', () => {
    it('sets surfaceSpaceWorld when runtime is "top"', () => {
      const next = setRuntimeWorld(DEFAULT_DUAL_RUNTIME, 'top', 'DreamSpace');
      expect(next.surfaceSpaceWorld).toBe('DreamSpace');
    });

    it('sets dreamSpaceWorld when runtime is "bottom"', () => {
      const next = setRuntimeWorld(DEFAULT_DUAL_RUNTIME, 'bottom', 'HomeDream Surface');
      expect(next.dreamSpaceWorld).toBe('HomeDream Surface');
    });

    it('returns a new state object', () => {
      const next = setRuntimeWorld(DEFAULT_DUAL_RUNTIME, 'top', 'DreamSpace');
      expect(next).not.toBe(DEFAULT_DUAL_RUNTIME);
    });

    it('preserves dominantRegion when only world changes', () => {
      const next = setRuntimeWorld(DEFAULT_DUAL_RUNTIME, 'bottom', 'DreamSpace');
      expect(next.dominantRegion).toBe(DEFAULT_DUAL_RUNTIME.dominantRegion);
    });

    it('accepts object worlds: dream type', () => {
      const world: RuntimeWorld = { type: 'dream', id: 'dream-123' };
      const next = setRuntimeWorld(DEFAULT_DUAL_RUNTIME, 'top', world);
      expect(next.surfaceSpaceWorld).toEqual({ type: 'dream', id: 'dream-123' });
    });

    it('accepts object worlds: engin type', () => {
      const world: RuntimeWorld = { type: 'engin', name: 'StarMakerEngin' };
      const next = setRuntimeWorld(DEFAULT_DUAL_RUNTIME, 'bottom', world);
      expect(next.dreamSpaceWorld).toEqual({ type: 'engin', name: 'StarMakerEngin' });
    });
  });

  // ── swapDominantRuntime ────────────────────────────────────────────────────

  describe('swapDominantRuntime', () => {
    it('swaps Surface Space → DreamSpace', () => {
      const next = swapDominantRuntime(DEFAULT_DUAL_RUNTIME);
      expect(next.dominantRegion).toBe('DreamSpace');
    });

    it('swaps DreamSpace → Surface Space', () => {
      const dreamDominant = { ...DEFAULT_DUAL_RUNTIME, dominantRegion: 'DreamSpace' as const };
      const next = swapDominantRuntime(dreamDominant);
      expect(next.dominantRegion).toBe('Surface Space');
    });

    it('double-swap returns to original dominant region', () => {
      const once = swapDominantRuntime(DEFAULT_DUAL_RUNTIME);
      const twice = swapDominantRuntime(once);
      expect(twice.dominantRegion).toBe(DEFAULT_DUAL_RUNTIME.dominantRegion);
    });
  });

  // ── makeHomeDreamSpaceActive ───────────────────────────────────────────────

  describe('makeHomeDreamSpaceActive', () => {
    it('sets dreamSpaceWorld to HomeDream Surface', () => {
      const next = makeHomeDreamSpaceActive(DEFAULT_DUAL_RUNTIME);
      expect(next.dreamSpaceWorld).toBe('HomeDream Surface');
    });

    it('sets dominantRegion to DreamSpace', () => {
      const next = makeHomeDreamSpaceActive(DEFAULT_DUAL_RUNTIME);
      expect(next.dominantRegion).toBe('DreamSpace');
    });

    it('preserves surfaceSpaceWorld unchanged', () => {
      const modified = setRuntimeWorld(DEFAULT_DUAL_RUNTIME, 'top', 'DreamSpace');
      const next = makeHomeDreamSpaceActive(modified);
      expect(next.surfaceSpaceWorld).toBe('DreamSpace');
    });

    it('uses canonical surface name (HomeDream Surface)', () => {
      const next = makeHomeDreamSpaceActive(DEFAULT_DUAL_RUNTIME);
      expect(next.dreamSpaceWorld).toBe(SURFACE_NAMES.HOME_DREAM_SURFACE);
    });

    it('enables dual-home state: both regions show HomeDream Surface', () => {
      // Start with default (Surface Space shows HomeDream Surface)
      const dualHome = makeHomeDreamSpaceActive(DEFAULT_DUAL_RUNTIME);
      expect(dualHome.surfaceSpaceWorld).toBe('HomeDream Surface');
      expect(dualHome.dreamSpaceWorld).toBe('HomeDream Surface');
    });

    it('returns a new state object', () => {
      const next = makeHomeDreamSpaceActive(DEFAULT_DUAL_RUNTIME);
      expect(next).not.toBe(DEFAULT_DUAL_RUNTIME);
    });
  });

  // ── makeHomeActiveTop ──────────────────────────────────────────────────────

  describe('makeHomeActiveTop', () => {
    it('sets surfaceSpaceWorld to HomeDream Surface', () => {
      const modified = setRuntimeWorld(DEFAULT_DUAL_RUNTIME, 'top', 'DreamSpace');
      const home = makeHomeActiveTop(modified);
      expect(home.surfaceSpaceWorld).toBe('HomeDream Surface');
    });

    it('sets dominantRegion to Surface Space', () => {
      const dreamDominant = {
        ...DEFAULT_DUAL_RUNTIME,
        dominantRegion: 'DreamSpace' as const,
      };
      const home = makeHomeActiveTop(dreamDominant);
      expect(home.dominantRegion).toBe('Surface Space');
    });

    it('preserves dreamSpaceWorld', () => {
      const world: RuntimeWorld = { type: 'dream', id: 'xyz' };
      const modified = setRuntimeWorld(DEFAULT_DUAL_RUNTIME, 'bottom', world);
      const home = makeHomeActiveTop(modified);
      expect(home.dreamSpaceWorld).toEqual(world);
    });
  });

  // ── isHomeActiveTop ────────────────────────────────────────────────────────

  describe('isHomeActiveTop', () => {
    it('returns true when surfaceSpaceWorld is HomeDream Surface and dominantRegion is Surface Space', () => {
      expect(isHomeActiveTop(DEFAULT_DUAL_RUNTIME)).toBe(true);
    });

    it('returns false when surfaceSpaceWorld is not HomeDream Surface', () => {
      const modified = setRuntimeWorld(DEFAULT_DUAL_RUNTIME, 'top', 'DreamSpace');
      expect(isHomeActiveTop(modified)).toBe(false);
    });

    it('returns false when dominantRegion is DreamSpace even if surfaceSpaceWorld is HomeDream Surface', () => {
      const dreamDominant = {
        ...DEFAULT_DUAL_RUNTIME,
        dominantRegion: 'DreamSpace' as const,
      };
      expect(isHomeActiveTop(dreamDominant)).toBe(false);
    });

    it('returns true after makeHomeActiveTop', () => {
      const modified = {
        ...DEFAULT_DUAL_RUNTIME,
        surfaceSpaceWorld: 'DreamSpace' as const,
        dominantRegion: 'DreamSpace' as const,
      };
      expect(isHomeActiveTop(makeHomeActiveTop(modified))).toBe(true);
    });
  });

  // ── worldsEqual ────────────────────────────────────────────────────────────

  describe('worldsEqual', () => {
    it('two identical canonical string worlds are equal', () => {
      expect(worldsEqual('HomeDream Surface', 'HomeDream Surface')).toBe(true);
    });

    it('different canonical string worlds are not equal', () => {
      expect(worldsEqual('HomeDream Surface', 'DreamSpace')).toBe(false);
    });

    it('canonical vs legacy string is not equal', () => {
      expect(worldsEqual('HomeDream Surface', 'home' as RuntimeWorld)).toBe(false);
      expect(worldsEqual('DreamSpace', 'dreamspace' as RuntimeWorld)).toBe(false);
    });

    it('two identical dream object worlds are equal', () => {
      const a: RuntimeWorld = { type: 'dream', id: 'abc' };
      const b: RuntimeWorld = { type: 'dream', id: 'abc' };
      expect(worldsEqual(a, b)).toBe(true);
    });

    it('dream worlds with different IDs are not equal', () => {
      const a: RuntimeWorld = { type: 'dream', id: 'abc' };
      const b: RuntimeWorld = { type: 'dream', id: 'xyz' };
      expect(worldsEqual(a, b)).toBe(false);
    });

    it('two identical engin object worlds are equal', () => {
      const a: RuntimeWorld = { type: 'engin', name: 'StarMakerEngin' };
      const b: RuntimeWorld = { type: 'engin', name: 'StarMakerEngin' };
      expect(worldsEqual(a, b)).toBe(true);
    });

    it('engin worlds with different names are not equal', () => {
      const a: RuntimeWorld = { type: 'engin', name: 'StarMakerEngin' };
      const b: RuntimeWorld = { type: 'engin', name: 'GameEngin' };
      expect(worldsEqual(a, b)).toBe(false);
    });

    it('two identical custom object worlds are equal', () => {
      const a: RuntimeWorld = { type: 'custom', path: '/my-surface' };
      const b: RuntimeWorld = { type: 'custom', path: '/my-surface' };
      expect(worldsEqual(a, b)).toBe(true);
    });

    it('custom worlds with different paths are not equal', () => {
      const a: RuntimeWorld = { type: 'custom', path: '/surface-a' };
      const b: RuntimeWorld = { type: 'custom', path: '/surface-b' };
      expect(worldsEqual(a, b)).toBe(false);
    });

    it('string vs object world is not equal', () => {
      const a: RuntimeWorld = 'HomeDream Surface';
      const b: RuntimeWorld = { type: 'dream', id: 'abc' };
      expect(worldsEqual(a, b)).toBe(false);
    });

    it('dream vs engin objects of different type are not equal', () => {
      const a: RuntimeWorld = { type: 'dream', id: 'abc' };
      const b: RuntimeWorld = { type: 'engin', name: 'abc' };
      expect(worldsEqual(a, b)).toBe(false);
    });
  });
});
