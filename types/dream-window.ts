/**
 * types/dream-window.ts
 *
 * Canonical Dream Window type authority for DREAMengin.
 *
 * These types replace the in-module types in lib/dream-window/DreamWindowLifecycle.ts
 * and are the single source of truth for Dream Window shapes across the codebase.
 *
 * Migration from types/widget-system-v2.ts:
 *   widget           → Dream Window
 *   WidgetInstance   → DreamWindowRecord
 *   WidgetDefinition → DreamWindowDefinition
 *
 * Architecture: docs/ARCHITECTURE.md §4 (Universal Dream Window model)
 * Naming authority: docs/NAMING_AUTHORITY.md
 * Privacy: visibility defaults to 'private' per docs/AXIOMS.md §product integrity rules.
 *
 * Phase 8 Section B: Point 19 — canonical type authority.
 */

// ── Re-export lifecycle types from the state machine ─────────────────────────
// Also import locally so they can be used in this file's interface definitions
import type {
  DreamWindowInstance,
  DreamWindowSize,
  DreamWindowPosition,
  DreamWindowConfig,
  DestinationRule,
  DreamWindowState,
} from '@/lib/dream-window/DreamWindowLifecycle';

export type {
  DreamWindowInstance,
  DreamWindowSize,
  DreamWindowPosition,
  DreamWindowConfig,
  DestinationRule,
} from '@/lib/dream-window/DreamWindowLifecycle';

export { DREAM_WINDOW_STATES } from '@/lib/dream-window/DreamWindowLifecycle';
export type { DreamWindowState } from '@/lib/dream-window/DreamWindowLifecycle';

// ── Database record shape ─────────────────────────────────────────────────────

/**
 * A Dream Window record as stored in (and returned from) the database.
 *
 * Uses snake_case column names matching the dream_windows Supabase table.
 * All 10 required fields from Phase 8 §B Point 12 are present.
 */
export interface DreamWindowRecord {
  /** UUID primary key */
  id: string;
  /** Category / type label (e.g. 'music', 'code', 'brand') */
  type: string;
  /** Owner user ID — every Dream Window belongs to exactly one user */
  owner_id: string;
  /** Configuration bag — label, display options, runtime-specific settings */
  config: DreamWindowConfig;
  /** Current rendered size */
  size: DreamWindowSize;
  /** Current position in the DreamSpace layout grid */
  position: DreamWindowPosition;
  /**
   * Visibility level — private by default.
   * 'private'  = visible only to owner
   * 'shared'   = visible to specific users/groups chosen by owner
   * 'public'   = visible to anyone authenticated
   */
  visibility: 'private' | 'shared' | 'public';
  /** Source provider binding IDs attached to this Dream Window */
  source_bindings: string[];
  /** Rules that govern where this window may project its output */
  destination_rules: DestinationRule[];
  /** Current lifecycle state */
  active_state: DreamWindowState;
  /** ISO timestamp */
  created_at: string;
  /** ISO timestamp — updated on every transition */
  updated_at: string;
}

// ── API request/response shapes ───────────────────────────────────────────────

/**
 * Body shape accepted by POST /api/dream-windows.
 * All 10 required fields must be present (validated at API layer — Point 12).
 */
export interface CreateDreamWindowBody {
  id?: string;
  type: string;
  owner_id: string;
  config: DreamWindowConfig;
  size: DreamWindowSize;
  position: DreamWindowPosition;
  visibility?: 'private' | 'shared' | 'public';
  sourceBindings: string[];
  destinationRules: DestinationRule[];
  activeState?: DreamWindowState;
}

/**
 * Body shape accepted by PATCH /api/dream-windows/[id].
 * All fields are optional — only supplied fields are updated.
 */
export interface PatchDreamWindowBody {
  active_state?: DreamWindowState;
  position?: DreamWindowPosition;
  size?: DreamWindowSize;
  visibility?: 'private' | 'shared' | 'public';
  config?: DreamWindowConfig;
  source_bindings?: string[];
  destination_rules?: DestinationRule[];
}
