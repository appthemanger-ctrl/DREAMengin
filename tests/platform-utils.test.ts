/**
 * tests/platform-utils.test.ts
 *
 * Tests for the DREAMengin platform utility modules:
 *   - lib/platform/lab.ts          (logPhysicsExperiment)
 *   - app/api/ads/orders/route.ts  (processAdOrder server route)
 *   - app/api/gal/route.ts         (syncToGlobalRegistry server route)
 *   - lib/platform/index.ts        (public API surface)
 *
 * These are unit tests — no live DB required.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

// ── Mock Supabase clients ─────────────────────────────────────────────────────

const createBrowserClient = vi.fn();
const createServerClient  = vi.fn();

vi.mock('@/lib/supabase/client', () => ({ createClient: createBrowserClient }));
vi.mock('@/lib/supabase/server', () => ({ createServerClient }));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUpdateMock(result: object) {
  const eqFn  = vi.fn().mockResolvedValue(result);
  const update = vi.fn(() => ({ eq: eqFn }));
  return { update, eqFn };
}

function makeInsertMock(result: object) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  return { insert, select, single };
}

function makeUpsertMock(result: object) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn(() => ({ single }));
  const upsert = vi.fn(() => ({ select }));
  return { upsert, select, single };
}

// ── lib/platform/lab.ts ───────────────────────────────────────────────────────

describe('logPhysicsExperiment', () => {
  afterEach(() => vi.clearAllMocks());

  it('updates physics_experiments row with telemetry data', async () => {
    const mock = makeUpdateMock({ error: null });
    createBrowserClient.mockReturnValue({
      from: vi.fn(() => ({ update: mock.update })),
    });

    const { logPhysicsExperiment } = await import('../lib/platform/lab');
    await logPhysicsExperiment('exp-123', { fps: 60, memMB: 128 });

    expect(mock.update).toHaveBeenCalledWith(
      expect.objectContaining({ performance_metrics: { fps: 60, memMB: 128 } }),
    );
    expect(mock.eqFn).toHaveBeenCalledWith('id', 'exp-123');
  });

  it('logs an error but does not throw on DB failure', async () => {
    const mock = makeUpdateMock({ error: { message: 'RLS violation' } });
    createBrowserClient.mockReturnValue({
      from: vi.fn(() => ({ update: mock.update })),
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { logPhysicsExperiment } = await import('../lib/platform/lab');
    await expect(logPhysicsExperiment('exp-bad', {})).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Physics telemetry log failed:',
      'RLS violation',
    );
    consoleSpy.mockRestore();
  });
});

// ── app/api/ads/orders/route.ts ───────────────────────────────────────────────

describe('POST /api/ads/orders', () => {
  afterEach(() => vi.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    createServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('no user') }) },
    });

    const { POST } = await import('../app/api/ads/orders/route');
    const req = new Request('https://dreamengin.app/api/ads/orders', {
      method: 'POST',
      body: JSON.stringify({ listingId: 'listing-1', grossAmount: 100 }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it('returns 400 when listingId is missing', async () => {
    createServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    });

    const { POST } = await import('../app/api/ads/orders/route');
    const req = new Request('https://dreamengin.app/api/ads/orders', {
      method: 'POST',
      body: JSON.stringify({ grossAmount: 100 }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('listingId');
  });

  it('inserts ad order with correct 10%/90% split', async () => {
    const mock = makeInsertMock({
      data: { id: 'order-1', status: 'pending' },
      error: null,
    });
    createServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'buyer-1' } }, error: null }) },
      from: vi.fn(() => ({ insert: mock.insert })),
    });

    const { POST } = await import('../app/api/ads/orders/route');
    const req = new Request('https://dreamengin.app/api/ads/orders', {
      method: 'POST',
      body: JSON.stringify({ listingId: 'listing-1', grossAmount: 100 }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(201);

    const insertPayload = mock.insert.mock.calls[0][0][0];
    expect(insertPayload.gross_revenue).toBe(100);
    expect(insertPayload.platform_share).toBeCloseTo(0.10);
    expect(insertPayload.creator_share).toBeCloseTo(0.90);
    expect(insertPayload.platform_payout).toBeCloseTo(10);
    expect(insertPayload.creator_payout).toBeCloseTo(90);
    expect(insertPayload.buyer_id).toBe('buyer-1');
    expect(insertPayload.status).toBe('pending');
  });
});

// ── app/api/gal/route.ts ──────────────────────────────────────────────────────

describe('POST /api/gal', () => {
  afterEach(() => vi.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    createServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('no user') }) },
    });

    const { POST } = await import('../app/api/gal/route');
    const req = new Request('https://dreamengin.app/api/gal', {
      method: 'POST',
      body: JSON.stringify({ type: 'post', internalId: 'p1', label: 'Hello' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it('returns 400 when type is missing', async () => {
    createServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    });

    const { POST } = await import('../app/api/gal/route');
    const req = new Request('https://dreamengin.app/api/gal', {
      method: 'POST',
      body: JSON.stringify({ internalId: 'p1', label: 'Hello' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('type');
  });

  it('upserts registry entry with owner_id from session', async () => {
    const mock = makeUpsertMock({
      data: { id: 'reg-1', object_type: 'post', internal_id: 'p1', label: 'Hello', owner_id: 'u1', created_at: new Date().toISOString() },
      error: null,
    });
    createServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
      from: vi.fn(() => ({ upsert: mock.upsert })),
    });

    const { POST } = await import('../app/api/gal/route');
    const req = new Request('https://dreamengin.app/api/gal', {
      method: 'POST',
      body: JSON.stringify({ type: 'post', internalId: 'p1', label: 'Hello' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);

    const upsertPayload = mock.upsert.mock.calls[0][0][0];
    expect(upsertPayload.object_type).toBe('post');
    expect(upsertPayload.internal_id).toBe('p1');
    expect(upsertPayload.owner_id).toBe('u1');
  });
});

// ── lib/platform/index.ts — revenue split constants ──────────────────────────

describe('platform index revenue split', () => {
  it('exports logPhysicsExperiment', async () => {
    const mod = await import('../lib/platform/index');
    expect(typeof mod.logPhysicsExperiment).toBe('function');
  });

  it('exports getFeed', async () => {
    const mod = await import('../lib/platform/index');
    expect(typeof mod.getFeed).toBe('function');
  });

  it('exports syncToGlobalRegistry', async () => {
    const mod = await import('../lib/platform/index');
    expect(typeof mod.syncToGlobalRegistry).toBe('function');
  });

  it('exports processAdOrder', async () => {
    const mod = await import('../lib/platform/index');
    expect(typeof mod.processAdOrder).toBe('function');
  });
});
