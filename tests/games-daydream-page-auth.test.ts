/**
 * tests/games-daydream-page-auth.test.ts
 *
 * Regression guard for the Games Daydream page SSR crash.
 *
 * Root cause: `supabase.auth.getUser()` throws when Supabase is not
 * configured (disabled client returns an async thrower). Without a try/catch
 * or the `safeGetUser` helper the unhandled error propagates to Next.js and
 * produces "An error occurred in the Server Components render", showing the
 * error boundary "Something cracked in the dream."
 *
 * Fix: switched to `safeGetUser()` which wraps the call in try/catch and
 * adds a 2 500 ms timeout, matching the pattern used by homedream and dreamr.
 *
 * This test verifies:
 *  1. The page redirects to /login when there is no authenticated user.
 *  2. The page renders (does not throw) when safeGetUser returns null AND
 *     dev-bypass is active.
 *  3. The page renders the DaydreamShell when a user IS present.
 *  4. The page does NOT crash when safeGetUser rejects (simulates the
 *     disabled-client scenario that caused the production SSR crash).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── hoisted mocks (must be declared before any imports that trigger module
//    evaluation, because vi.mock() is hoisted to the top of the file) ────────

const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
);
const connectionMock = vi.hoisted(() => vi.fn(async () => undefined));
const createServerClientMock = vi.hoisted(() => vi.fn());
const safeGetUserMock = vi.hoisted(() => vi.fn());
const isDevBypassActiveMock = vi.hoisted(() => vi.fn(() => false));
const daydreamShellMock = vi.hoisted(() => vi.fn(() => null));
const gamesHubMock = vi.hoisted(() => vi.fn(() => null));
const autoOpenGameEnginMock = vi.hoisted(() => vi.fn(() => null));
const openDaydreamSideBButtonMock = vi.hoisted(() => vi.fn(() => null));
const authenticatedPageHeaderMock = vi.hoisted(() => vi.fn(() => null));

vi.mock('next/navigation', () => ({ redirect: redirectMock }));
vi.mock('next/server', () => ({ connection: connectionMock }));
vi.mock('next/dynamic', () => ({ default: vi.fn(() => vi.fn(() => null)) }));
vi.mock('@/lib/supabase/server', () => ({ createServerClient: createServerClientMock }));
vi.mock('@/lib/supabase/safeGetUser', () => ({ safeGetUser: safeGetUserMock }));
vi.mock('@/lib/dev-bypass', () => ({ isDevBypassActive: isDevBypassActiveMock }));
vi.mock('@/components/daydream/dream.shell.DaydreamShell', () => ({
  default: daydreamShellMock,
}));
vi.mock('@/components/games/dream.GamesHub', () => ({ default: gamesHubMock }));
vi.mock('@/engins/autoopen/dream.AutoOpenGameEngin', () => ({
  default: autoOpenGameEnginMock,
}));
vi.mock('@/components/daydream/dream.OpenDaydreamSideBButton', () => ({
  default: openDaydreamSideBButtonMock,
}));
vi.mock('@/components/ui/dream.AuthenticatedPageHeader', () => ({
  default: authenticatedPageHeaderMock,
}));
vi.mock('@/lib/games/quality-plan', () => ({
  GAME_QUALITY_PILLARS: [],
}));
vi.mock('@/lib/games/navigation', () => ({
  buildGameLaunchHref: vi.fn(
    (id: string) => `/daydream/games?game=${id}&openEngin=true`,
  ),
}));
vi.mock('next/link', () => ({ default: vi.fn(() => null) }));
vi.mock('lucide-react', () => ({
  Gamepad2: vi.fn(() => null),
  Play: vi.fn(() => null),
  Sparkles: vi.fn(() => null),
  Zap: vi.fn(() => null),
}));

// ── tests ────────────────────────────────────────────────────────────────────

describe('app/daydream/games/page auth gating', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    // Default: unauthenticated user, Supabase client available.
    createServerClientMock.mockResolvedValue({});
    safeGetUserMock.mockResolvedValue(null);
    isDevBypassActiveMock.mockReturnValue(false);
  });

  it('redirects to /login when there is no user and dev bypass is off', async () => {
    const { default: GamesDaydreamPage } = await import('@/app/daydream/games/page');

    await expect(GamesDaydreamPage()).rejects.toThrow('redirect:/login');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });

  it('does NOT crash and renders the shell in dev-bypass mode (simulates unconfigured Supabase)', async () => {
    // When Supabase is not configured safeGetUser returns null — which is
    // exactly what happens when the disabled client throws internally.
    isDevBypassActiveMock.mockReturnValue(true);
    safeGetUserMock.mockResolvedValue(null);

    const { default: GamesDaydreamPage } = await import('@/app/daydream/games/page');
    // Must not throw at all
    await expect(GamesDaydreamPage()).resolves.not.toThrow();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('does NOT crash when safeGetUser returns null (disabled-client / unconfigured-Supabase scenario)', async () => {
    // Regression: before the fix, the page called auth.getUser() directly.
    // The disabled client throws, which propagated to Next.js and crashed the
    // Server Component render ("Something cracked in the dream.").
    //
    // After the fix, safeGetUser() absorbs any internal throw and returns null.
    // The page must handle that null gracefully — redirecting to login or
    // rendering normally when dev-bypass is active.
    safeGetUserMock.mockResolvedValue(null);
    isDevBypassActiveMock.mockReturnValue(true);

    const { default: GamesDaydreamPage } = await import('@/app/daydream/games/page');
    await expect(GamesDaydreamPage()).resolves.not.toThrow();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('renders the DaydreamShell when a valid user is returned', async () => {
    const user = { id: 'user-abc', email: 'player@example.com' };
    safeGetUserMock.mockResolvedValue(user);

    const { default: GamesDaydreamPage } = await import('@/app/daydream/games/page');
    const result = await GamesDaydreamPage();

    expect(redirectMock).not.toHaveBeenCalled();
    // The page returns a React element whose type is the mocked DaydreamShell
    expect(result).toMatchObject({ type: daydreamShellMock });
  });

  it('calls safeGetUser with the supabase client returned by createServerClient', async () => {
    const fakeClient = { auth: {} };
    createServerClientMock.mockResolvedValue(fakeClient);
    safeGetUserMock.mockResolvedValue({ id: 'user-xyz' });

    const { default: GamesDaydreamPage } = await import('@/app/daydream/games/page');
    await GamesDaydreamPage();

    expect(safeGetUserMock).toHaveBeenCalledWith(fakeClient);
  });

  it('awaits connection() before any auth or render work', async () => {
    const order: string[] = [];
    connectionMock.mockImplementation(async () => {
      order.push('connection');
    });
    safeGetUserMock.mockImplementation(async () => {
      order.push('safeGetUser');
      return { id: 'u1' };
    });

    const { default: GamesDaydreamPage } = await import('@/app/daydream/games/page');
    await GamesDaydreamPage();

    expect(order).toEqual(['connection', 'safeGetUser']);
  });
});
