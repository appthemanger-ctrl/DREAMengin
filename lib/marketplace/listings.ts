/**
 * lib/marketplace/listings.ts
 *
 * DreamMarketplace listing business logic — pure functions, no DB calls.
 *
 * Used by:
 *   - app/api/marketplace/route.ts
 *   - app/marketplace/[id]/page.tsx
 *   - tests/phase8e-shop-marketplace.test.ts
 *
 * Architecture: docs/ARCHITECTURE.md §10 — business logic lives in lib/
 * Phase 8 §E:   Points 42, 43, 44
 */

// ── Schema constants ──────────────────────────────────────────────────────────

/** Canonical Supabase table name for DreamMarketplace listings. */
export const MARKETPLACE_TABLE = 'marketplace_items' as const;

/** Canonical Supabase table name for marketplace contact requests. */
export const MARKETPLACE_CONTACT_TABLE = 'marketplace_contact_requests' as const;

/** Valid listing categories. */
export const VALID_MARKETPLACE_CATEGORIES = [
  'widget',
  'theme',
  'connector',
  'music',
] as const;

export type MarketplaceCategory = typeof VALID_MARKETPLACE_CATEGORIES[number];

/** Maximum title length. */
export const MARKETPLACE_TITLE_MAX = 120;

/** Maximum tags per listing. */
export const MARKETPLACE_TAGS_MAX = 10;

/** Maximum tag character length. */
export const MARKETPLACE_TAG_MAX_LENGTH = 40;

// ── Types ─────────────────────────────────────────────────────────────────────

export type MarketplaceListingInput = {
  title: string;
  description?: string;
  category: string;
  price: number | string;
  tags?: string;
  preview_url?: string;
};

export type MarketplaceListingRecord = {
  seller_id:    string;
  title:        string;
  description:  string | null;
  category:     MarketplaceCategory;
  price_cents:  number;
  tags:         string[];
  is_published: false;    // always starts unpublished (LAW.md §2)
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validates raw inbound body for a new marketplace listing.
 */
export function validateMarketplaceListing(body: unknown): ValidationResult {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object.'] };
  }

  const b = body as Record<string, unknown>;

  const title = String(b.title ?? '').trim();
  if (!title) {
    errors.push('Title is required.');
  } else if (title.length > MARKETPLACE_TITLE_MAX) {
    errors.push(`Title must be ${MARKETPLACE_TITLE_MAX} characters or fewer.`);
  }

  const category = String(b.category ?? '').toLowerCase().trim();
  if (!VALID_MARKETPLACE_CATEGORIES.includes(category as MarketplaceCategory)) {
    errors.push(
      `Category must be one of: ${VALID_MARKETPLACE_CATEGORIES.join(', ')}.`,
    );
  }

  const priceFloat = parseFloat(String(b.price ?? 0));
  if (isNaN(priceFloat) || priceFloat < 0) {
    errors.push('Price must be a non-negative number.');
  }

  if (typeof b.tags === 'string') {
    const tags = b.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tags.length > MARKETPLACE_TAGS_MAX) {
      errors.push(`Maximum ${MARKETPLACE_TAGS_MAX} tags allowed.`);
    }
    const longTag = tags.find((t) => t.length > MARKETPLACE_TAG_MAX_LENGTH);
    if (longTag) {
      errors.push(`Each tag must be ${MARKETPLACE_TAG_MAX_LENGTH} characters or fewer.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Normalization ─────────────────────────────────────────────────────────────

/**
 * Maps validated client body to a DB-ready insert payload.
 * Price stored as integer cents (no float rounding issues).
 * is_published is always false (LAW.md §2: nothing public by default).
 */
export function normalizeMarketplaceListing(
  sellerId: string,
  input: MarketplaceListingInput,
): MarketplaceListingRecord {
  const title        = String(input.title ?? '').trim();
  const category     = String(input.category ?? '').toLowerCase().trim() as MarketplaceCategory;
  const priceFloat   = parseFloat(String(input.price ?? 0)) || 0;
  const priceCents   = Math.round(priceFloat * 100);
  const parsedTags   = typeof input.tags === 'string'
    ? input.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, MARKETPLACE_TAGS_MAX)
    : [];

  return {
    seller_id:    sellerId,
    title,
    description:  input.description?.trim() || null,
    category,
    price_cents:  priceCents,
    tags:         parsedTags,
    is_published: false,
  };
}

// ── Slot detail helpers ───────────────────────────────────────────────────────

/**
 * Returns the canonical detail route for a marketplace listing.
 * Used in MarketplaceListingCard and marketplace/[id]/page.tsx.
 * Point 43: navigation link from listing resolves to real data.
 */
export function marketplaceDetailRoute(itemId: string): string {
  return `/marketplace/${itemId}`;
}

/**
 * Formats price_cents for display.
 * Returns 'Free' for zero-price items.
 */
export function formatMarketplacePrice(priceCents: number): string {
  if (priceCents === 0) return 'Free';
  return `$${(priceCents / 100).toFixed(2)}`;
}
