import { afterEach, describe, expect, it, vi } from 'vitest';

const createServerClient = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient,
}));

function makeDraftInsertMock() {
  const single = vi.fn().mockResolvedValue({ data: { id: 'draft-1', title: 'saved' }, error: null });
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  return { insert, select, single };
}

function makeExperimentInsertMock() {
  const single = vi.fn().mockResolvedValue({ data: { id: 'exp-1', title: 'Benchmark Run', status: 'completed' }, error: null });
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  return { insert, select, single };
}

describe('content intelligence and lab benchmark routes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('generates viral hooks and saves them to content_drafts', async () => {
    const draft = makeDraftInsertMock();
    createServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn((table: string) => {
        expect(table).toBe('content_drafts');
        return { insert: draft.insert };
      }),
    });

    const { POST } = await import('../app/api/content/intelligence/route');
    const req = new Request('https://dreamengin.app/api/content/intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'viral-hooks', topic: 'creator funnels' }),
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.hooks).toHaveLength(5);
    expect(draft.insert).toHaveBeenCalledTimes(1);
  });

  it('scores SEO titles server-side and persists the result', async () => {
    const draft = makeDraftInsertMock();
    createServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn(() => ({ insert: draft.insert })),
    });

    const { POST } = await import('../app/api/content/intelligence/route');
    const req = new Request('https://dreamengin.app/api/content/intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'seo-score', title: 'How I Built a Better Creator Workflow in 30 Days' }),
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.score).toBeGreaterThan(0);
    expect(Array.isArray(json.reasons)).toBe(true);
    expect(draft.insert).toHaveBeenCalledTimes(1);
  });

  it('runs lab benchmarks server-side and saves a physics_experiments record', async () => {
    const exp = makeExperimentInsertMock();
    createServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn((table: string) => {
        expect(table).toBe('physics_experiments');
        return { insert: exp.insert };
      }),
    });

    const { POST } = await import('../app/api/lab/benchmarks/route');
    const req = new Request('https://dreamengin.app/api/lab/benchmarks', { method: 'POST' });

    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.results).toHaveLength(4);
    expect(exp.insert).toHaveBeenCalledTimes(1);
  });
});
