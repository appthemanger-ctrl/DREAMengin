/**
 * @deprecated Deprecated: use types/dream-window.ts instead.
 * Will be removed in Phase 8 completion.
 *
 * The canonical Dream Window types are in types/dream-window.ts.
 * Widget System V2 types are preserved here for backward compatibility
 * with existing code that imports from this module. Do not add new
 * code that imports from this file.
 *
 * Architecture: docs/ARCHITECTURE.md §4 (Universal Dream Window model)
 * Phase 8 Section B: Point 19.
 */
// =====================================================
// Widget System V2 - Maximum Technical Hosting Spec
// Type definitions for the widget system
// =====================================================

// =====================================================
// 1. HOST KIND REGISTRY
// =====================================================

export enum HostKind {
  HOST_FEED_VIEW = 1,
  HOST_COMPOSITE = 2,
  // Additional host kinds can be added here
}

// =====================================================
// 2. SURFACE ENUM
// =====================================================

// Canonical surface names — preferred over Surface enum for new code
export const DreamSurface = {
  HOMEDREAM:          0, // was Surface.HOME
  EDIT_PROFILE_DREAM: 2, // was Surface.PROFILE
  VIEW_PROFILE:       2, // public-safe projection of EDIT_PROFILE_DREAM
  DOCK:               3, // was Surface.DOCK
} as const;
export type DreamSurfaceKey = keyof typeof DreamSurface;

/** @deprecated Use DreamSurface constants instead */
export enum Surface {
  HOME = 0,
  FACE = 1,
  PROFILE = 2,
  DOCK = 3,
}

// =====================================================
// 3. PRESENTATION MODES
// =====================================================

export enum PresentationMode {
  TILE = 0,
  WINDOW = 1,
  DOCKED = 2,
  FULL = 3,
}

// =====================================================
// 4. FEED SCOPE
// =====================================================

export enum FeedScope {
  SELF = 0,
  FOLLOW = 1,
}

// =====================================================
// 5. FEED SORT
// =====================================================

export enum FeedSort {
  RECENT = 0,
  PINNED_FIRST = 1,
  TOP = 2,
}

// =====================================================
// 6. POLICY BITS
// =====================================================

export enum PolicyBits {
  USER_ONLY = 1 << 0,
  ADMIN_ONLY = 1 << 1,
  PUBLIC_PREVIEW_ALLOWED = 1 << 2,
}

// =====================================================
// 7. TRANSFORM STATE (Float32Array[5])
// =====================================================

export interface WidgetTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

// Convert to/from Float32Array for performance
export function transformToArray(t: WidgetTransform): Float32Array {
  return new Float32Array([t.x, t.y, t.scale, t.rotation, t.opacity]);
}

export function transformFromArray(arr: Float32Array): WidgetTransform {
  return {
    x: arr[0],
    y: arr[1],
    scale: arr[2],
    rotation: arr[3],
    opacity: arr[4],
  };
}

// =====================================================
// 8. FEED HOST CONFIG
// =====================================================

export interface FeedHostConfig {
  scope: FeedScope;
  target_user_id: string | null; // Required if scope === FOLLOW, null if SELF
  filters: {
    tags?: string[];
    content_type?: string[];
    project_id?: string;
    [key: string]: unknown; // Allow additional filters
  };
  sort: FeedSort;
  limit: number; // Clamped 5-200
  realtime: boolean;
  include_media: boolean;
  include_reposts: boolean;
}

// Default feed host config (SELF scope)
export const DEFAULT_FEED_HOST_CONFIG: FeedHostConfig = {
  scope: FeedScope.SELF,
  target_user_id: null,
  filters: {},
  sort: FeedSort.RECENT,
  limit: 25,
  realtime: true,
  include_media: true,
  include_reposts: false,
};

// =====================================================
// 9. COMPOSITE HOST CONFIG
// =====================================================

export interface CompositePane {
  pane_id: string;
  host_kind: HostKind;
  host_config: FeedHostConfig | Record<string, unknown>;
  layout: {
    position?: { x: number; y: number };
    size?: { width: number; height: number };
  };
}

export interface CompositeHostConfig {
  panes: CompositePane[];
  layout_mode: 'tabs' | 'split' | 'stack';
}

// =====================================================
// 10. HOST CONFIG UNION
// =====================================================

export type HostConfig = FeedHostConfig | CompositeHostConfig | Record<string, unknown>;

// =====================================================
// 11. WIDGET DEFINITION (immutable identity + bindable behavior)
// =====================================================

export interface WidgetDefinition {
  widget_id: string;
  owner_id: string;
  name: string;
  host_kind: HostKind;
  host_config: HostConfig;
  settings: Record<string, unknown>;
  policy: number; // uint32 flags
  created_at: string;
  updated_at: string;
}

// =====================================================
// 12. WIDGET INSTANCE (placement + transform + presentation)
// =====================================================

export interface WidgetInstance {
  instance_id: string;
  widget_id: string;
  owner_id: string;
  
  // Surface placement
  surface: Surface;
  surface_key: number; // faceIndex or profileSpaceId or 0 for home
  slot_index: number; // 0..7 for slotted surfaces, -1 for free placement
  
  // Presentation and transform
  presentation: PresentationMode;
  transform_x: number;
  transform_y: number;
  transform_scale: number;
  transform_rotation: number;
  transform_opacity: number;
  
  // Z-ordering and focus
  z_index: number;
  focus_rank: number;
  
  // Runtime state
  runtime_flags: number; // uint32
  
  created_at: string;
  updated_at: string;
}

// Helper to get transform from instance
export function getInstanceTransform(instance: WidgetInstance): WidgetTransform {
  return {
    x: instance.transform_x,
    y: instance.transform_y,
    scale: instance.transform_scale,
    rotation: instance.transform_rotation,
    opacity: instance.transform_opacity,
  };
}

// Helper to update instance with transform
export function setInstanceTransform(
  instance: WidgetInstance,
  transform: WidgetTransform
): WidgetInstance {
  return {
    ...instance,
    transform_x: transform.x,
    transform_y: transform.y,
    transform_scale: transform.scale,
    transform_rotation: transform.rotation,
    transform_opacity: transform.opacity,
  };
}

// =====================================================
// 13. HOST RESOLVED STATUS
// =====================================================

export enum HostResolvedStatus {
  OK = 'OK',
  FORBIDDEN = 'FORBIDDEN',
  ERROR = 'ERROR',
}

// =====================================================
// 14. FEED ITEM SUMMARY
// =====================================================

export interface FeedItemSummary {
  item_id: string;
  author_id: string;
  created_at: string;
  text_preview: string;
  media_preview_url?: string;
  engagement_counts?: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
  visibility: 'public' | 'followers' | 'private';
}

// =====================================================
// 15. HOST RESOLVED PAYLOAD
// =====================================================

export interface HostResolved {
  kind: HostKind;
  status: HostResolvedStatus;
  items?: FeedItemSummary[];
  cursor?: string | null;
  etag?: string | null;
  updated_at?: string;
  error_message?: string;
}

// =====================================================
// 16. WIDGET ACTION SHEET COMMANDS
// =====================================================

export enum WidgetActionCommand {
  REBIND_SCOPE = 'REBIND_SCOPE',
  SET_TARGET_USER = 'SET_TARGET_USER',
  SET_FILTERS = 'SET_FILTERS',
  SET_SORT = 'SET_SORT',
  TOGGLE_REALTIME = 'TOGGLE_REALTIME',
  OPEN_ITEM = 'OPEN_ITEM',
  DOCK = 'DOCK',
  RENAME = 'RENAME',
  SETTINGS = 'SETTINGS',
}

export interface WidgetAction {
  command: WidgetActionCommand;
  params?: Record<string, unknown>;
}

// =====================================================
// 17. WIDGET ENGINE STATE
// =====================================================

export interface WidgetEngineState {
  instances: Map<string, WidgetInstance>;
  definitions: Map<string, WidgetDefinition>;
  resolved: Map<string, HostResolved>;
  
  // Active gesture state
  activeGesture: boolean;
  
  // Current surface
  currentSurface: Surface;
  currentSurfaceKey: number;
}

// =====================================================
// 18. TYPE GUARDS
// =====================================================

export function isFeedHostConfig(config: HostConfig): config is FeedHostConfig {
  return 'scope' in config && typeof config.scope === 'number';
}

export function isCompositeHostConfig(config: HostConfig): config is CompositeHostConfig {
  return 'panes' in config && Array.isArray(config.panes);
}

// =====================================================
// 19. VALIDATION HELPERS
// =====================================================

export function validateFeedHostConfig(config: Partial<FeedHostConfig>): FeedHostConfig {
  const scope = config.scope ?? FeedScope.SELF;
  const target_user_id = scope === FeedScope.SELF ? null : config.target_user_id ?? null;
  const limit = Math.max(5, Math.min(200, config.limit ?? 25));
  
  return {
    scope,
    target_user_id,
    filters: config.filters ?? {},
    sort: config.sort ?? FeedSort.RECENT,
    limit,
    realtime: config.realtime ?? true,
    include_media: config.include_media ?? true,
    include_reposts: config.include_reposts ?? false,
  };
}

export function validateTransform(transform: Partial<WidgetTransform>): WidgetTransform {
  return {
    x: transform.x ?? 0,
    y: transform.y ?? 0,
    scale: Math.max(0.1, Math.min(10, transform.scale ?? 1)),
    rotation: transform.rotation ?? 0,
    opacity: Math.max(0, Math.min(1, transform.opacity ?? 1)),
  };
}
