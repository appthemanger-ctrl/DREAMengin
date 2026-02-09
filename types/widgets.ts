// types/widgets.ts

// The core capabilities every widget can optionally support.
export interface WidgetCapabilities {
  canOpenFull?: boolean;
  canPreview?: boolean;
  canPost?: boolean;
  canShare?: boolean;
  canFocusMode?: boolean;
  canAddToFeed?: boolean;
  canRemoveFromFeed?: boolean;
}

// Optional widget-specific actions
export interface WidgetAction {
  id: string;
  label: string;
  icon?: string;
}

// Open-ended widget types (future-proof)
export type WidgetType =
  | "feed"
  | "text"
  | "media"
  | "profile_info"
  | "external_embed"
  | "gallery"
  | "album"
  | "link_tree"
  | "embed"
  | "youtube"
  | "social_profile"
  | "social_embed"
  | "social_feed"
  | "post"
  | "custom"
  | (string & {});

// Canonical widget shape (tolerant of old + new schemas)
export interface WidgetInstance {
  id: string;

  // ownership (either may exist)
  owner_id?: string;
  user_id?: string;

  title?: string;

  // type (either may exist)
  type?: WidgetType | string;
  widget_type?: WidgetType | string;

  // config (either may exist)
  config?: Record<string, unknown>;
  config_json?: Record<string, unknown>;

  capabilities?: WidgetCapabilities;
  actions?: WidgetAction[];
  is_enabled?: boolean;

  space?: "home" | "profile";
  order?: number;
  visibility?: "private" | "public" | "followers";
  layers?: WidgetLayer[];

  created_at?: string;
  updated_at?: string;

  // allow extra joined fields without breaking TS
  [key: string]: unknown;
}

export interface WidgetLayer {
  id: string;
  order: number;
  type: WidgetType;
  config?: Record<string, unknown>;
  visibility?: "visible" | "hidden";
  opacity?: number;
}

// -------- helpers --------

export function getWidgetType(widget: unknown): WidgetType | undefined {
  if (!widget || typeof widget !== 'object') return undefined;
  const w = widget as Record<string, unknown>;
  const type = w['type'];
  if (typeof type === 'string') return type as WidgetType;
  const widgetType = w['widget_type'];
  if (typeof widgetType === 'string') return widgetType as WidgetType;
  return undefined;
}

export function getWidgetConfig(widget: unknown): Record<string, unknown> {
  if (!widget || typeof widget !== 'object') return {};
  const w = widget as Record<string, unknown>;
  const configJson = w['config_json'];
  if (configJson && typeof configJson === 'object' && !Array.isArray(configJson)) {
    return configJson as Record<string, unknown>;
  }
  const config = w['config'];
  if (config && typeof config === 'object' && !Array.isArray(config)) {
    return config as Record<string, unknown>;
  }
  return {};
}

// -------- type guards (fix the “never” error) --------
export function isWidgetInstance(widget: unknown): widget is WidgetInstance {
  return !!widget && typeof widget === "object" && "id" in (widget as Record<string, unknown>);
}

export function isFeedWidget(widget: unknown): widget is WidgetInstance {
  return getWidgetType(widget) === "feed";
}

export function isTextWidget(widget: unknown): widget is WidgetInstance {
  return getWidgetType(widget) === "text";
}

export function isMediaWidget(widget: unknown): widget is WidgetInstance {
  return getWidgetType(widget) === "media";
}
