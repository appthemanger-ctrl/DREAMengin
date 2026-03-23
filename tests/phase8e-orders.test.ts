/**
 * tests/phase8e-orders.test.ts
 *
 * Phase 8 §E — DreamShop orders migration and marketplace slot detail.
 * Tests verify the orders table migration SQL is well-formed and the
 * marketplace [id] page structure is spec-compliant.
 *
 * These are structural/contract tests — they don't require a live DB.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Phase 8 §E — DreamShop orders migration', () => {
  const migrationPath = join(
    process.cwd(),
    'supabase/migrations/20260324000000_phase8e_orders.sql',
  );

  it('orders migration file exists', () => {
    expect(() => readFileSync(migrationPath, 'utf-8')).not.toThrow();
  });

  it('orders table has required fields', () => {
    const sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('buyer_id');
    expect(sql).toContain('seller_id');
    expect(sql).toContain('item_id');
    expect(sql).toContain('amount');
    expect(sql).toContain('status');
  });

  it('orders table has RLS enabled', () => {
    const sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
  });

  it('RLS policy enforces buyer-only SELECT', () => {
    const sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('orders_buyer_select');
    expect(sql).toContain('auth.uid() = buyer_id');
  });

  it('seller can SELECT their own orders', () => {
    const sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('orders_seller_select');
    expect(sql).toContain('auth.uid() = seller_id');
  });

  it('INSERT policy restricts to buyer only', () => {
    const sql = readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('orders_buyer_insert');
    expect(sql).toContain('WITH CHECK');
  });
});

describe('Phase 8 §E — DreamMarketplace slot detail page', () => {
  const pagePath = join(process.cwd(), 'app/marketplace/[id]/page.tsx');

  it('marketplace [id] page file exists', () => {
    expect(() => readFileSync(pagePath, 'utf-8')).not.toThrow();
  });

  it('page reads from marketplace_items table', () => {
    const src = readFileSync(pagePath, 'utf-8');
    expect(src).toContain('marketplace_items');
  });

  it('page uses notFound() when record is missing', () => {
    const src = readFileSync(pagePath, 'utf-8');
    expect(src).toContain('notFound()');
  });

  it('contact flow routes to DreamDM (/messages)', () => {
    const src = readFileSync(pagePath, 'utf-8');
    expect(src).toContain('/messages');
  });

  it('page enforces published check before rendering', () => {
    const src = readFileSync(pagePath, 'utf-8');
    expect(src).toContain('is_published');
  });

  it('page requires authentication (redirect to /login)', () => {
    const src = readFileSync(pagePath, 'utf-8');
    expect(src).toContain('/login');
  });
});
