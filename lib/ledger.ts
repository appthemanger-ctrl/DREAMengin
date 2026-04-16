/**
 * Ledger — Universal Metadata Store
 *
 * In-memory ledger with optional Supabase persistence.
 * Stores: audio peak maps, reference fingerprints, extracted sample
 * metadata, and torridity rank data.
 *
 * Usage:
 *   const ledger = createLedger();
 *   storePeakMap(ledger, 'song-1', peakMap);
 *   const entry = getLedgerEntry(ledger, 'song-1');
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { PeakMap, Fingerprint } from './audioFingerprint';

// ─── Entry Types ─────────────────────────────────────────────────────────────

export interface PeakMapEntry {
  kind: 'peakMap';
  id: string;
  songId: string;
  peakMap: PeakMap;
  createdAt: string;
}

export interface FingerprintEntry {
  kind: 'fingerprint';
  id: string;
  fingerprintId: string;
  fingerprint: Fingerprint;
  createdAt: string;
}

export interface SampleMetadata {
  startTime: number;
  endTime: number;
  gain: number;
  pitchShift: number;
  [key: string]: unknown;
}

export interface SampleMetadataEntry {
  kind: 'sampleMetadata';
  id: string;
  sampleId: string;
  meta: SampleMetadata;
  createdAt: string;
}

export interface TorridityEntry {
  kind: 'torridity';
  id: string;
  contentId: string;
  views: number;
  mass: number;
  rank: number;
  createdAt: string;
}

// ─── Shared Asset Entry ───────────────────────────────────────────────────────

/** Supported asset types in the shared asset ledger (visualised file system). */
export type AssetType = 'audio' | 'image' | '3d' | 'code';

/** Optional manifest describing an asset's capabilities and metadata. */
export interface AssetManifest {
  title?: string;
  description?: string;
  tags?: string[];
  duration?: number;
  dimensions?: { w: number; h: number };
  language?: string;
  [key: string]: unknown;
}

/**
 * AssetEntry — a shared asset in the visualised file system.
 * Fields: id, type, url, manifest, owner.
 */
export interface AssetEntry {
  kind: 'asset';
  id: string;
  type: AssetType;
  url: string;
  manifest: AssetManifest;
  owner: string;
  createdAt: string;
}

/** Union of all ledger entry types. */
export type LedgerEntry =
  | PeakMapEntry
  | FingerprintEntry
  | SampleMetadataEntry
  | TorridityEntry
  | AssetEntry;

// ─── Ledger Structure ────────────────────────────────────────────────────────

export interface Ledger {
  entries: Map<string, LedgerEntry>;
  supabase?: SupabaseClient;
  /** Table name for Supabase persistence (default: 'ledger_entries'). */
  tableName: string;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * createLedger(supabase?, tableName?)
 *
 * Creates a new in-memory ledger.  Pass a Supabase client to enable
 * async persistence — writes are fire-and-forget and never block
 * the in-memory store.
 */
export function createLedger(
  supabase?: SupabaseClient,
  tableName = 'ledger_entries'
): Ledger {
  return { entries: new Map(), supabase, tableName };
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

async function persist(ledger: Ledger, entry: LedgerEntry): Promise<void> {
  if (!ledger.supabase) return;
  try {
    await ledger.supabase.from(ledger.tableName).upsert({
      id:         entry.id,
      kind:       entry.kind,
      payload:    JSON.stringify(entry),
      created_at: entry.createdAt,
    });
  } catch {
    // Non-blocking — in-memory store is always the source of truth
  }
}

// ─── CRUD helpers ─────────────────────────────────────────────────────────────

export function getLedgerEntry(ledger: Ledger, id: string): LedgerEntry | undefined {
  return ledger.entries.get(id);
}

export function getAllByKind<K extends LedgerEntry['kind']>(
  ledger: Ledger,
  kind: K
): Extract<LedgerEntry, { kind: K }>[] {
  const results: Extract<LedgerEntry, { kind: K }>[] = [];
  for (const entry of ledger.entries.values()) {
    if (entry.kind === kind) {
      results.push(entry as Extract<LedgerEntry, { kind: K }>);
    }
  }
  return results;
}

// ─── storePeakMap ────────────────────────────────────────────────────────────

/**
 * storePeakMap(ledger, songId, peakMap)
 *
 * Stores a PeakMap under the given songId.  Returns the entry id.
 */
export function storePeakMap(
  ledger: Ledger,
  songId: string,
  peakMap: PeakMap
): string {
  const id = `pm_${songId}`;
  const entry: PeakMapEntry = { kind: 'peakMap', id, songId, peakMap, createdAt: now() };
  ledger.entries.set(id, entry);
  void persist(ledger, entry);
  return id;
}

// ─── storeFingerprint ────────────────────────────────────────────────────────

/**
 * storeFingerprint(ledger, fingerprintId, fingerprint)
 */
export function storeFingerprint(
  ledger: Ledger,
  fingerprintId: string,
  fingerprint: Fingerprint
): string {
  const id = `fp_${fingerprintId}`;
  const entry: FingerprintEntry = {
    kind: 'fingerprint',
    id,
    fingerprintId,
    fingerprint,
    createdAt: now(),
  };
  ledger.entries.set(id, entry);
  void persist(ledger, entry);
  return id;
}

// ─── storeSampleMetadata ──────────────────────────────────────────────────────

/**
 * storeSampleMetadata(ledger, sampleId, meta)
 */
export function storeSampleMetadata(
  ledger: Ledger,
  sampleId: string,
  meta: SampleMetadata
): string {
  const id = `sm_${sampleId}`;
  const entry: SampleMetadataEntry = {
    kind: 'sampleMetadata',
    id,
    sampleId,
    meta,
    createdAt: now(),
  };
  ledger.entries.set(id, entry);
  void persist(ledger, entry);
  return id;
}

// ─── storeTorridityRank ───────────────────────────────────────────────────────

/**
 * storeTorridityRank(ledger, contentId, views, mass, rank)
 */
export function storeTorridityRank(
  ledger: Ledger,
  contentId: string,
  views: number,
  mass: number,
  rank: number
): string {
  const id = `tr_${contentId}`;
  const entry: TorridityEntry = {
    kind: 'torridity',
    id,
    contentId,
    views,
    mass,
    rank,
    createdAt: now(),
  };
  ledger.entries.set(id, entry);
  void persist(ledger, entry);
  return id;
}

// ─── storeAsset ───────────────────────────────────────────────────────────────

/**
 * storeAsset(ledger, fields)
 *
 * Stores a shared asset (audio, image, 3D, or code) in the ledger.
 * Returns the generated entry id.
 */
export function storeAsset(
  ledger: Ledger,
  fields: {
    type: AssetType;
    url: string;
    owner: string;
    manifest?: AssetManifest;
    id?: string;
  }
): string {
  const id =
    fields.id ??
    `asset_${fields.type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const entry: AssetEntry = {
    kind: 'asset',
    id,
    type: fields.type,
    url: fields.url,
    owner: fields.owner,
    manifest: fields.manifest ?? {},
    createdAt: now(),
  };
  ledger.entries.set(id, entry);
  void persist(ledger, entry);
  return id;
}

// ─── recordView ────────────────────────────────────────────────────────────────

/**
 * recordView(ledger, contentId)
 *
 * Increments the view count for a torridity entry, or creates one with
 * default values if it does not yet exist.
 */
export function recordView(ledger: Ledger, contentId: string): void {
  const id = `tr_${contentId}`;
  const existing = ledger.entries.get(id);
  if (existing?.kind === 'torridity') {
    existing.views += 1;
    void persist(ledger, existing);
  } else {
    storeTorridityRank(ledger, contentId, 1, 1, 1);
  }
}
