import { beforeEach, describe, expect, it, vi } from 'vitest';

const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
);
const connectionMock = vi.hoisted(() => vi.fn(async () => undefined));
const createServerClientMock = vi.hoisted(() => vi.fn());
const safeGetUserMock = vi.hoisted(() => vi.fn());
const isDevBypassActiveMock = vi.hoisted(() => vi.fn(() => false));
const homeSystemMock = vi.hoisted(() => vi.fn(() => null));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('next/server', () => ({
  connection: connectionMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: createServerClientMock,
}));

vi.mock('@/lib/supabase/safeGetUser', () => ({
  safeGetUser: safeGetUserMock,
}));

vi.mock('@/lib/dev-bypass', () => ({
  isDevBypassActive: isDevBypassActiveMock,
}));

vi.mock('@/dreamdmbar/homedream/HomeSystem', () => ({
  default: homeSystemMock,
}));

vi.mock('@/lib/ai/triad', () => ({
  isOwnerEmail: vi.fn(() => false),
}));

vi.mock('@/lib/media/postMedia', () => ({
  getPrimaryPostMediaUrl: vi.fn(() => null),
}));

describe('app/homedream/page auth gating', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    createServerClientMock.mockResolvedValue({
      from: vi.fn(() => {
        throw new Error('should not fetch profile/feed data in this test');
      }),
    });
    safeGetUserMock.mockResolvedValue(null);
    isDevBypassActiveMock.mockReturnValue(false);
  });

  it('redirects to login when there is no user and dev bypass is off', async () => {
    const { default: Home } = await import('@/app/homedream/page');

    await expect(Home()).rejects.toThrow('redirect:/login');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });

  it('renders the home system in dev bypass mode without a Supabase user', async () => {
    isDevBypassActiveMock.mockReturnValue(true);

    const { default: Home } = await import('@/app/homedream/page');
    const result = await Home();

    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      type: homeSystemMock,
      props: {
        userId: 'dev-bypass-user',
        profile: null,
        initialPosts: [],
        isAdmin: false,
      },
    });
  });
});
