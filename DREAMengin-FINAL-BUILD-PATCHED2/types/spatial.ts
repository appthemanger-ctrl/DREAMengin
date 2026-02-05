// SPATIAL PLATFORM TYPES
// Based on Widget-First Spatial Platform Canonical Spec

// =============================================================================
// SPACE TYPES
// =============================================================================

export type SpaceType = "home" | "profile";

export interface Space {
  id: string;
  user_id: string;
  type: SpaceType;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// CONTENT OBJECT TYPES (Stored privately in HOME)
// =============================================================================

export type ContentType = 
  | "image" 
  | "video" 
  | "audio" 
  | "text" 
  | "file" 
  | "link" 
  | "embed";

export type ContentVisibility = "private" | "shared";

export interface ContentObject {
  id: string;
  user_id: string;
  type: ContentType;
  title?: string;
  description?: string;
  // Storage reference (blob URL, file path, etc.)
  storage_url?: string;
  // For text content
  text_content?: string;
  // For links/embeds
  external_url?: string;
  // Metadata
  metadata: Record<string, unknown>;
  // Always starts as private
  visibility: ContentVisibility;
  // Timestamps
  created_at: string;
  updated_at: string;
}

// =============================================================================
// ALBUM/COLLECTION TYPES (Private organization in HOME)
// =============================================================================

export interface Album {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  cover_content_id?: string; // Reference to a content object for cover
  // Albums are always private by default
  is_shared: boolean;
  // If shared, what subset is visible
  shared_content_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface AlbumContent {
  id: string;
  album_id: string;
  content_id: string;
  order: number;
  created_at: string;
}

// =============================================================================
// WIDGET TYPES (Spatial surfaces that reference content)
// =============================================================================

export type WidgetType =
  | "feed"           // Feed widget (optional, not default)
  | "gallery"        // Grid/masonry of media
  | "album"          // Album viewer widget
  | "text"           // Text/bio/notes widget
  | "media"          // Single media display
  | "profile_info"   // Profile information widget
  | "link_tree"      // Links collection
  | "embed"          // External embed (Spotify, YouTube, etc.)
  | "custom";        // Custom widget

export type WidgetVisibility = "private" | "public" | "followers";

// Link type for overlap between HOME and PROFILE
export type OverlapLinkType = 
  | "copy"      // Content is copied (snapshot)
  | "linked"    // Content updates live
  | "snapshot"; // One-time snapshot, never updates

export interface Widget {
  id: string;
  user_id: string;
  // Which space this widget belongs to
  space: SpaceType;
  // Widget type
  type: WidgetType;
  // Display properties
  title?: string;
  description?: string;
  // Position in the carousel (cyclic navigation)
  order: number;
  // Widget configuration
  config: WidgetConfig;
  // Visibility (only relevant for PROFILE widgets)
  visibility: WidgetVisibility;
  // If this is a PROFILE widget that references HOME content
  overlap?: OverlapConfig;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface WidgetConfig {
  // Type-specific configuration
  [key: string]: unknown;
  // Common config options
  layout?: "grid" | "list" | "carousel" | "masonry" | "single";
  columns?: number;
  showTitle?: boolean;
  showDescription?: boolean;
  backgroundColor?: string;
  // For feed widgets
  scope?: "me" | "following";
}

// =============================================================================
// OVERLAP SYSTEM (HOME -> PROFILE sharing)
// =============================================================================

export interface OverlapConfig {
  // How the content is linked
  link_type: OverlapLinkType;
  // Source content/album in HOME
  source_content_ids?: string[];
  source_album_id?: string;
  // When the overlap was created
  created_at: string;
  // For snapshots, when it was last synced
  last_synced_at?: string;
}

export interface ShareIntent {
  // Content to share
  content_ids?: string[];
  album_id?: string;
  // How to share
  link_type: OverlapLinkType;
  // Where to surface (always PROFILE)
  target_widget_id?: string; // Existing widget, or
  create_new_widget?: {
    type: WidgetType;
    title?: string;
    config?: WidgetConfig;
  };
  // Visibility
  visibility: WidgetVisibility;
}

// =============================================================================
// WIDGET CONTENT REFERENCE (Links widgets to content)
// =============================================================================

export interface WidgetContent {
  id: string;
  widget_id: string;
  content_id: string;
  order: number;
  // Display overrides (can override content's default display)
  display_override?: {
    title?: string;
    description?: string;
  };
  created_at: string;
}

// =============================================================================
// FEED TYPES (Feed is an OPTIONAL widget, not the primary interface)
// =============================================================================

export interface FeedItem {
  id: string;
  user_id: string;
  // Only shared content appears in feeds
  widget_id: string;
  content_id?: string;
  // Feed item type
  type: "widget_shared" | "content_added" | "album_shared";
  // Timestamp
  created_at: string;
}

// =============================================================================
// NAVIGATION STATE
// =============================================================================

export interface NavigationState {
  // Current space
  space: SpaceType;
  // Current widget index in carousel
  currentIndex: number;
  // Total widgets
  totalWidgets: number;
  // Direction of last navigation
  lastDirection?: "left" | "right";
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isContentObject(obj: unknown): obj is ContentObject {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "type" in obj &&
    "user_id" in obj &&
    "visibility" in obj
  );
}

export function isWidget(obj: unknown): obj is Widget {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "space" in obj &&
    "type" in obj &&
    "order" in obj
  );
}

export function isAlbum(obj: unknown): obj is Album {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "title" in obj &&
    "is_shared" in obj
  );
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type CreateContentInput = Omit<ContentObject, "id" | "created_at" | "updated_at" | "visibility"> & {
  visibility?: ContentVisibility;
};

export type CreateWidgetInput = Omit<Widget, "id" | "created_at" | "updated_at">;

export type CreateAlbumInput = Omit<Album, "id" | "created_at" | "updated_at" | "is_shared"> & {
  is_shared?: boolean;
};

export type UpdateContentInput = Partial<Omit<ContentObject, "id" | "user_id" | "created_at">>;

export type UpdateWidgetInput = Partial<Omit<Widget, "id" | "user_id" | "created_at">>;