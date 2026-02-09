// types/marketplace.ts
// Marketplace System (§12): Users can sell widgets, games, beats, AI agents,
// workflows, and templates. The store lives as a widget, home dream, or system layer.

// =============================================================================
// LISTING CATEGORIES
// =============================================================================

export type MarketplaceCategory =
  | "widget"
  | "game"
  | "beat"
  | "ai_agent"
  | "workflow"
  | "template";

export type ListingStatus = "draft" | "active" | "paused" | "sold" | "removed";

export type PriceModel = "free" | "one-time" | "subscription" | "tip" | "auction";

// =============================================================================
// MARKETPLACE LISTING
// =============================================================================

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  category: MarketplaceCategory;
  title: string;
  description?: string;
  tags?: string[];

  // Pricing
  price_model: PriceModel;
  price?: number;
  currency?: string;

  // Status
  status: ListingStatus;

  // Downloadable / reference
  asset_url?: string;
  preview_url?: string;
  thumbnail_url?: string;

  // For widget listings: the widget config that buyers receive
  widget_config?: Record<string, unknown>;
  // For AI agent listings: the agent definition
  agent_config?: Record<string, unknown>;
  // For workflow listings: the chain definition
  workflow_steps?: Array<{ action: string; payload?: Record<string, unknown> }>;

  // Stats
  downloads?: number;
  rating?: number;
  review_count?: number;

  created_at: string;
  updated_at: string;
}

// =============================================================================
// STORE SURFACE (§12): store lives as Widget | Home Dream | System Layer
// =============================================================================

export type StoreSurface = "widget" | "home_dream" | "system_layer";

export interface StoreConfig {
  surface: StoreSurface;
  featured_listing_ids?: string[];
  categories_shown?: MarketplaceCategory[];
  layout?: "grid" | "list" | "carousel";
}

// =============================================================================
// PURCHASE / TRANSACTION
// =============================================================================

export interface MarketplacePurchase {
  id: string;
  buyer_id: string;
  listing_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  purchased_at: string;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

const VALID_CATEGORIES: ReadonlySet<string> = new Set([
  "widget", "game", "beat", "ai_agent", "workflow", "template",
]);

export function isMarketplaceCategory(value: unknown): value is MarketplaceCategory {
  return typeof value === "string" && VALID_CATEGORIES.has(value);
}

export function isMarketplaceListing(obj: unknown): obj is MarketplaceListing {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.seller_id === "string" &&
    isMarketplaceCategory(o.category) &&
    typeof o.title === "string"
  );
}
