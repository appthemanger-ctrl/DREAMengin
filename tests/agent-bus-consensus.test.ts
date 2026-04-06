import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/ai/triad', () => ({
  planWithEams: vi.fn(),
  validateWithIdari: vi.fn(),
  boogiePolicyCheck: vi.fn(),
}));

describe('runTriadConsensus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires IDARi to preserve intents when Dr. Eams proposes them', async () => {
    const triad = await import('@/lib/ai/triad');
    vi.mocked(triad.planWithEams).mockResolvedValue({
      response_text: 'do the thing',
      intents: [
        {
          intent_id: '1',
          type: 'NAV_DELTA',
          payload: { href: '/daydream/code' },
          confidence: 0.9,
          requires_confirmation: false,
          rationale: 'test',
          idempotency_key: 'nav-1',
        },
      ],
    });
    vi.mocked(triad.validateWithIdari).mockReturnValue({
      intents: [],
      notes: ['stripped'],
    });
    vi.mocked(triad.boogiePolicyCheck).mockResolvedValue({
      hard_block: false,
    });

    const { runTriadConsensus } = await import('@/lib/agents/agentBus');
    const result = await runTriadConsensus({
      message: 'open code',
      actorRole: 'user',
    });

    expect(result.unanimous).toBe(false);
  });
});
