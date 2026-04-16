import { afterEach, describe, expect, it, vi } from 'vitest';
import { safeGetUser } from '@/lib/supabase/safeGetUser';

describe('safeGetUser', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the authenticated user when getUser resolves in time', async () => {
    const user = { id: 'user-1', email: 'dream@example.com' };

    await expect(
      safeGetUser({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user } }),
        },
      }),
    ).resolves.toEqual(user);
  });

  it('returns null when getUser rejects', async () => {
    await expect(
      safeGetUser({
        auth: {
          getUser: vi.fn().mockRejectedValue(new Error('boom')),
        },
      }),
    ).resolves.toBeNull();
  });

  it('returns null when getUser never resolves before the timeout', async () => {
    vi.useFakeTimers();

    const pendingUser = safeGetUser(
      {
        auth: {
          getUser: vi.fn(() => new Promise(() => undefined)),
        },
      },
      25,
    );

    await vi.advanceTimersByTimeAsync(25);

    await expect(pendingUser).resolves.toBeNull();
  });
});
