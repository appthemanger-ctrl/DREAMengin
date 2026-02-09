// types/marketplace.ts
// Section 12: Marketplace System
// Users can sell: Widgets, Games, Beats, AI Agents, Workflows, Templates

export type MarketplaceCategory =
  | "widget"
  | "game"
  | "beat"
  | "ai_agent"
  | "workflow"
  | "template";

export type MarketplaceStoreSurface = "widget" | "home_dream" | "system_layer";

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  category: MarketplaceCategory;
  title: string;
  description?: string;
  price: number;
  currency?: string;
  image_url?: string;
  preview_url?: string;
  // Where the store lives
  surface: MarketplaceStoreSurface;
  // Category-specific payload
  payload?: Record<string, unknown>;
  tags?: string[];
  downloads?: number;
  rating?: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketplacePurchase {
  id: string;
  buyer_id: string;
  listing_id: string;
  price_paid: number;
  currency: string;
  purchased_at: string;
}

export type CreateListingInput = Omit<
  MarketplaceListing,
  "id" | "downloads" | "rating" | "created_at" | "updated_at"
>;
