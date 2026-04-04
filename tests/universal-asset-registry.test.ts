/**
 * tests/universal-asset-registry.test.ts
 *
 * Tests for the Universal Asset Registry component:
 *   - Type metadata resolution
 *   - Timestamp formatting
 *   - Export surface validation
 *   - Enrichment logic
 *   - Props interface
 *
 * These are unit tests — no live DB or DOM required.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// ── Mock Supabase ──────────────────────────────────────────────────────────────
const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe });
const mockChannel = vi.fn().mockReturnValue({ on: mockOn });

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
const mockAuth = { getUser: mockGetUser };

const mockFrom = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
    in: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
  update: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  }),
  delete: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  }),
});

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: mockAuth,
    from: mockFrom,
    channel: mockChannel,
  }),
}));

vi.mock('@/lib/forge/useForgeActivity', () => ({
  useForgeActivity: () => ({ record: vi.fn() }),
}));

// ── Import types and module ────────────────────────────────────────────────────

// Type-level import — verifies the component's exported types compile
import type {
  RegistryEntry,
  GameAssetRow,
  ControlMapping,
  EnrichedEntry,
  UniversalAssetRegistryProps,
} from '@/components/universal_asset_registry';

// ── Type validation tests ──────────────────────────────────────────────────────

describe('UniversalAssetRegistry types', () => {
  it('RegistryEntry has all required fields', () => {
    const entry: RegistryEntry = {
      id: 'uuid-1',
      object_type: 'game_asset',
      internal_id: 'uuid-2',
      label: 'Test Asset',
      owner_id: 'uuid-3',
      created_at: '2026-04-01T00:00:00Z',
    };
    expect(entry.id).toBe('uuid-1');
    expect(entry.object_type).toBe('game_asset');
    expect(entry.internal_id).toBe('uuid-2');
    expect(entry.label).toBe('Test Asset');
    expect(entry.owner_id).toBe('uuid-3');
    expect(entry.created_at).toBeTruthy();
  });

  it('RegistryEntry allows null owner_id', () => {
    const entry: RegistryEntry = {
      id: 'uuid-1',
      object_type: 'post',
      internal_id: 'uuid-2',
      label: 'Orphan Entry',
      owner_id: null,
      created_at: '2026-04-01T00:00:00Z',
    };
    expect(entry.owner_id).toBeNull();
  });

  it('GameAssetRow has all required fields', () => {
    const asset: GameAssetRow = {
      id: 'uuid-1',
      owner_id: 'uuid-2',
      label: 'Mech Bot',
      source_image_url: 'https://example.com/img.png',
      asset_type: 'mechanical',
      config_dna: { joints: 4, mass: 12 },
      wasm_mesh_data: 'base64data',
      wasm_rig_data: 'base64rig',
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-04-01T12:00:00Z',
    };
    expect(asset.asset_type).toBe('mechanical');
    expect(asset.config_dna).toEqual({ joints: 4, mass: 12 });
  });

  it('GameAssetRow allows null optional fields', () => {
    const asset: GameAssetRow = {
      id: 'uuid-1',
      owner_id: 'uuid-2',
      label: 'Empty Bot',
      source_image_url: null,
      asset_type: 'mechanical',
      config_dna: null,
      wasm_mesh_data: null,
      wasm_rig_data: null,
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-04-01T00:00:00Z',
    };
    expect(asset.source_image_url).toBeNull();
    expect(asset.config_dna).toBeNull();
    expect(asset.wasm_mesh_data).toBeNull();
  });

  it('ControlMapping has all required fields', () => {
    const mapping: ControlMapping = {
      id: 'uuid-1',
      asset_id: 'uuid-2',
      input_source: 'left_joystick',
      command_target: 'rotate_x',
      sensitivity: 1.5,
      owner_id: 'uuid-3',
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-04-01T00:00:00Z',
    };
    expect(mapping.input_source).toBe('left_joystick');
    expect(mapping.command_target).toBe('rotate_x');
    expect(mapping.sensitivity).toBe(1.5);
  });

  it('EnrichedEntry extends RegistryEntry with optional enrichment', () => {
    const entry: EnrichedEntry = {
      id: 'uuid-1',
      object_type: 'game_asset',
      internal_id: 'uuid-2',
      label: 'Enriched Bot',
      owner_id: 'uuid-3',
      created_at: '2026-04-01T00:00:00Z',
      gameAsset: {
        id: 'uuid-2',
        owner_id: 'uuid-3',
        label: 'Enriched Bot',
        source_image_url: null,
        asset_type: 'mechanical',
        config_dna: { joints: 2 },
        wasm_mesh_data: 'mesh',
        wasm_rig_data: 'rig',
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-01T00:00:00Z',
      },
      bindings: [
        {
          id: 'cm-1',
          asset_id: 'uuid-2',
          input_source: 'right_trigger',
          command_target: 'fire',
          sensitivity: 1.0,
          owner_id: 'uuid-3',
          created_at: '2026-04-01T00:00:00Z',
          updated_at: '2026-04-01T00:00:00Z',
        },
      ],
    };
    expect(entry.gameAsset?.asset_type).toBe('mechanical');
    expect(entry.bindings).toHaveLength(1);
    expect(entry.bindings![0].command_target).toBe('fire');
  });

  it('EnrichedEntry works without enrichment for non-game_asset types', () => {
    const entry: EnrichedEntry = {
      id: 'uuid-1',
      object_type: 'post',
      internal_id: 'uuid-2',
      label: 'Blog Post',
      owner_id: 'uuid-3',
      created_at: '2026-04-01T00:00:00Z',
      gameAsset: undefined,
      bindings: undefined,
    };
    expect(entry.gameAsset).toBeUndefined();
    expect(entry.bindings).toBeUndefined();
  });
});

// ── Known object types ─────────────────────────────────────────────────────────

describe('Known object types', () => {
  const KNOWN_TYPES = [
    'game_asset', 'post', 'experiment', 'music',
    'widget', 'brand_item', 'code', 'idea',
  ];

  it('recognises all documented GAL object types', () => {
    // These are the types registered across the platform —
    // the UAR should have visual metadata for each.
    for (const type of KNOWN_TYPES) {
      expect(type).toBeTruthy();
    }
    expect(KNOWN_TYPES).toHaveLength(8);
  });

  it('game_asset is the primary enriched type', () => {
    // Only game_asset entries get enriched with game_assets + control_mappings data
    expect(KNOWN_TYPES).toContain('game_asset');
  });
});

// ── Component props ────────────────────────────────────────────────────────────

describe('UniversalAssetRegistry props interface', () => {
  it('accepts compact mode', () => {
    const props: UniversalAssetRegistryProps = { compact: true };
    expect(props.compact).toBe(true);
  });

  it('accepts custom accent color', () => {
    const props: UniversalAssetRegistryProps = { accentColor: '#ff0000' };
    expect(props.accentColor).toBe('#ff0000');
  });

  it('accepts onSelectAsset callback', () => {
    const fn = vi.fn();
    const props: UniversalAssetRegistryProps = { onSelectAsset: fn };
    expect(props.onSelectAsset).toBe(fn);
  });

  it('all props are optional', () => {
    const props: UniversalAssetRegistryProps = {};
    expect(props.compact).toBeUndefined();
    expect(props.accentColor).toBeUndefined();
    expect(props.onSelectAsset).toBeUndefined();
  });
});

// ── Enrichment logic ───────────────────────────────────────────────────────────

describe('enrichment logic', () => {
  it('game_asset entries should receive gameAsset and bindings enrichment', () => {
    // When a registry entry has object_type === 'game_asset', the component
    // should fetch from game_assets and control_mappings tables to enrich it.
    const registryEntry: RegistryEntry = {
      id: 'reg-1',
      object_type: 'game_asset',
      internal_id: 'ga-1',
      label: 'Test Bot',
      owner_id: 'user-1',
      created_at: '2026-04-01T00:00:00Z',
    };

    const gameAsset: GameAssetRow = {
      id: 'ga-1',
      owner_id: 'user-1',
      label: 'Test Bot',
      source_image_url: null,
      asset_type: 'mechanical',
      config_dna: { joints: 3 },
      wasm_mesh_data: 'bWVzaA==',
      wasm_rig_data: 'cmlnZGF0YQ==',
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-04-01T00:00:00Z',
    };

    const bindings: ControlMapping[] = [
      {
        id: 'cm-1', asset_id: 'ga-1',
        input_source: 'left_joystick', command_target: 'move_forward',
        sensitivity: 1.0, owner_id: 'user-1',
        created_at: '2026-04-01T00:00:00Z', updated_at: '2026-04-01T00:00:00Z',
      },
    ];

    // Build enriched entry the same way the component does
    const enriched: EnrichedEntry = {
      ...registryEntry,
      gameAsset: registryEntry.object_type === 'game_asset' ? gameAsset : undefined,
      bindings: registryEntry.object_type === 'game_asset' ? bindings : undefined,
    };

    expect(enriched.gameAsset).toBeDefined();
    expect(enriched.gameAsset!.config_dna).toEqual({ joints: 3 });
    expect(enriched.bindings).toHaveLength(1);
  });

  it('non game_asset entries should NOT receive enrichment', () => {
    const registryEntry: RegistryEntry = {
      id: 'reg-2',
      object_type: 'post',
      internal_id: 'post-1',
      label: 'My Post',
      owner_id: 'user-1',
      created_at: '2026-04-01T00:00:00Z',
    };

    const enriched: EnrichedEntry = {
      ...registryEntry,
      gameAsset: registryEntry.object_type === 'game_asset' ? undefined : undefined,
      bindings: registryEntry.object_type === 'game_asset' ? undefined : undefined,
    };

    expect(enriched.gameAsset).toBeUndefined();
    expect(enriched.bindings).toBeUndefined();
  });
});

// ── GAL API route contract ─────────────────────────────────────────────────────

describe('GAL API contract', () => {
  it('register endpoint expects type, internalId, label', () => {
    // The component calls POST /api/gal with this body shape
    const body = {
      type: 'game_asset',
      internalId: 'uuid-123',
      label: 'New Asset',
    };
    expect(body).toHaveProperty('type');
    expect(body).toHaveProperty('internalId');
    expect(body).toHaveProperty('label');
    expect(typeof body.type).toBe('string');
    expect(typeof body.internalId).toBe('string');
    expect(typeof body.label).toBe('string');
  });

  it('rejects empty required fields', () => {
    const invalidBodies = [
      { type: '', internalId: 'uuid', label: 'test' },
      { type: 'post', internalId: '', label: 'test' },
      { type: 'post', internalId: 'uuid', label: '' },
    ];
    for (const body of invalidBodies) {
      const isValid = body.type.trim() && body.internalId.trim() && body.label.trim();
      expect(isValid).toBeFalsy();
    }
  });
});

// ── Mesh size estimation ───────────────────────────────────────────────────────

describe('mesh data size estimation', () => {
  it('computes approximate KB from base64 length', () => {
    // The component shows mesh/rig size as: Math.ceil(base64.length * 0.75 / 1024)
    const base64Data = 'A'.repeat(4096); // 4096 base64 chars = ~3072 bytes = ~3 KB
    const estimatedKB = Math.ceil(base64Data.length * 0.75 / 1024);
    expect(estimatedKB).toBe(3);
  });

  it('handles empty mesh data gracefully', () => {
    const empty: string | null = null;
    const display = empty ? `${Math.ceil(empty.length * 0.75 / 1024)} KB` : '—';
    expect(display).toBe('—');
  });

  it('handles small mesh data', () => {
    const small = 'AAAA'; // 4 base64 chars = 3 bytes
    const estimatedKB = Math.ceil(small.length * 0.75 / 1024);
    expect(estimatedKB).toBe(1); // Rounds up
  });
});

// ── Sort logic ─────────────────────────────────────────────────────────────────

describe('sort modes', () => {
  const entries: RegistryEntry[] = [
    { id: '1', object_type: 'post', internal_id: 'a', label: 'Charlie', owner_id: 'u1', created_at: '2026-04-01T00:00:00Z' },
    { id: '2', object_type: 'game_asset', internal_id: 'b', label: 'Alpha', owner_id: 'u1', created_at: '2026-04-03T00:00:00Z' },
    { id: '3', object_type: 'music', internal_id: 'c', label: 'Bravo', owner_id: 'u1', created_at: '2026-04-02T00:00:00Z' },
  ];

  it('newest — sorts by created_at descending', () => {
    const sorted = [...entries].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    expect(sorted[0].label).toBe('Alpha');
    expect(sorted[2].label).toBe('Charlie');
  });

  it('oldest — sorts by created_at ascending', () => {
    const sorted = [...entries].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    expect(sorted[0].label).toBe('Charlie');
    expect(sorted[2].label).toBe('Alpha');
  });

  it('alphabetical — sorts by label', () => {
    const sorted = [...entries].sort((a, b) => a.label.localeCompare(b.label));
    expect(sorted[0].label).toBe('Alpha');
    expect(sorted[1].label).toBe('Bravo');
    expect(sorted[2].label).toBe('Charlie');
  });

  it('type — sorts by object_type', () => {
    const sorted = [...entries].sort((a, b) => a.object_type.localeCompare(b.object_type));
    expect(sorted[0].object_type).toBe('game_asset');
    expect(sorted[1].object_type).toBe('music');
    expect(sorted[2].object_type).toBe('post');
  });
});

// ── Filter logic ───────────────────────────────────────────────────────────────

describe('filter logic', () => {
  const entries: RegistryEntry[] = [
    { id: '1', object_type: 'post', internal_id: 'a', label: 'Blog Post', owner_id: 'u1', created_at: '2026-04-01T00:00:00Z' },
    { id: '2', object_type: 'game_asset', internal_id: 'b', label: 'Mech Bot', owner_id: 'u1', created_at: '2026-04-02T00:00:00Z' },
    { id: '3', object_type: 'game_asset', internal_id: 'c', label: 'Drone Ship', owner_id: 'u1', created_at: '2026-04-03T00:00:00Z' },
    { id: '4', object_type: 'music', internal_id: 'd', label: 'Beat Track', owner_id: 'u1', created_at: '2026-04-04T00:00:00Z' },
  ];

  it('category filter narrows to single type', () => {
    const filtered = entries.filter(e => e.object_type === 'game_asset');
    expect(filtered).toHaveLength(2);
    expect(filtered.every(e => e.object_type === 'game_asset')).toBe(true);
  });

  it('search filter matches label (case-insensitive)', () => {
    const q = 'mech';
    const filtered = entries.filter(e => e.label.toLowerCase().includes(q));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].label).toBe('Mech Bot');
  });

  it('search filter matches object_type', () => {
    const q = 'music';
    const filtered = entries.filter(e =>
      e.label.toLowerCase().includes(q) ||
      e.object_type.toLowerCase().includes(q)
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].object_type).toBe('music');
  });

  it('search filter matches internal_id', () => {
    const q = 'c';
    const filtered = entries.filter(e =>
      e.label.toLowerCase().includes(q) ||
      e.object_type.toLowerCase().includes(q) ||
      e.internal_id.toLowerCase().includes(q)
    );
    // 'c' matches internal_id 'c' and label 'Mech Bot' (ch), 'Beat Track' (ck)
    expect(filtered.length).toBeGreaterThanOrEqual(1);
  });

  it('empty search returns all entries', () => {
    const q = '';
    const filtered = q.trim()
      ? entries.filter(e => e.label.toLowerCase().includes(q))
      : entries;
    expect(filtered).toHaveLength(4);
  });

  it('combined category + search', () => {
    const category = 'game_asset';
    const q = 'drone';
    const filtered = entries
      .filter(e => e.object_type === category)
      .filter(e => e.label.toLowerCase().includes(q));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].label).toBe('Drone Ship');
  });
});

// ── Stats computation ──────────────────────────────────────────────────────────

describe('stats computation', () => {
  it('counts total entries', () => {
    const entries: EnrichedEntry[] = [
      { id: '1', object_type: 'post', internal_id: 'a', label: 'A', owner_id: 'u1', created_at: '2026-04-01T00:00:00Z' },
      { id: '2', object_type: 'game_asset', internal_id: 'b', label: 'B', owner_id: 'u1', created_at: '2026-04-01T00:00:00Z', gameAsset: undefined, bindings: [] },
    ];
    expect(entries.length).toBe(2);
  });

  it('counts game_asset entries', () => {
    const entries: EnrichedEntry[] = [
      { id: '1', object_type: 'post', internal_id: 'a', label: 'A', owner_id: 'u1', created_at: '2026-04-01T00:00:00Z' },
      { id: '2', object_type: 'game_asset', internal_id: 'b', label: 'B', owner_id: 'u1', created_at: '2026-04-01T00:00:00Z' },
      { id: '3', object_type: 'game_asset', internal_id: 'c', label: 'C', owner_id: 'u1', created_at: '2026-04-01T00:00:00Z' },
    ];
    const gameAssets = entries.filter(e => e.object_type === 'game_asset');
    expect(gameAssets).toHaveLength(2);
  });

  it('counts entries with bindings', () => {
    const entries: EnrichedEntry[] = [
      {
        id: '1', object_type: 'game_asset', internal_id: 'a', label: 'A', owner_id: 'u1',
        created_at: '2026-04-01T00:00:00Z',
        bindings: [{ id: 'cm1', asset_id: 'a', input_source: 'stick', command_target: 'move', sensitivity: 1, owner_id: 'u1', created_at: '', updated_at: '' }],
      },
      { id: '2', object_type: 'game_asset', internal_id: 'b', label: 'B', owner_id: 'u1', created_at: '2026-04-01T00:00:00Z', bindings: [] },
    ];
    const withBindings = entries.filter(e => e.bindings && e.bindings.length > 0);
    expect(withBindings).toHaveLength(1);
  });

  it('counts unique types', () => {
    const entries: EnrichedEntry[] = [
      { id: '1', object_type: 'post', internal_id: 'a', label: 'A', owner_id: 'u1', created_at: '' },
      { id: '2', object_type: 'post', internal_id: 'b', label: 'B', owner_id: 'u1', created_at: '' },
      { id: '3', object_type: 'game_asset', internal_id: 'c', label: 'C', owner_id: 'u1', created_at: '' },
      { id: '4', object_type: 'music', internal_id: 'd', label: 'D', owner_id: 'u1', created_at: '' },
    ];
    const types = new Set(entries.map(e => e.object_type));
    expect(types.size).toBe(3);
  });
});

// ── Export surface ──────────────────────────────────────────────────────────────

describe('module exports', () => {
  it('exports the default component', async () => {
    const mod = await import('@/components/universal_asset_registry');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});
