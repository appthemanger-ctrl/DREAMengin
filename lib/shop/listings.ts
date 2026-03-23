/**
 * lib/shop/listings.ts
 *
 * DreamShop listing business logic — pure functions, no DB calls.
 *
 * Used by:
 *   - app/api/shop/route.ts (POST handler)
 *   - tests/phase8e-shop-marketplace.test.ts
 *
 * Architecture: docs/ARCHITECTURE.md §10 — business logic lives in lib/
 * Security:     docs/SECURITY.md — server-side validation before any DB write
 * Phase 8 §E:   Points 39, 40, 44, 45
 */

// ── Schema constants ──────────────────────────────────────────────────────────

/** Canonical Supabase table name for DreamShop listings. */
export const SHOP_TABLE = 'merch' as const;

/** Minimum required fields that every shop listing must carry. */
export const SHOP_LISTING_REQUIRED_FIELDS = ['name', 'price', 'user_id'] as const;

/** Maximum title length enforced by the API layer (not only DB). */
export const SHOP_TITLE_MAX_LENGTH = 200;

/** Minimum valid price (0 = free is allowed). */
export const SHOP_PRICE_MIN = 0;

// ── Types ─────────────────────────────────────────────────────────────────────

export type ShopListingInput = {
  title: string;          // inbound field name from form / client body
  description?: string;
  price: number | string;
  stock?: number | string;
  image_url?: string;
  category?: string;
};

export type ShopListingRecord = {
  user_id: string;
  name: string;           // DB column name
  description: string | null;
  price: number;
  image_url: string | null;
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validates raw inbound body for a new shop listing.
 * Returns `valid: true` only when all business rules pass.
 */
export function validateShopListing(body: unknown): ValidationResult {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object.'] };
  }

  const b = body as Record<string, unknown>;

  // Title / name
  const titleRaw = (b.title ?? b.name ?? '') as string;
  const title = String(titleRaw).trim();
  if (!title) {
    errors.push('Title is required.');
  } else if (title.length > SHOP_TITLE_MAX_LENGTH) {
    errors.push(`Title must be ${SHOP_TITLE_MAX_LENGTH} characters or fewer.`);
  }

  // Price
  const priceRaw = b.price;
  if (priceRaw === undefined || priceRaw === null || priceRaw === '') {
    errors.push('Price is required.');
  } else {
    const price = parseFloat(String(priceRaw));
    if (isNaN(price) || price < SHOP_PRICE_MIN) {
      errors.push(`Price must be a non-negative number.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Normalization ─────────────────────────────────────────────────────────────

/**
 * Maps validated client body to a DB-ready insert payload.
 * Caller is responsible for running validateShopListing first.
 */
export function normalizeShopListing(
  userId: string,
  input: ShopListingInput,
): ShopListingRecord {
  const title = String(input.title ?? '').trim();
  const price = parseFloat(String(input.price));

  return {
    user_id:     userId,
    name:        title,
    description: input.description?.trim() || null,
    price:       price,
    image_url:   input.image_url?.trim() || null,
  };
}

// ── Order privacy helpers ──────────────────────────────────────────────────────

/** Canonical table name for DreamShop order history. */
export const SHOP_ORDERS_TABLE = 'shop_orders' as const;

/**
 * Fields in shop_orders that are NEVER exposed outside owner-scoped reads.
 * Referenced in RLS policies and API serialization.
 */
export const SHOP_ORDERS_PRIVATE_FIELDS = ['seller_notes'] as const;

/**
 * Returns true if the given userId is the buyer OR seller for an order record.
 * Used as the application-layer guard that mirrors the RLS policy.
 */
export function isOrderOwner(
  userId: string,
  order: { buyer_id: string; seller_id: string },
): boolean {
  return userId === order.buyer_id || userId === order.seller_id;
}
