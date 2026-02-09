// tests/unit/marketplace.test.ts
// Unit tests for marketplace types (§12)

import { isMarketplaceCategory, isMarketplaceListing } from '../../types/marketplace';

describe('Marketplace Types', () => {
  test('isMarketplaceCategory should validate valid categories', () => {
    expect(isMarketplaceCategory('widget')).toBe(true);
    expect(isMarketplaceCategory('game')).toBe(true);
    expect(isMarketplaceCategory('beat')).toBe(true);
    expect(isMarketplaceCategory('ai_agent')).toBe(true);
    expect(isMarketplaceCategory('workflow')).toBe(true);
    expect(isMarketplaceCategory('template')).toBe(true);
  });

  test('isMarketplaceCategory should reject invalid categories', () => {
    expect(isMarketplaceCategory('invalid')).toBe(false);
    expect(isMarketplaceCategory(42)).toBe(false);
    expect(isMarketplaceCategory(null)).toBe(false);
    expect(isMarketplaceCategory(undefined)).toBe(false);
  });

  test('isMarketplaceListing should validate full listing', () => {
    const listing = {
      id: 'lst-1',
      seller_id: 'user-1',
      category: 'widget',
      title: 'Cool Widget',
      price_model: 'free',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(isMarketplaceListing(listing)).toBe(true);
  });

  test('isMarketplaceListing should reject incomplete object', () => {
    expect(isMarketplaceListing({ id: 'x' })).toBe(false);
    expect(isMarketplaceListing(null)).toBe(false);
    expect(isMarketplaceListing('string')).toBe(false);
  });
});
