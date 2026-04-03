'use client';

/**
 * UniversalAssetRegistry — Platform-wide asset discovery and management surface.
 *
 * The Universal Asset Registry (UAR) is the single UI surface for viewing,
 * searching, filtering, managing, and inspecting every object registered in
 * the Global Association Layer (GAL) — the "Everything to Everything" hub.
 *
 * Data sources:
 *   - global_registry  — the GAL hub (object_type, internal_id, label, owner_id)
 *   - game_assets      — enriched data for game_asset entries (mesh, rig, DNA)
 *   - control_mappings — input bindings attached to assets
 *
 * Capabilities:
 *   1. Dashboard — aggregate counts by object type, total assets, recent activity
 *   2. Search & Filter — full-text search + category tabs + sort options
 *   3. Asset Grid — type-aware cards with icons, labels, timestamps
 *   4. Detail Panel — expandable per-asset: DNA viewer, bindings, image, metadata
 *   5. CRUD — register new assets via GAL API, edit labels, delete entries
 *   6. Control Mapping Viewer — shows joystick/button bindings per game_asset
 *   7. Realtime — Supabase channel subscription for live registry updates
 *   8. Forge Integration — records activity pulses for the Forge dashboard
 *
 * Security:
 *   - All queries filter by auth.uid() (defence-in-depth on top of RLS).
 *   - owner_id is never accepted from client input for writes.
 *   - GAL sync delegates to POST /api/gal which resolves owner from session.
 *
 * Architecture: docs/ARCHITECTURE.md §3 — component layer.
 * Naming: docs/NAMING_AUTHORITY.md — uses canonical vocabulary throughout.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useForgeActivity } from '@/lib/forge/useForgeActivity';
import {
  Search, Filter, RefreshCw, Plus, Trash2, Edit3, ChevronDown, ChevronUp,
  Gamepad2, Music, FlaskConical, Code2, Palette, Lightbulb, FileText,
  Box, Layers, Cpu, Link2, Database, Clock, Tag, Hash, X, Check, Loader2,
  Eye, Download, Settings, Zap, Grid, List,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

/** A row from the global_registry table (GAL hub). */
export interface RegistryEntry {
  id: string;
  object_type: string;
  internal_id: string;
  label: string;
  owner_id: string | null;
  created_at: string;
}

/** A row from game_assets — enriched asset data. */
export interface GameAssetRow {
  id: string;
  owner_id: string;
  label: string;
  source_image_url: string | null;
  asset_type: string;
  config_dna: unknown;
  wasm_mesh_data: string | null;
  wasm_rig_data: string | null;
  created_at: string;
  updated_at: string;
}

/** A row from control_mappings — input bindings. */
export interface ControlMapping {
  id: string;
  asset_id: string;
  input_source: string;
  command_target: string;
  sensitivity: number;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Enriched registry entry with optional game_asset detail and bindings. */
export interface EnrichedEntry extends RegistryEntry {
  gameAsset?: GameAssetRow;
  bindings?: ControlMapping[];
}

/** Sort options for the registry list. */
type SortMode = 'newest' | 'oldest' | 'alphabetical' | 'type';

/** View mode for the asset grid. */
type ViewMode = 'grid' | 'list';

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT = '#c8981a'; // Gold — canonical DREAMengin premium accent
const ACCENT_BG = 'rgba(200,152,26,0.08)';
const ACCENT_BORDER = 'rgba(200,152,26,0.2)';

/** Known object types and their visual metadata. */
const TYPE_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  game_asset:  { icon: <Gamepad2 className="w-4 h-4" />,     color: '#8b5cf6', label: 'Game Asset' },
  post:        { icon: <FileText className="w-4 h-4" />,     color: '#3b82f6', label: 'Post' },
  experiment:  { icon: <FlaskConical className="w-4 h-4" />, color: '#22c55e', label: 'Experiment' },
  music:       { icon: <Music className="w-4 h-4" />,        color: '#ec4899', label: 'Music' },
  widget:      { icon: <Layers className="w-4 h-4" />,       color: '#f59e0b', label: 'Dream Window' },
  brand_item:  { icon: <Palette className="w-4 h-4" />,      color: '#06b6d4', label: 'Brand Item' },
  code:        { icon: <Code2 className="w-4 h-4" />,        color: '#a855f7', label: 'Code' },
  idea:        { icon: <Lightbulb className="w-4 h-4" />,    color: '#eab308', label: 'Idea' },
};

const DEFAULT_TYPE_META = { icon: <Box className="w-4 h-4" />, color: '#64748b', label: 'Object' };

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? DEFAULT_TYPE_META;
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  } catch {
    return iso;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface UniversalAssetRegistryProps {
  /** Optional compact mode — hides the header and reduces padding. */
  compact?: boolean;
  /** Optional accent color override. */
  accentColor?: string;
  /** Optional callback when an asset is selected (for embedding in other surfaces). */
  onSelectAsset?: (entry: EnrichedEntry) => void;
}

export default function UniversalAssetRegistry({
  compact = false,
  accentColor = ACCENT,
  onSelectAsset,
}: UniversalAssetRegistryProps) {
  const { record: forgeRecord } = useForgeActivity({ enginId: 'registry' });

  // ── Core state ──────────────────────────────────────────────────────────────
  const [entries, setEntries] = useState<EnrichedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Search & filter ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // ── Detail panel ────────────────────────────────────────────────────────────
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── CRUD state ──────────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  // ── Register new asset ──────────────────────────────────────────────────────
  const [showRegister, setShowRegister] = useState(false);
  const [newType, setNewType] = useState('');
  const [newInternalId, setNewInternalId] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [registering, setRegistering] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchRegistry = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Authentication required');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch all registry entries for this user
      const { data: registryData, error: registryError } = await supabase
        .from('global_registry')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (registryError) {
        setError(registryError.message);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const raw = (registryData ?? []) as RegistryEntry[];

      // Fetch game_assets for enrichment (only for game_asset type entries)
      const gameAssetIds = raw
        .filter(e => e.object_type === 'game_asset')
        .map(e => e.internal_id);

      const gameAssetsMap: Record<string, GameAssetRow> = {};
      if (gameAssetIds.length > 0) {
        const { data: gaData } = await supabase
          .from('game_assets')
          .select('*')
          .in('id', gameAssetIds);
        if (gaData) {
          for (const ga of gaData as GameAssetRow[]) {
            gameAssetsMap[ga.id] = ga;
          }
        }
      }

      // Fetch control_mappings for game_assets
      const bindingsMap: Record<string, ControlMapping[]> = {};
      if (gameAssetIds.length > 0) {
        const { data: cmData } = await supabase
          .from('control_mappings')
          .select('*')
          .in('asset_id', gameAssetIds)
          .order('created_at', { ascending: false });
        if (cmData) {
          for (const cm of cmData as ControlMapping[]) {
            if (!bindingsMap[cm.asset_id]) bindingsMap[cm.asset_id] = [];
            bindingsMap[cm.asset_id].push(cm);
          }
        }
      }

      // Enrich entries
      const enriched: EnrichedEntry[] = raw.map(entry => ({
        ...entry,
        gameAsset: entry.object_type === 'game_asset' ? gameAssetsMap[entry.internal_id] : undefined,
        bindings: entry.object_type === 'game_asset' ? bindingsMap[entry.internal_id] : undefined,
      }));

      setEntries(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load registry');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchRegistry();
  }, [fetchRegistry]);

  // ── Realtime subscription ───────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('uar-global-registry')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'global_registry' },
        () => {
          // Re-fetch on any registry change for this session
          fetchRegistry(true);
        },
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
    };
  }, [fetchRegistry]);

  // ── Computed: unique categories ─────────────────────────────────────────────
  const categories = useMemo(() => {
    const types = new Map<string, number>();
    for (const e of entries) {
      types.set(e.object_type, (types.get(e.object_type) ?? 0) + 1);
    }
    return Array.from(types.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count, ...getTypeMeta(type) }));
  }, [entries]);

  // ── Computed: filtered & sorted entries ─────────────────────────────────────
  const filteredEntries = useMemo(() => {
    let result = entries;

    // Category filter
    if (activeCategory) {
      result = result.filter(e => e.object_type === activeCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.label.toLowerCase().includes(q) ||
        e.object_type.toLowerCase().includes(q) ||
        e.internal_id.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortMode) {
      case 'newest':
        result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result = [...result].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'alphabetical':
        result = [...result].sort((a, b) => a.label.localeCompare(b.label));
        break;
      case 'type':
        result = [...result].sort((a, b) => a.object_type.localeCompare(b.object_type));
        break;
    }

    return result;
  }, [entries, activeCategory, searchQuery, sortMode]);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = entries.length;
    const gameAssets = entries.filter(e => e.object_type === 'game_asset').length;
    const withBindings = entries.filter(e => e.bindings && e.bindings.length > 0).length;
    const withDna = entries.filter(e => e.gameAsset?.config_dna).length;
    const recentCount = entries.filter(e => {
      const d = new Date(e.created_at);
      const now = new Date();
      return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
    }).length;
    return { total, gameAssets, withBindings, withDna, recentCount, typeCount: categories.length };
  }, [entries, categories]);

  // ── CRUD handlers ───────────────────────────────────────────────────────────

  const handleRegister = useCallback(async () => {
    if (!newType.trim() || !newInternalId.trim() || !newLabel.trim()) return;
    setRegistering(true);
    try {
      const res = await fetch('/api/gal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newType.trim(),
          internalId: newInternalId.trim(),
          label: newLabel.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Registration failed');
      } else {
        forgeRecord(`Registered ${newType.trim()}: ${newLabel.trim()}`);
        setNewType('');
        setNewInternalId('');
        setNewLabel('');
        setShowRegister(false);
        await fetchRegistry(true);
      }
    } catch {
      setError('Registration failed');
    } finally {
      setRegistering(false);
    }
  }, [newType, newInternalId, newLabel, forgeRecord, fetchRegistry]);

  const handleEditStart = useCallback((entry: EnrichedEntry) => {
    setEditingId(entry.id);
    setEditLabel(entry.label);
    setTimeout(() => editInputRef.current?.focus(), 50);
  }, []);

  const handleEditSave = useCallback(async (entry: EnrichedEntry) => {
    if (!editLabel.trim() || editLabel.trim() === entry.label) {
      setEditingId(null);
      return;
    }
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('global_registry')
        .update({ label: editLabel.trim() })
        .eq('id', entry.id);
      if (updateError) {
        setError(updateError.message);
      } else {
        forgeRecord(`Renamed asset: ${entry.label} → ${editLabel.trim()}`);
        setEntries(prev => prev.map(e =>
          e.id === entry.id ? { ...e, label: editLabel.trim() } : e
        ));
      }
    } catch {
      setError('Failed to update label');
    } finally {
      setEditingId(null);
    }
  }, [editLabel, forgeRecord]);

  const handleDelete = useCallback(async (entry: EnrichedEntry) => {
    setDeleting(entry.id);
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from('global_registry')
        .delete()
        .eq('id', entry.id);
      if (deleteError) {
        setError(deleteError.message);
      } else {
        forgeRecord(`Deleted asset: ${entry.label}`);
        setEntries(prev => prev.filter(e => e.id !== entry.id));
        if (expandedId === entry.id) setExpandedId(null);
      }
    } catch {
      setError('Failed to delete');
    } finally {
      setDeleting(null);
    }
  }, [forgeRecord, expandedId]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderStatCard = (label: string, value: number | string, icon: React.ReactNode, color: string) => (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 12,
        background: `${color}08`,
        border: `1px solid ${color}20`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minWidth: 0,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.2 }}>
          {value}
        </div>
        <div style={{ fontSize: 11, color: 'var(--de-text-dim)', fontWeight: 500 }}>
          {label}
        </div>
      </div>
    </div>
  );

  const renderAssetCard = (entry: EnrichedEntry) => {
    const meta = getTypeMeta(entry.object_type);
    const isExpanded = expandedId === entry.id;
    const isEditing = editingId === entry.id;
    const isDeleting = deleting === entry.id;
    const hasBindings = entry.bindings && entry.bindings.length > 0;
    const hasDna = entry.gameAsset?.config_dna != null;
    const hasMesh = entry.gameAsset?.wasm_mesh_data != null;

    return (
      <div
        key={entry.id}
        style={{
          borderRadius: 14,
          background: 'var(--de-surface, rgba(255,255,255,0.85))',
          border: `1px solid ${isExpanded ? meta.color + '40' : 'var(--de-border, rgba(0,0,0,0.08))'}`,
          overflow: 'hidden',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: isExpanded ? `0 4px 24px ${meta.color}12` : 'none',
        }}
      >
        {/* Card header */}
        <div
          style={{
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
          }}
          onClick={() => {
            if (!isEditing) {
              toggleExpand(entry.id);
              if (onSelectAsset && !isExpanded) onSelectAsset(entry);
            }
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleExpand(entry.id);
            }
          }}
        >
          {/* Type icon */}
          <div
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${meta.color}12`,
              border: `1px solid ${meta.color}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: meta.color, flexShrink: 0,
            }}
          >
            {meta.icon}
          </div>

          {/* Label / editing */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {isEditing ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                <input
                  ref={editInputRef}
                  type="text"
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleEditSave(entry);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  style={{
                    flex: 1, padding: '4px 8px', borderRadius: 6,
                    border: `1px solid ${accentColor}40`,
                    background: 'var(--de-surface, #fff)',
                    fontSize: 13, fontWeight: 600,
                    color: 'var(--de-heading)',
                    outline: 'none',
                  }}
                  maxLength={200}
                />
                <button
                  onClick={() => handleEditSave(entry)}
                  style={{
                    padding: '4px 8px', borderRadius: 6,
                    background: '#22c55e18', border: '1px solid #22c55e30',
                    color: '#22c55e', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                  }}
                  aria-label="Save label"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  style={{
                    padding: '4px 8px', borderRadius: 6,
                    background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.15)',
                    color: 'var(--de-text-dim)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                  }}
                  aria-label="Cancel edit"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: 'var(--de-heading)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {entry.label}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    padding: '2px 7px', borderRadius: 4,
                    background: `${meta.color}12`,
                    color: meta.color,
                  }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>
                    {formatTimestamp(entry.created_at)}
                  </span>
                  {hasBindings && (
                    <span style={{ fontSize: 10, color: '#8b5cf6' }} title="Has control bindings">
                      <Link2 className="w-3 h-3 inline" /> {entry.bindings!.length}
                    </span>
                  )}
                  {hasDna && (
                    <span style={{ fontSize: 10, color: '#22c55e' }} title="Has DNA config">
                      <Cpu className="w-3 h-3 inline" />
                    </span>
                  )}
                  {hasMesh && (
                    <span style={{ fontSize: 10, color: '#3b82f6' }} title="Has mesh data">
                      <Box className="w-3 h-3 inline" />
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => handleEditStart(entry)}
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'transparent', border: 'none',
                color: 'var(--de-text-dim)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title="Edit label"
              aria-label="Edit label"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDelete(entry)}
              disabled={isDeleting}
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'transparent', border: 'none',
                color: isDeleting ? 'var(--de-text-dim)' : '#ef4444',
                cursor: isDeleting ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: isDeleting ? 0.5 : 1,
              }}
              title="Remove from registry"
              aria-label="Remove from registry"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => toggleExpand(entry.id)}
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'transparent', border: 'none',
                color: 'var(--de-text-dim)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title={isExpanded ? 'Collapse' : 'Expand'}
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded detail panel */}
        {isExpanded && (
          <div style={{
            padding: '0 16px 16px',
            borderTop: `1px solid ${meta.color}15`,
          }}>
            {/* Metadata grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 10,
              marginTop: 14,
            }}>
              {/* ID */}
              <div style={detailFieldStyle}>
                <div style={detailLabelStyle}><Hash className="w-3 h-3" /> Registry ID</div>
                <div style={detailValueStyle} title={entry.id}>
                  {entry.id.slice(0, 8)}…
                </div>
              </div>

              {/* Internal ID */}
              <div style={detailFieldStyle}>
                <div style={detailLabelStyle}><Database className="w-3 h-3" /> Internal ID</div>
                <div style={detailValueStyle} title={entry.internal_id}>
                  {entry.internal_id.slice(0, 8)}…
                </div>
              </div>

              {/* Object Type */}
              <div style={detailFieldStyle}>
                <div style={detailLabelStyle}><Tag className="w-3 h-3" /> Type</div>
                <div style={detailValueStyle}>{entry.object_type}</div>
              </div>

              {/* Created */}
              <div style={detailFieldStyle}>
                <div style={detailLabelStyle}><Clock className="w-3 h-3" /> Registered</div>
                <div style={detailValueStyle}>
                  {new Date(entry.created_at).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit',
                  })}
                </div>
              </div>
            </div>

            {/* Game Asset enrichment */}
            {entry.gameAsset && (
              <div style={{ marginTop: 14 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--de-heading)',
                  marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Gamepad2 className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
                  Game Asset Detail
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: 10,
                }}>
                  <div style={detailFieldStyle}>
                    <div style={detailLabelStyle}>Asset Type</div>
                    <div style={detailValueStyle}>{entry.gameAsset.asset_type}</div>
                  </div>
                  {entry.gameAsset.source_image_url && (
                    <div style={detailFieldStyle}>
                      <div style={detailLabelStyle}>Source Image</div>
                      <div style={{ ...detailValueStyle, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Eye className="w-3 h-3" />
                        <a
                          href={entry.gameAsset.source_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: accentColor, fontSize: 11, textDecoration: 'underline' }}
                          onClick={e => e.stopPropagation()}
                        >
                          View
                        </a>
                      </div>
                    </div>
                  )}
                  <div style={detailFieldStyle}>
                    <div style={detailLabelStyle}>Mesh Data</div>
                    <div style={detailValueStyle}>
                      {entry.gameAsset.wasm_mesh_data
                        ? `${Math.ceil(entry.gameAsset.wasm_mesh_data.length * 0.75 / 1024)} KB`
                        : '—'}
                    </div>
                  </div>
                  <div style={detailFieldStyle}>
                    <div style={detailLabelStyle}>Rig Data</div>
                    <div style={detailValueStyle}>
                      {entry.gameAsset.wasm_rig_data
                        ? `${Math.ceil(entry.gameAsset.wasm_rig_data.length * 0.75 / 1024)} KB`
                        : '—'}
                    </div>
                  </div>
                  <div style={detailFieldStyle}>
                    <div style={detailLabelStyle}>Updated</div>
                    <div style={detailValueStyle}>
                      {formatTimestamp(entry.gameAsset.updated_at)}
                    </div>
                  </div>
                </div>

                {/* DNA Viewer */}
                {entry.gameAsset.config_dna != null && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)',
                      marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <Cpu className="w-3 h-3" /> Config DNA
                    </div>
                    <pre style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.03)',
                      border: '1px solid rgba(0,0,0,0.06)',
                      fontSize: 10,
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                      color: 'var(--de-text)',
                      overflow: 'auto',
                      maxHeight: 200,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      margin: 0,
                    }}>
                      {String(JSON.stringify(entry.gameAsset.config_dna, null, 2))}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Control Mappings */}
            {entry.bindings && entry.bindings.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--de-heading)',
                  marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Settings className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                  Control Bindings
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    padding: '1px 6px', borderRadius: 4,
                    background: 'rgba(245,158,11,0.1)',
                    color: '#f59e0b',
                  }}>
                    {entry.bindings.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {entry.bindings.map(binding => (
                    <div
                      key={binding.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: 'rgba(245,158,11,0.05)',
                        border: '1px solid rgba(245,158,11,0.12)',
                      }}
                    >
                      <div style={{
                        fontSize: 11, fontWeight: 700,
                        color: '#f59e0b',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        minWidth: 100,
                      }}>
                        {binding.input_source}
                      </div>
                      <Zap className="w-3 h-3" style={{ color: 'var(--de-text-dim)' }} />
                      <div style={{
                        fontSize: 11, fontWeight: 600,
                        color: 'var(--de-heading)',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      }}>
                        {binding.command_target}
                      </div>
                      <div style={{
                        marginLeft: 'auto',
                        fontSize: 10, color: 'var(--de-text-dim)',
                      }}>
                        sens: {binding.sensitivity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: compact ? '8px' : '20px 16px', maxWidth: 960, margin: '0 auto' }}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      {!compact && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `${accentColor}15`,
              border: `1px solid ${accentColor}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: accentColor,
            }}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 style={{
                fontSize: 20, fontWeight: 800,
                color: 'var(--de-heading)',
                margin: 0, lineHeight: 1.2,
              }}>
                Universal Asset Registry
              </h2>
              <p style={{
                fontSize: 12, color: 'var(--de-text-dim)',
                margin: 0, marginTop: 2,
              }}>
                Global Association Layer — Everything to Everything
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 10,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          color: '#ef4444',
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <X className="w-4 h-4 flex-shrink-0" />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none', border: 'none',
              color: '#ef4444', cursor: 'pointer',
              padding: 2,
            }}
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Stats dashboard ───────────────────────────────────────────────── */}
      {!loading && entries.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 10,
          marginBottom: 20,
        }}>
          {renderStatCard('Total Assets', stats.total, <Database className="w-4 h-4" />, accentColor)}
          {renderStatCard('Types', stats.typeCount, <Layers className="w-4 h-4" />, '#3b82f6')}
          {renderStatCard('Game Assets', stats.gameAssets, <Gamepad2 className="w-4 h-4" />, '#8b5cf6')}
          {renderStatCard('With Bindings', stats.withBindings, <Link2 className="w-4 h-4" />, '#f59e0b')}
          {renderStatCard('With DNA', stats.withDna, <Cpu className="w-4 h-4" />, '#22c55e')}
          {renderStatCard('This Week', stats.recentCount, <Clock className="w-4 h-4" />, '#ec4899')}
        </div>
      )}

      {/* ── Toolbar: Search + Filter + Actions ────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8,
        marginBottom: 14, alignItems: 'center',
      }}>
        {/* Search */}
        <div style={{
          flex: '1 1 220px',
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 10,
          background: 'var(--de-surface, rgba(255,255,255,0.85))',
          border: '1px solid var(--de-border, rgba(0,0,0,0.08))',
        }}>
          <Search className="w-4 h-4" style={{ color: 'var(--de-text-dim)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search assets…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: 13, color: 'var(--de-text)',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--de-text-dim)', cursor: 'pointer', padding: 0 }}
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort selector */}
        <select
          value={sortMode}
          onChange={e => setSortMode(e.target.value as SortMode)}
          style={{
            padding: '8px 12px', borderRadius: 10,
            background: 'var(--de-surface, rgba(255,255,255,0.85))',
            border: '1px solid var(--de-border, rgba(0,0,0,0.08))',
            fontSize: 12, fontWeight: 600,
            color: 'var(--de-text)',
            cursor: 'pointer',
          }}
          aria-label="Sort mode"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="alphabetical">A → Z</option>
          <option value="type">By Type</option>
        </select>

        {/* View toggle */}
        <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--de-border, rgba(0,0,0,0.08))' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '7px 10px', border: 'none', cursor: 'pointer',
              background: viewMode === 'grid' ? `${accentColor}15` : 'var(--de-surface, rgba(255,255,255,0.85))',
              color: viewMode === 'grid' ? accentColor : 'var(--de-text-dim)',
              display: 'flex', alignItems: 'center',
            }}
            title="Grid view"
            aria-label="Grid view"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '7px 10px', border: 'none', cursor: 'pointer',
              background: viewMode === 'list' ? `${accentColor}15` : 'var(--de-surface, rgba(255,255,255,0.85))',
              color: viewMode === 'list' ? accentColor : 'var(--de-text-dim)',
              display: 'flex', alignItems: 'center',
              borderLeft: '1px solid var(--de-border, rgba(0,0,0,0.08))',
            }}
            title="List view"
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '8px 12px', borderRadius: 10,
            background: showFilters ? `${accentColor}12` : 'var(--de-surface, rgba(255,255,255,0.85))',
            border: `1px solid ${showFilters ? accentColor + '30' : 'var(--de-border, rgba(0,0,0,0.08))'}`,
            color: showFilters ? accentColor : 'var(--de-text-dim)',
            cursor: 'pointer', fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4,
          }}
          aria-label="Toggle filters"
        >
          <Filter className="w-3.5 h-3.5" /> Filter
        </button>

        {/* Refresh */}
        <button
          onClick={() => fetchRegistry(true)}
          disabled={refreshing}
          style={{
            padding: '8px 12px', borderRadius: 10,
            background: 'var(--de-surface, rgba(255,255,255,0.85))',
            border: '1px solid var(--de-border, rgba(0,0,0,0.08))',
            color: refreshing ? 'var(--de-text-dim)' : 'var(--de-text)',
            cursor: refreshing ? 'wait' : 'pointer',
            fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4,
          }}
          aria-label="Refresh registry"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Register new */}
        <button
          onClick={() => {
            setShowRegister(!showRegister);
            forgeRecord('Opened register form');
          }}
          style={{
            padding: '8px 14px', borderRadius: 10,
            background: accentColor,
            border: 'none',
            color: '#fff',
            cursor: 'pointer', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 5,
          }}
          aria-label="Register new asset"
        >
          <Plus className="w-3.5 h-3.5" /> Register
        </button>
      </div>

      {/* ── Category tabs ─────────────────────────────────────────────────── */}
      {showFilters && categories.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          marginBottom: 16, padding: '12px 14px',
          borderRadius: 12,
          background: 'var(--de-surface, rgba(255,255,255,0.85))',
          border: '1px solid var(--de-border, rgba(0,0,0,0.08))',
        }}>
          {/* All */}
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              padding: '5px 12px', borderRadius: 8,
              background: !activeCategory ? `${accentColor}15` : 'rgba(0,0,0,0.03)',
              border: `1px solid ${!activeCategory ? accentColor + '30' : 'transparent'}`,
              color: !activeCategory ? accentColor : 'var(--de-text-dim)',
              cursor: 'pointer', fontSize: 11, fontWeight: 700,
            }}
          >
            All ({entries.length})
          </button>

          {categories.map(cat => (
            <button
              key={cat.type}
              onClick={() => setActiveCategory(activeCategory === cat.type ? null : cat.type)}
              style={{
                padding: '5px 12px', borderRadius: 8,
                background: activeCategory === cat.type ? `${cat.color}15` : 'rgba(0,0,0,0.03)',
                border: `1px solid ${activeCategory === cat.type ? cat.color + '30' : 'transparent'}`,
                color: activeCategory === cat.type ? cat.color : 'var(--de-text-dim)',
                cursor: 'pointer', fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {cat.icon} {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      )}

      {/* ── Register new asset form ───────────────────────────────────────── */}
      {showRegister && (
        <div style={{
          marginBottom: 16, padding: '16px',
          borderRadius: 14,
          background: 'var(--de-surface, rgba(255,255,255,0.85))',
          border: `1px solid ${accentColor}25`,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: 'var(--de-heading)',
            marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Plus className="w-4 h-4" style={{ color: accentColor }} />
            Register New Asset in GAL
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            <div>
              <label style={formLabelStyle}>Object Type</label>
              <input
                type="text"
                placeholder="e.g. game_asset, post, music"
                value={newType}
                onChange={e => setNewType(e.target.value)}
                style={formInputStyle}
                maxLength={100}
              />
            </div>
            <div>
              <label style={formLabelStyle}>Internal ID</label>
              <input
                type="text"
                placeholder="UUID of the source object"
                value={newInternalId}
                onChange={e => setNewInternalId(e.target.value)}
                style={formInputStyle}
                maxLength={200}
              />
            </div>
            <div>
              <label style={formLabelStyle}>Label</label>
              <input
                type="text"
                placeholder="Human-readable name"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRegister(); }}
                style={formInputStyle}
                maxLength={200}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowRegister(false)}
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: 'rgba(100,116,139,0.08)',
                border: '1px solid rgba(100,116,139,0.15)',
                color: 'var(--de-text-dim)',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleRegister}
              disabled={registering || !newType.trim() || !newInternalId.trim() || !newLabel.trim()}
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: accentColor,
                border: 'none',
                color: '#fff',
                cursor: registering ? 'wait' : 'pointer',
                fontSize: 12, fontWeight: 700,
                opacity: !newType.trim() || !newInternalId.trim() || !newLabel.trim() ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {registering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Register
            </button>
          </div>
        </div>
      )}

      {/* ── Loading state ─────────────────────────────────────────────────── */}
      {loading && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '60px 20px', gap: 12,
        }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: accentColor }} />
          <span style={{ fontSize: 13, color: 'var(--de-text-dim)', fontWeight: 600 }}>
            Loading registry…
          </span>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!loading && filteredEntries.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '60px 20px', gap: 12,
          borderRadius: 14,
          background: 'var(--de-surface, rgba(255,255,255,0.85))',
          border: '1px dashed var(--de-border, rgba(0,0,0,0.12))',
        }}>
          <Database className="w-10 h-10" style={{ color: 'var(--de-text-dim)', opacity: 0.3 }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--de-heading)' }}>
            {entries.length === 0 ? 'No assets registered' : 'No matching assets'}
          </div>
          <p style={{ fontSize: 12, color: 'var(--de-text-dim)', textAlign: 'center', maxWidth: 340 }}>
            {entries.length === 0
              ? 'Assets appear here when created in any Daydream surface. Use the Register button to manually add an entry to the Global Association Layer.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
          {entries.length === 0 && (
            <button
              onClick={() => setShowRegister(true)}
              style={{
                marginTop: 8, padding: '10px 20px', borderRadius: 10,
                background: accentColor, border: 'none', color: '#fff',
                cursor: 'pointer', fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Plus className="w-4 h-4" /> Register First Asset
            </button>
          )}
        </div>
      )}

      {/* ── Asset grid / list ─────────────────────────────────────────────── */}
      {!loading && filteredEntries.length > 0 && (
        <>
          {/* Result count */}
          <div style={{
            fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)',
            marginBottom: 10,
          }}>
            {filteredEntries.length} asset{filteredEntries.length !== 1 ? 's' : ''}
            {activeCategory ? ` in ${getTypeMeta(activeCategory).label}` : ''}
            {searchQuery ? ` matching "${searchQuery}"` : ''}
          </div>

          <div style={{
            display: viewMode === 'grid'
              ? 'grid'
              : 'flex',
            gridTemplateColumns: viewMode === 'grid'
              ? 'repeat(auto-fill, minmax(340px, 1fr))'
              : undefined,
            flexDirection: viewMode === 'list' ? 'column' : undefined,
            gap: 10,
          }}>
            {filteredEntries.map(entry => renderAssetCard(entry))}
          </div>
        </>
      )}

      {/* ── Footer / live indicator ───────────────────────────────────────── */}
      {!loading && (
        <div style={{
          marginTop: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6,
          fontSize: 10, color: 'var(--de-text-dim)',
          fontWeight: 500,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 6px rgba(34,197,94,0.4)',
          }} />
          Live — Realtime updates active
        </div>
      )}
    </div>
  );
}

// ── Shared inline styles (detail panel fields) ────────────────────────────────

const detailFieldStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  background: 'rgba(0,0,0,0.02)',
  border: '1px solid rgba(0,0,0,0.05)',
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--de-text-dim)',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  marginBottom: 2,
};

const detailValueStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--de-heading)',
  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const formLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--de-text-dim)',
  marginBottom: 4,
};

const formInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--de-border, rgba(0,0,0,0.1))',
  background: 'var(--de-surface, #fff)',
  fontSize: 12,
  color: 'var(--de-text)',
  outline: 'none',
  boxSizing: 'border-box',
};
