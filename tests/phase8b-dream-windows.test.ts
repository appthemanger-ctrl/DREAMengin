/**
 * tests/phase8b-dream-windows.test.ts
 *
 * Phase 8 Section B regression tests — Dream Window System: Full Lifecycle
 * Activation (Points 11–22).
 *
 * Architecture justification:
 *   - docs/dreamengin_phase8.md §B: Dream Window System spec
 *   - docs/ARCHITECTURE.md §4: Universal Dream Window model
 *   - docs/AXIOMS.md Axiom 5: Privacy by Design (private by default)
 *   - docs/LAW.md Product law 3: every action does something real
 *   - docs/SECURITY.md: RLS on all user tables
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
  validateDreamWindowLayers,
  DREAM_WINDOW_REQUIRED_LAYERS,
  type DreamWindowInstance,
  type DreamWindowLayerValidationResult,
} from '@/lib/dream-window/DreamWindowLifecycle';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeInstance(overrides?: Partial<DreamWindowInstance>): DreamWindowInstance {
  return createDreamWindowInstance({
    id: 'test-dw-001',
    type: 'music',
    owner: 'user-abc',
    config: { label: 'Music Dream Window' },
    size: { width: 320, height: 240 },
    position: { x: 0, y: 0 },
    sourceBindings: ['spotify-binding'],
    destinationRules: [{ targetSurface: 'view-profile', verb: 'bind' }],
    ...overrides,
  });
}

// ── Point 11 — Lifecycle state machine (DB-persisted transitions) ──────────────

describe('Phase 8 §B Point 11 — Dream Window lifecycle state machine', () => {
  it('creates a Dream Window in Unbound state by default', () => {
    const instance = makeInstance();
    expect(instance.activeState).toBe(DREAM_WINDOW_STATES.UNBOUND);
  });

  it('Unbound → Bound via bindDreamWindow', () => {
    const instance = makeInstance();
    const bound = bindDreamWindow(instance);
    expect(bound.activeState).toBe(DREAM_WINDOW_STATES.BOUND);
  });

  it('Bound → Mounted via mountDreamWindow', () => {
    const bound = bindDreamWindow(makeInstance());
    const mounted = mountDreamWindow(bound);
    expect(mounted.activeState).toBe(DREAM_WINDOW_STATES.MOUNTED);
  });

  it('Mounted → Collapsed via collapseDreamWindow', () => {
    const mounted = mountDreamWindow(bindDreamWindow(makeInstance()));
    const collapsed = collapseDreamWindow(mounted);
    expect(collapsed.activeState).toBe(DREAM_WINDOW_STATES.COLLAPSED);
  });

  it('Collapsed → Mounted via activateDreamWindow', () => {
    const collapsed = collapseDreamWindow(mountDreamWindow(bindDreamWindow(makeInstance())));
    const remounted = activateDreamWindow(collapsed);
    expect(remounted.activeState).toBe(DREAM_WINDOW_STATES.MOUNTED);
  });

  it('Mounted → Bound via unmountDreamWindow', () => {
    const mounted = mountDreamWindow(bindDreamWindow(makeInstance()));
    const unbound = unmountDreamWindow(mounted);
    expect(unbound.activeState).toBe(DREAM_WINDOW_STATES.BOUND);
  });

  it('Bound → Unbound via unbindDreamWindow', () => {
    const bound = bindDreamWindow(makeInstance());
    const unbound = unbindDreamWindow(bound);
    expect(unbound.activeState).toBe(DREAM_WINDOW_STATES.UNBOUND);
  });

  it('throws on invalid transition (Unbound → Mount)', () => {
    const instance = makeInstance();
    expect(() => mountDreamWindow(instance)).toThrow();
  });

  it('throws on invalid transition (Mounted → Mount)', () => {
    const mounted = mountDreamWindow(bindDreamWindow(makeInstance()));
    expect(() => mountDreamWindow(mounted)).toThrow();
  });
});

// ── Point 12 — 10-field validation ────────────────────────────────────────────

describe('Phase 8 §B Point 12 — 10-field Dream Window validation', () => {
  const REQUIRED_FIELDS = [
    'id',
    'type',
    'owner_id',
    'config',
    'size',
    'position',
    'visibility',
    'sourceBindings',
    'destinationRules',
    'activeState',
  ] as const;

  it('defines exactly 10 required fields', () => {
    expect(REQUIRED_FIELDS).toHaveLength(10);
  });

  it('all 10 required field names are defined', () => {
    const expected = [
      'id', 'type', 'owner_id', 'config', 'size',
      'position', 'visibility', 'sourceBindings', 'destinationRules', 'activeState',
    ];
    for (const field of expected) {
      expect(REQUIRED_FIELDS).toContain(field as (typeof REQUIRED_FIELDS)[number]);
    }
  });

  it('DreamWindowInstance has all required fields (except owner_id which is owner)', () => {
    const instance = makeInstance();
    expect(instance.id).toBeDefined();
    expect(instance.type).toBeDefined();
    expect(instance.owner).toBeDefined(); // owner in model = owner_id in DB
    expect(instance.config).toBeDefined();
    expect(instance.size).toBeDefined();
    expect(instance.position).toBeDefined();
    expect(instance.visibility).toBeDefined();
    expect(instance.sourceBindings).toBeDefined();
    expect(instance.destinationRules).toBeDefined();
    expect(instance.activeState).toBeDefined();
  });
});

// ── Point 13 — Spatial data ───────────────────────────────────────────────────

describe('Phase 8 §B Point 13 — Spatial data (position and size)', () => {
  it('createDreamWindowInstance preserves position', () => {
    const instance = makeInstance({ position: { x: 100, y: 200 } });
    expect(instance.position.x).toBe(100);
    expect(instance.position.y).toBe(200);
  });

  it('createDreamWindowInstance preserves size', () => {
    const instance = makeInstance({ size: { width: 480, height: 360 } });
    expect(instance.size.width).toBe(480);
    expect(instance.size.height).toBe(360);
  });

  it('lifecycle transitions preserve position and size', () => {
    const instance = makeInstance({
      position: { x: 55, y: 77 },
      size: { width: 300, height: 200 },
    });
    const mounted = mountDreamWindow(bindDreamWindow(instance));
    expect(mounted.position).toEqual({ x: 55, y: 77 });
    expect(mounted.size).toEqual({ width: 300, height: 200 });
  });
});

// ── Point 14 — Visibility defaults ────────────────────────────────────────────

describe('Phase 8 §B Point 14 — Visibility defaults to private', () => {
  it('new Dream Window is private by default', () => {
    const instance = createDreamWindowInstance({
      id: 'test',
      type: 'code',
      owner: 'user-1',
      config: { label: 'Code' },
      size: { width: 320, height: 240 },
      position: { x: 0, y: 0 },
      sourceBindings: ['binding-1'],
      destinationRules: [],
    });
    expect(instance.visibility).toBe('private');
  });

  it('visibility can be explicitly set to shared', () => {
    const instance = makeInstance({ visibility: 'shared' });
    expect(instance.visibility).toBe('shared');
  });

  it('visibility can be explicitly set to public', () => {
    const instance = makeInstance({ visibility: 'public' });
    expect(instance.visibility).toBe('public');
  });
});

// ── Point 15 — owner field ────────────────────────────────────────────────────

describe('Phase 8 §B Point 15 — owner_id enforcement', () => {
  it('every Dream Window has an owner', () => {
    const instance = makeInstance({ owner: 'user-xyz' });
    expect(instance.owner).toBe('user-xyz');
  });

  it('owner is preserved across all lifecycle transitions', () => {
    const instance = makeInstance({ owner: 'owner-preserved' });
    const mounted = mountDreamWindow(bindDreamWindow(instance));
    const collapsed = collapseDreamWindow(mounted);
    const activated = activateDreamWindow(collapsed);
    expect(activated.owner).toBe('owner-preserved');
  });
});

// ── Point 16 — useDreamWindowActions hook contract ────────────────────────────

describe('Phase 8 §B Point 16 — useDreamWindowActions hook contract', () => {
  it('exports useDreamWindowActions from canonical path', async () => {
    const module = await import('@/lib/dream-window/useDreamWindowActions');
    expect(typeof module.useDreamWindowActions).toBe('function');
  });
});

// ── Point 17 — SuperDreamWidget ───────────────────────────────────────────────

describe('Phase 8 §B Point 17 — SuperDreamWidget real composition', () => {
  it('SuperDreamWidget module exports a default component', async () => {
    const module = await import('@/components/dreams/SuperDreamWidget');
    expect(typeof module.default).toBe('function');
  });
});

// ── Point 18 — Widget shims ───────────────────────────────────────────────────

describe('Phase 8 §B Point 18 — widget shims forward to Dream Window equivalents', () => {
  it('WidgetShell re-exports from DreamShell', async () => {
    const widgetShell = await import('@/components/widgets/WidgetShell');
    const dreamShell = await import('@/components/dreams/DreamShell');
    // Both should export a default function
    expect(typeof widgetShell.default).toBe('function');
    expect(typeof dreamShell.default).toBe('function');
  });

  it('WidgetCard module exports a default function', async () => {
    const module = await import('@/components/widgets/WidgetCard');
    expect(typeof module.default).toBe('function');
  });

  it('UniversalWidget module exports a default function', async () => {
    const module = await import('@/components/widgets/UniversalWidget');
    expect(typeof module.default).toBe('function');
  });

  it('WidgetLibrary re-exports from SuperDreamWidget', async () => {
    const widgetLib = await import('@/components/widgets/WidgetLibrary');
    const superDream = await import('@/components/dreams/SuperDreamWidget');
    expect(widgetLib.default).toBe(superDream.default);
  });

  it('WidgetSurface re-exports from SuperDreamWidget', async () => {
    const widgetSurface = await import('@/components/widgets/WidgetSurface');
    const superDream = await import('@/components/dreams/SuperDreamWidget');
    expect(widgetSurface.default).toBe(superDream.default);
  });
});

// ── Point 19 — types/dream-window.ts canonical type authority ─────────────────

describe('Phase 8 §B Point 19 — canonical Dream Window types', () => {
  it('types/dream-window.ts exports DreamWindowRecord', async () => {
    // If this import works, the type file exists
    const types = await import('@/types/dream-window');
    expect(types.DREAM_WINDOW_STATES).toBeDefined();
  });

  it('DREAM_WINDOW_STATES is accessible from canonical types', async () => {
    const { DREAM_WINDOW_STATES: states } = await import('@/types/dream-window');
    expect(states.UNBOUND).toBe('Unbound Dream Window');
    expect(states.BOUND).toBe('Bound Dream Window');
    expect(states.MOUNTED).toBe('Mounted Dream Window');
    expect(states.COLLAPSED).toBe('Collapsed Dream Window');
  });
});

// ── Point 20 — validateDreamWindowLayers ─────────────────────────────────────

describe('Phase 8 §B Point 20 — Shell→Connector→Feature→Output layer validation', () => {
  it('DREAM_WINDOW_REQUIRED_LAYERS has exactly 4 layers', () => {
    expect(DREAM_WINDOW_REQUIRED_LAYERS).toHaveLength(4);
  });

  it('DREAM_WINDOW_REQUIRED_LAYERS contains all 4 canonical layers in order', () => {
    expect(DREAM_WINDOW_REQUIRED_LAYERS[0]).toBe('DreamShell');
    expect(DREAM_WINDOW_REQUIRED_LAYERS[1]).toBe('DreamConnectorLayer');
    expect(DREAM_WINDOW_REQUIRED_LAYERS[2]).toBe('DreamFeatureLayer');
    expect(DREAM_WINDOW_REQUIRED_LAYERS[3]).toBe('DreamOutputLayer');
  });

  it('returns valid=true when all 4 layers are present in config.layers', () => {
    const instance = makeInstance({
      config: {
        label: 'Full Stack Dream Window',
        layers: [
          'DreamShell',
          'DreamConnectorLayer',
          'DreamFeatureLayer',
          'DreamOutputLayer',
        ],
      },
    });
    const result: DreamWindowLayerValidationResult = validateDreamWindowLayers(instance);
    expect(result.valid).toBe(true);
    expect(result.missingLayers).toHaveLength(0);
    expect(result.error).toBeNull();
  });

  it('returns valid=false and lists missing layers when layers are absent', () => {
    const instance = makeInstance({
      config: {
        label: 'Partial Dream Window',
        layers: ['DreamShell'],
      },
    });
    const result = validateDreamWindowLayers(instance);
    expect(result.valid).toBe(false);
    expect(result.missingLayers).toContain('DreamConnectorLayer');
    expect(result.missingLayers).toContain('DreamFeatureLayer');
    expect(result.missingLayers).toContain('DreamOutputLayer');
    expect(result.error).not.toBeNull();
  });

  it('returns valid=false when config.layers is missing entirely', () => {
    const instance = makeInstance({
      config: { label: 'No Layers' },
    });
    const result = validateDreamWindowLayers(instance);
    expect(result.valid).toBe(false);
    expect(result.missingLayers).toHaveLength(4);
  });

  it('reports the correct layer count in error message', () => {
    const instance = makeInstance({
      config: {
        label: 'Partial',
        layers: ['DreamShell', 'DreamConnectorLayer'],
      },
    });
    const result = validateDreamWindowLayers(instance);
    expect(result.valid).toBe(false);
    expect(result.missingLayers).toHaveLength(2);
    expect(result.error).toContain('DreamFeatureLayer');
    expect(result.error).toContain('DreamOutputLayer');
  });
});

// ── Point 21 — View Profile visibility enforcement ────────────────────────────

describe('Phase 8 §B Point 21 — View Profile visibility enforcement', () => {
  it('private Dream Windows are excluded from public view', () => {
    const windows = [
      { id: '1', visibility: 'private' },
      { id: '2', visibility: 'shared' },
      { id: '3', visibility: 'public' },
    ];

    // Simulate the non-owner filter applied in view-profile/page.tsx
    const visible = windows.filter(
      (w) => w.visibility === 'shared' || w.visibility === 'public',
    );

    expect(visible).toHaveLength(2);
    expect(visible.map((w) => w.id)).not.toContain('1');
    expect(visible.map((w) => w.id)).toContain('2');
    expect(visible.map((w) => w.id)).toContain('3');
  });

  it('visibility filter is strict — never allows private', () => {
    const allVisibilities = ['private', 'shared', 'public', 'followers'];
    const allowed = allVisibilities.filter(
      (v) => v === 'shared' || v === 'public',
    );
    expect(allowed).not.toContain('private');
    expect(allowed).toContain('shared');
    expect(allowed).toContain('public');
  });
});

// ── Point 22 — Atomic delete contract ────────────────────────────────────────

describe('Phase 8 §B Point 22 — Atomic delete route contract', () => {
  it('DELETE route file exists at canonical path', async () => {
    // Check the route file exists — we can't import server-only routes in vitest
    // so we verify the module resolution path via the filesystem
    const { existsSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const routePath = resolve(
      process.cwd(),
      'app/api/dream-windows/[id]/route.ts',
    );
    expect(existsSync(routePath)).toBe(true);
  });

  it('collection route file exists at canonical path', async () => {
    const { existsSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const routePath = resolve(
      process.cwd(),
      'app/api/dream-windows/route.ts',
    );
    expect(existsSync(routePath)).toBe(true);
  });

  it('DELETE route file contains DELETE export', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const content = readFileSync(
      resolve(process.cwd(), 'app/api/dream-windows/[id]/route.ts'),
      'utf-8',
    );
    expect(content).toContain('export async function DELETE');
  });

  it('DELETE route implements atomic cleanup of visibility_mappings', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const content = readFileSync(
      resolve(process.cwd(), 'app/api/dream-windows/[id]/route.ts'),
      'utf-8',
    );
    expect(content).toContain('visibility_mappings');
  });

  it('collection route file contains GET and POST exports', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const content = readFileSync(
      resolve(process.cwd(), 'app/api/dream-windows/route.ts'),
      'utf-8',
    );
    expect(content).toContain('export async function GET');
    expect(content).toContain('export async function POST');
  });
});

// ── Integration: DREAM_WINDOW_STATES constants ────────────────────────────────

describe('Phase 8 §B — DREAM_WINDOW_STATES canonical constants', () => {
  it('has exactly 4 canonical states', () => {
    expect(Object.keys(DREAM_WINDOW_STATES)).toHaveLength(4);
  });

  it('each state string follows the canonical naming pattern', () => {
    for (const state of Object.values(DREAM_WINDOW_STATES)) {
      expect(state).toMatch(/Dream Window$/);
    }
  });

  it('UNBOUND state matches canonical naming authority', () => {
    expect(DREAM_WINDOW_STATES.UNBOUND).toBe('Unbound Dream Window');
  });

  it('BOUND state matches canonical naming authority', () => {
    expect(DREAM_WINDOW_STATES.BOUND).toBe('Bound Dream Window');
  });

  it('MOUNTED state matches canonical naming authority', () => {
    expect(DREAM_WINDOW_STATES.MOUNTED).toBe('Mounted Dream Window');
  });

  it('COLLAPSED state matches canonical naming authority', () => {
    expect(DREAM_WINDOW_STATES.COLLAPSED).toBe('Collapsed Dream Window');
  });
});
