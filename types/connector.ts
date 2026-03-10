/**
 * types/connector.ts
 *
 * Phase 5 — Feed & Friends Connections
 * Core type definitions for the connector accounts model and unified feed item.
 *
 * ARCHITECTURE.md §3 — Data layer types live in types/
 * AXIOMS.md §4     — Security by Default: tokens stay server-side only
 * AXIOMS.md §5     — Privacy by Design: owner-only RLS on connector_accounts
 */

// ── Connector account model ───────────────────────────────────────────────

/**
 * Mirrors the public.connector_accounts DB row.
 * token_blob is NEVER returned to the browser — server-only.
 */
export interface ConnectorAccount {
  id: string;
  user_id: string;
  provider: string;
  /** Matches ConnectorStatus from connectorRegistry.ts */
  status:
    | 'not_connected'
    | 'connected'
    | 'needs_reauth'
    | 'requires_approval'
    | 'unsupported'
    | 'error'
    | 'needs_admin_setup';
  scopes: string[];
  /** ISO timestamp of last successful verification, or null */
  last_verified_at: string | null;
  /** Human-readable last error, or null */
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Safe subset of ConnectorAccount sent to the browser.
 * Never includes token_blob or sensitive auth fields.
 */
export interface ConnectorAccountPublic
  extends Omit<ConnectorAccount, 'user_id'> {
  /** ISO timestamp of last sync, or null */
  last_synced_at: string | null;
  /** Number of items fetched in the last sync */
  last_sync_count: number;
}

// ── Unified feed item ─────────────────────────────────────────────────────

export interface FeedItemMedia {
  url: string;
  type: 'image' | 'video' | 'audio' | 'gif';
  alt?: string;
  thumbnail_url?: string;
}

/**
 * Normalized cross-provider feed item.
 * All provider-specific fields are collapsed into this shape before storage.
 *
 * Dedup key: (user_id, provider, external_id) — unique constraint in DB.
 */
export interface UnifiedFeedItem {
  /** Source provider id (matches ConnectorDef.id) */
  provider: string;
  /** Stable ID within the provider's system */
  external_id: string;
  /** @handle or username */
  author_handle: string;
  /** Display name */
  author_name: string;
  /** Plain text body */
  content_text: string;
  /** HTML body (optional — present for providers that supply it) */
  content_html?: string;
  /** Attached media items */
  media: FeedItemMedia[];
  /** Direct link to the original post */
  permalink: string;
  /** ISO timestamp of original publication */
  published_at: string;
  /** Full provider-native object for debugging — not shown in UI */
  raw: unknown;
}

/**
 * DB row shape for public.feed_items.
 * payload is UnifiedFeedItem serialised as jsonb.
 */
export interface FeedItemRow {
  id: string;
  user_id: string;
  provider: string;
  external_id: string;
  payload: UnifiedFeedItem;
  published_at: string | null;
  created_at: string;
}

// ── Connector API response shapes ─────────────────────────────────────────

export interface ConnectorConnectRequest {
  /** Depends on provider: access_token, username, instance_url, pubkey, etc. */
  credentials: Record<string, string>;
}

export interface ConnectorConnectResponse {
  ok: boolean;
  status: ConnectorAccount['status'];
  message?: string;
}

export interface ConnectorVerifyResponse {
  ok: boolean;
  status: ConnectorAccount['status'];
  last_verified_at: string | null;
  error?: string;
}

export interface ConnectorSyncResponse {
  ok: boolean;
  fetched: number;
  stored: number;
  last_synced_at: string;
  error?: string;
}
