/**
 * tests/phase8e-shop-marketplace.test.ts
 *
 * Phase 8 §E regression tests — DreamShop & DreamMarketplace: Real Listings
 * Points 39–46.
 *
 * Architecture justification:
 *   - docs/dreamengin_phase8.md §E: DreamShop & DreamMarketplace spec
 *   - docs/ARCHITECTURE.md §10: Supabase for all data; business logic in lib/
 *   - docs/AXIOMS.md Axiom 4: Security by Default (auth before every write)
 *   - docs/AXIOMS.md Axiom 5: Privacy by Design (private by default)
 *   - docs/SECURITY.md: RLS on every user table
 *   - docs/LAW.md Product law 3: every visible action does real work
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ── Modules under test ────────────────────────────────────────────────────────

import {
  SHOP_TABLE,
  SHOP_ORDERS_TABLE,
  SHOP_LISTING_REQUIRED_FIELDS,
  SHOP_TITLE_MAX_LENGTH,
  SHOP_PRICE_MIN,
  validateShopListing,
  normalizeShopListing,
  isOrderOwner,
  SHOP_ORDERS_PRIVATE_FIELDS,
} from '@/lib/shop/listings';

import {
  MARKETPLACE_TABLE,
  MARKETPLACE_CONTACT_TABLE,
  VALID_MARKETPLACE_CATEGORIES,
  MARKETPLACE_TITLE_MAX,
  MARKETPLACE_TAGS_MAX,
  MARKETPLACE_TAG_MAX_LENGTH,
  validateMarketplaceListing,
  normalizeMarketplaceListing,
  marketplaceDetailRoute,
  formatMarketplacePrice,
} from '@/lib/marketplace/listings';

import {
  validateContactRequest,
  buildContactRequestRecord,
  CONTACT_REQUEST_MESSAGE_MAX,
} from '@/lib/marketplace/request';

// ── Helper: read migration file ───────────────────────────────────────────────

function readMigration(filename: string): string {
  const migDir = path.resolve(__dirname, '../supabase/migrations');
  const fullPath = path.join(migDir, filename);
  return fs.readFileSync(fullPath, 'utf-8');
}

const PHASE8E_MIGRATION = readMigration('20260324000001_phase8e_shop_marketplace.sql');

// ════════════════════════════════════════════════════════════════════════════════
// Point 39 — DreamShop real listing capability
// ════════════════════════════════════════════════════════════════════════════════

describe('Phase 8 §E Point 39 — DreamShop real listing capability', () => {
  it('SHOP_TABLE references the canonical merch database table', () => {
    expect(SHOP_TABLE).toBe('merch');
  });

  it('shop/page.tsx queries the merch table (no static arrays)', () => {
    const shopPage = fs.readFileSync(
      path.resolve(__dirname, '../app/shop/page.tsx'),
      'utf-8',
    );
    expect(shopPage).toContain(".from('merch')");
    // Must not contain hardcoded static item arrays
    expect(shopPage).not.toMatch(/const\s+(items|mockItems|staticItems)\s*=\s*\[/);
  });

  it('shop/page.tsx fetches owner listings scoped to user.id', () => {
    const shopPage = fs.readFileSync(
      path.resolve(__dirname, '../app/shop/page.tsx'),
      'utf-8',
    );
    expect(shopPage).toContain('user.id');
    expect(shopPage).toContain('merch');
  });

  it('migration adds user_id and name columns to merch', () => {
    expect(PHASE8E_MIGRATION).toContain('ADD COLUMN IF NOT EXISTS user_id');
    expect(PHASE8E_MIGRATION).toContain('ADD COLUMN IF NOT EXISTS name');
  });

  it('migration enables RLS on merch', () => {
    expect(PHASE8E_MIGRATION).toContain(
      'ALTER TABLE public.merch ENABLE ROW LEVEL SECURITY',
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Point 40 — DreamShop item create flow
// ════════════════════════════════════════════════════════════════════════════════

describe('Phase 8 §E Point 40 — DreamShop item create flow', () => {
  it('validateShopListing accepts a valid listing', () => {
    const result = validateShopListing({ title: 'My Item', price: 9.99 });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validateShopListing rejects missing title', () => {
    const result = validateShopListing({ price: 5 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /title/i.test(e))).toBe(true);
  });

  it('validateShopListing rejects empty title', () => {
    const result = validateShopListing({ title: '   ', price: 5 });
    expect(result.valid).toBe(false);
  });

  it('validateShopListing rejects title exceeding max length', () => {
    const result = validateShopListing({
      title: 'x'.repeat(SHOP_TITLE_MAX_LENGTH + 1),
      price: 5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /title/i.test(e))).toBe(true);
  });

  it('validateShopListing rejects missing price', () => {
    const result = validateShopListing({ title: 'Valid Title' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /price/i.test(e))).toBe(true);
  });

  it('normalizeShopListing maps title → name for DB insert', () => {
    const record = normalizeShopListing('user-123', {
      title: '  My Item  ',
      price: '19.99',
    });
    expect(record.user_id).toBe('user-123');
    expect(record.name).toBe('My Item');
    expect(record.price).toBe(19.99);
  });

  it('normalizeShopListing sets null for optional missing fields', () => {
    const record = normalizeShopListing('user-abc', {
      title: 'Minimal Item',
      price: 0,
    });
    expect(record.description).toBeNull();
    expect(record.image_url).toBeNull();
  });

  it('SHOP_LISTING_REQUIRED_FIELDS contains name, price, user_id', () => {
    expect(SHOP_LISTING_REQUIRED_FIELDS).toContain('name');
    expect(SHOP_LISTING_REQUIRED_FIELDS).toContain('price');
    expect(SHOP_LISTING_REQUIRED_FIELDS).toContain('user_id');
  });

  it('sell page routes through /api/shop (real API response — Point 45)', () => {
    const sellPage = fs.readFileSync(
      path.resolve(__dirname, '../app/shop/sell/page.tsx'),
      'utf-8',
    );
    // Must call the API route, not direct Supabase insert
    expect(sellPage).toContain("fetch('/api/shop'");
    expect(sellPage).toContain("method: 'POST'");
    // Must no longer call supabase.from('merch').insert directly for create
    expect(sellPage).not.toContain(".from('merch').insert(");
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Point 41 — DreamShop order history private by default
// ════════════════════════════════════════════════════════════════════════════════

describe('Phase 8 §E Point 41 — DreamShop order history private by default', () => {
  it('SHOP_ORDERS_TABLE is shop_orders', () => {
    expect(SHOP_ORDERS_TABLE).toBe('shop_orders');
  });

  it('migration creates shop_orders table', () => {
    expect(PHASE8E_MIGRATION).toContain(
      'CREATE TABLE IF NOT EXISTS public.shop_orders',
    );
  });

  it('migration enables RLS on shop_orders', () => {
    expect(PHASE8E_MIGRATION).toContain(
      'ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY',
    );
  });

  it('migration creates owner-read-only policy for shop_orders', () => {
    expect(PHASE8E_MIGRATION).toContain('shop_orders_owner_read');
    // Policy must check buyer_id OR seller_id — no public access
    expect(PHASE8E_MIGRATION).toContain(
      'auth.uid() = buyer_id OR auth.uid() = seller_id',
    );
  });

  it('shop_orders table has buyer_id and seller_id columns', () => {
    expect(PHASE8E_MIGRATION).toContain('buyer_id');
    expect(PHASE8E_MIGRATION).toContain('seller_id');
  });

  it('SHOP_ORDERS_PRIVATE_FIELDS marks seller_notes as private', () => {
    expect(SHOP_ORDERS_PRIVATE_FIELDS).toContain('seller_notes');
  });

  it('isOrderOwner returns true for the buyer', () => {
    expect(
      isOrderOwner('buyer-id', { buyer_id: 'buyer-id', seller_id: 'seller-id' }),
    ).toBe(true);
  });

  it('isOrderOwner returns true for the seller', () => {
    expect(
      isOrderOwner('seller-id', { buyer_id: 'buyer-id', seller_id: 'seller-id' }),
    ).toBe(true);
  });

  it('isOrderOwner returns false for a third party', () => {
    expect(
      isOrderOwner('random-user', { buyer_id: 'buyer-id', seller_id: 'seller-id' }),
    ).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Point 42 — DreamMarketplace real listing capability
// ════════════════════════════════════════════════════════════════════════════════

describe('Phase 8 §E Point 42 — DreamMarketplace real listing capability', () => {
  it('MARKETPLACE_TABLE references marketplace_items', () => {
    expect(MARKETPLACE_TABLE).toBe('marketplace_items');
  });

  it('marketplace/page.tsx queries marketplace_items (no mock arrays)', () => {
    const mpPage = fs.readFileSync(
      path.resolve(__dirname, '../app/marketplace/page.tsx'),
      'utf-8',
    );
    expect(mpPage).toContain(".from('marketplace_items')");
    // Fallback categories are UI scaffolding when DB is empty, not mock data
    // but must not replace DB-backed listings with static content arrays
    expect(mpPage).not.toMatch(/const\s+(listings|mockListings|staticListings)\s*=\s*\[/);
  });

  it('marketplace_items table has RLS in migration', () => {
    expect(PHASE8E_MIGRATION).toContain(
      'ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY',
    );
  });

  it('marketplace RLS policy requires auth for published reads', () => {
    // Policy must require auth.uid() IS NOT NULL for public listings
    expect(PHASE8E_MIGRATION).toContain('auth.uid() IS NOT NULL');
  });

  it('validateMarketplaceListing accepts a valid listing', () => {
    const result = validateMarketplaceListing({
      title: 'Dark Theme Pack',
      category: 'theme',
      price: 4.99,
    });
    expect(result.valid).toBe(true);
  });

  it('validateMarketplaceListing rejects invalid category', () => {
    const result = validateMarketplaceListing({
      title: 'Some Item',
      category: 'gadget',
      price: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /category/i.test(e))).toBe(true);
  });

  it('VALID_MARKETPLACE_CATEGORIES includes all four types', () => {
    expect(VALID_MARKETPLACE_CATEGORIES).toContain('widget');
    expect(VALID_MARKETPLACE_CATEGORIES).toContain('theme');
    expect(VALID_MARKETPLACE_CATEGORIES).toContain('connector');
    expect(VALID_MARKETPLACE_CATEGORIES).toContain('music');
  });

  it('normalizeMarketplaceListing stores price as integer cents', () => {
    const record = normalizeMarketplaceListing('seller-id', {
      title: 'My Widget',
      category: 'widget',
      price: 4.99,
    });
    expect(record.price_cents).toBe(499);
  });

  it('normalizeMarketplaceListing defaults is_published to false', () => {
    const record = normalizeMarketplaceListing('seller-id', {
      title: 'My Widget',
      category: 'widget',
      price: 0,
    });
    expect(record.is_published).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Point 43 — DreamMarketplace slot detail from real DB record
// ════════════════════════════════════════════════════════════════════════════════

describe('Phase 8 §E Point 43 — DreamMarketplace slot detail surface', () => {
  it('detail page file exists at app/marketplace/[id]/page.tsx', () => {
    const detailPage = path.resolve(
      __dirname,
      '../app/marketplace/[id]/page.tsx',
    );
    expect(fs.existsSync(detailPage)).toBe(true);
  });

  it('detail page reads from marketplace_items by id', () => {
    const detailPage = fs.readFileSync(
      path.resolve(__dirname, '../app/marketplace/[id]/page.tsx'),
      'utf-8',
    );
    expect(detailPage).toContain(".from('marketplace_items')");
    expect(detailPage).toContain('.eq(\'id\'');
  });

  it('detail page calls notFound() when record is missing', () => {
    const detailPage = fs.readFileSync(
      path.resolve(__dirname, '../app/marketplace/[id]/page.tsx'),
      'utf-8',
    );
    expect(detailPage).toContain('notFound()');
  });

  it('marketplaceDetailRoute returns /marketplace/<id>', () => {
    expect(marketplaceDetailRoute('abc-123')).toBe('/marketplace/abc-123');
  });

  it('MarketplaceListingCard already links to /marketplace/[id]', () => {
    const card = fs.readFileSync(
      path.resolve(__dirname, '../components/marketplace/MarketplaceListingCard.tsx'),
      'utf-8',
    );
    expect(card).toContain('/marketplace/${item.id}');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Point 44 — Public listings auth-gated; private data owner-only
// ════════════════════════════════════════════════════════════════════════════════

describe('Phase 8 §E Point 44 — Public listings auth-gated; private data owner-only', () => {
  it('merch RLS select policy requires auth.uid() IS NOT NULL', () => {
    expect(PHASE8E_MIGRATION).toContain('merch_select_authenticated');
    expect(PHASE8E_MIGRATION).toContain('auth.uid() IS NOT NULL');
  });

  it('shop_orders RLS policy never allows public access', () => {
    // Policy checks buyer_id OR seller_id — no catch-all TRUE
    const ordersBlock = PHASE8E_MIGRATION.slice(
      PHASE8E_MIGRATION.indexOf('shop_orders_owner_read'),
    ).slice(0, 300);
    expect(ordersBlock).not.toMatch(/USING\s*\(\s*true\s*\)/i);
  });

  it('marketplace RLS select policy requires auth for public items', () => {
    expect(PHASE8E_MIGRATION).toContain(
      'is_published = true AND auth.uid() IS NOT NULL',
    );
  });

  it('marketplace_contact_requests RLS restricts to participants', () => {
    expect(PHASE8E_MIGRATION).toContain('mcr_participant_read');
    expect(PHASE8E_MIGRATION).toContain(
      'auth.uid() = requester_id OR auth.uid() = seller_id',
    );
  });

  it('shop/page.tsx does not select seller_notes', () => {
    const shopPage = fs.readFileSync(
      path.resolve(__dirname, '../app/shop/page.tsx'),
      'utf-8',
    );
    expect(shopPage).not.toContain('seller_notes');
  });

  it('marketplace detail page redirects to /login when unauthenticated', () => {
    const detailPage = fs.readFileSync(
      path.resolve(__dirname, '../app/marketplace/[id]/page.tsx'),
      'utf-8',
    );
    expect(detailPage).toContain("redirect('/login')");
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Point 45 — DreamShop sell flow creates real listing with real API response
// ════════════════════════════════════════════════════════════════════════════════

describe('Phase 8 §E Point 45 — DreamShop sell flow real API response', () => {
  it('sell page POSTs to /api/shop (not direct Supabase)', () => {
    const sellPage = fs.readFileSync(
      path.resolve(__dirname, '../app/shop/sell/page.tsx'),
      'utf-8',
    );
    expect(sellPage).toContain("fetch('/api/shop'");
    expect(sellPage).toContain("method: 'POST'");
  });

  it('sell page checks response status before redirecting', () => {
    const sellPage = fs.readFileSync(
      path.resolve(__dirname, '../app/shop/sell/page.tsx'),
      'utf-8',
    );
    expect(sellPage).toContain('res.ok');
  });

  it('/api/shop route file exists', () => {
    expect(
      fs.existsSync(path.resolve(__dirname, '../app/api/shop/route.ts')),
    ).toBe(true);
  });

  it('/api/shop route imports validateShopListing from lib/shop/listings', () => {
    const apiRoute = fs.readFileSync(
      path.resolve(__dirname, '../app/api/shop/route.ts'),
      'utf-8',
    );
    expect(apiRoute).toContain('validateShopListing');
    expect(apiRoute).toContain('normalizeShopListing');
  });

  it('/api/shop route returns 401 for unauthenticated POST (code check)', () => {
    const apiRoute = fs.readFileSync(
      path.resolve(__dirname, '../app/api/shop/route.ts'),
      'utf-8',
    );
    expect(apiRoute).toContain("status: 401");
    expect(apiRoute).toContain('Unauthorized');
  });

  it('/api/shop route returns 201 on successful insert (code check)', () => {
    const apiRoute = fs.readFileSync(
      path.resolve(__dirname, '../app/api/shop/route.ts'),
      'utf-8',
    );
    expect(apiRoute).toContain('status: 201');
  });

  it('price is stored as a number (SHOP_PRICE_MIN = 0 allows free items)', () => {
    expect(SHOP_PRICE_MIN).toBe(0);
    const record = normalizeShopListing('u', { title: 'Free Item', price: 0 });
    expect(record.price).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Point 46 — DreamMarketplace "Request" flow routes to real system action
// ════════════════════════════════════════════════════════════════════════════════

describe('Phase 8 §E Point 46 — DreamMarketplace Request/contact flow', () => {
  it('MARKETPLACE_CONTACT_TABLE is marketplace_contact_requests', () => {
    expect(MARKETPLACE_CONTACT_TABLE).toBe('marketplace_contact_requests');
  });

  it('migration creates marketplace_contact_requests table', () => {
    expect(PHASE8E_MIGRATION).toContain(
      'CREATE TABLE IF NOT EXISTS public.marketplace_contact_requests',
    );
  });

  it('/api/marketplace/request/route.ts exists', () => {
    expect(
      fs.existsSync(
        path.resolve(__dirname, '../app/api/marketplace/request/route.ts'),
      ),
    ).toBe(true);
  });

  it('/api/marketplace/request route inserts into marketplace_contact_requests', () => {
    const route = fs.readFileSync(
      path.resolve(__dirname, '../app/api/marketplace/request/route.ts'),
      'utf-8',
    );
    expect(route).toContain("'marketplace_contact_requests'");
    expect(route).toContain('.insert(');
  });

  it('/api/marketplace/request returns 401 for unauthenticated requests', () => {
    const route = fs.readFileSync(
      path.resolve(__dirname, '../app/api/marketplace/request/route.ts'),
      'utf-8',
    );
    expect(route).toContain('status: 401');
    expect(route).toContain('Unauthorized');
  });

  it('/api/marketplace/request returns 201 on success', () => {
    const route = fs.readFileSync(
      path.resolve(__dirname, '../app/api/marketplace/request/route.ts'),
      'utf-8',
    );
    expect(route).toContain('status: 201');
  });

  it('validateContactRequest accepts valid body', () => {
    const result = validateContactRequest({ item_id: 'abc-123', message: 'Hi!' });
    expect(result.valid).toBe(true);
  });

  it('validateContactRequest rejects missing item_id', () => {
    const result = validateContactRequest({ message: 'Hello' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /item_id/i.test(e))).toBe(true);
  });

  it('validateContactRequest rejects message over max length', () => {
    const result = validateContactRequest({
      item_id: 'abc',
      message: 'x'.repeat(CONTACT_REQUEST_MESSAGE_MAX + 1),
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /message/i.test(e))).toBe(true);
  });

  it('buildContactRequestRecord constructs the correct record shape', () => {
    const record = buildContactRequestRecord('requester-id', 'seller-id', {
      item_id: 'item-abc',
      message: 'I am interested',
    });
    expect(record.requester_id).toBe('requester-id');
    expect(record.seller_id).toBe('seller-id');
    expect(record.item_id).toBe('item-abc');
    expect(record.message).toBe('I am interested');
    expect(record.status).toBe('pending');
  });

  it('buildContactRequestRecord sets status to pending by default', () => {
    const record = buildContactRequestRecord('r', 's', { item_id: 'i' });
    expect(record.status).toBe('pending');
  });

  it('buildContactRequestRecord sets message to null when not provided', () => {
    const record = buildContactRequestRecord('r', 's', { item_id: 'i' });
    expect(record.message).toBeNull();
  });

  it('MarketplaceRequestButton component exists', () => {
    expect(
      fs.existsSync(
        path.resolve(
          __dirname,
          '../components/marketplace/MarketplaceRequestButton.tsx',
        ),
      ),
    ).toBe(true);
  });

  it('MarketplaceRequestButton POSTs to /api/marketplace/request', () => {
    const btn = fs.readFileSync(
      path.resolve(
        __dirname,
        '../components/marketplace/MarketplaceRequestButton.tsx',
      ),
      'utf-8',
    );
    expect(btn).toContain("'/api/marketplace/request'");
    expect(btn).toContain("method:  'POST'");
  });

  it('marketplace detail page renders the request button', () => {
    const detailPage = fs.readFileSync(
      path.resolve(__dirname, '../app/marketplace/[id]/page.tsx'),
      'utf-8',
    );
    expect(detailPage).toContain('MarketplaceRequestButton');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Cross-cutting — price formatting utility
// ════════════════════════════════════════════════════════════════════════════════

describe('formatMarketplacePrice helper', () => {
  it('returns "Free" for 0 cents', () => {
    expect(formatMarketplacePrice(0)).toBe('Free');
  });

  it('returns dollar amount for non-zero cents', () => {
    expect(formatMarketplacePrice(499)).toBe('$4.99');
    expect(formatMarketplacePrice(100)).toBe('$1.00');
    expect(formatMarketplacePrice(1000)).toBe('$10.00');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Cross-cutting — MARKETPLACE_TAGS validation edge cases
// ════════════════════════════════════════════════════════════════════════════════

describe('Marketplace tag validation edge cases', () => {
  it('accepts a listing with no tags', () => {
    const result = validateMarketplaceListing({
      title: 'No Tags Widget',
      category: 'widget',
      price: 0,
    });
    expect(result.valid).toBe(true);
  });

  it('rejects more than MARKETPLACE_TAGS_MAX tags', () => {
    const tags = Array.from({ length: MARKETPLACE_TAGS_MAX + 1 }, (_, i) => `tag${i}`).join(',');
    const result = validateMarketplaceListing({
      title: 'Too Many Tags',
      category: 'theme',
      price: 0,
      tags,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /tag/i.test(e))).toBe(true);
  });

  it('rejects a tag exceeding MARKETPLACE_TAG_MAX_LENGTH characters', () => {
    const tags = 'x'.repeat(MARKETPLACE_TAG_MAX_LENGTH + 1);
    const result = validateMarketplaceListing({
      title: 'Long Tag Widget',
      category: 'widget',
      price: 0,
      tags,
    });
    expect(result.valid).toBe(false);
  });

  it('normalizeMarketplaceListing trims and lowercases tags', () => {
    const record = normalizeMarketplaceListing('seller', {
      title: 'Item',
      category: 'widget',
      price: 0,
      tags: '  DARK ,  Glass , minimal ',
    });
    expect(record.tags).toEqual(['dark', 'glass', 'minimal']);
  });
});
