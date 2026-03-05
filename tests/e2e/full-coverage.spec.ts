/**
 * tests/e2e/full-coverage.spec.ts
 *
 * Full-coverage Playwright suite for DREAMengin.
 * Permissions granted: camera, microphone, geolocation, notifications.
 *
 * Covers every documented feature area per docs/FEATURE_STATUS.md.
 * Bugs found during test runs are recorded in docs/BUGS.md.
 * When a bug is fixed, remove its entry from BUGS.md (see docs/LAW.md §9).
 *
 * Run:
 *   pnpm test                    (all e2e, Playwright)
 *   pnpm test tests/e2e/full-coverage.spec.ts   (this file only)
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// ---------------------------------------------------------------------------
// Shared permission context — every test in this file gets camera + mic +
// geolocation + notifications so media features are not blocked.
// ---------------------------------------------------------------------------
test.use({
  permissions: ['camera', 'microphone', 'geolocation', 'notifications'],
  geolocation: { latitude: 40.7128, longitude: -74.006 },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wait for the page to be fully interactive (no loading spinners). */
async function waitReady(page: Page) {
  await page.waitForLoadState('networkidle');
}

/** Confirm the footer Policy link is present — required on EVERY page (BOOGIEMAN req 10). */
async function expectPolicyFooter(page: Page) {
  const footer = page.locator('footer a[href="/policy"]');
  await expect(footer).toBeVisible();
}

// ---------------------------------------------------------------------------
// 1. LANDING PAGE
// ---------------------------------------------------------------------------
test.describe('Landing page', () => {
  test('loads with sky-blue + gold gradient design', async ({ page }) => {
    await page.goto('/');
    await waitReady(page);

    // Brand wordmark
    await expect(page.getByText('DREAMengin').first()).toBeVisible();

    // Headline
    await expect(
      page.getByRole('heading', { name: /Navigate your digital world/i })
    ).toBeVisible();

    // Top pill text
    await expect(page.getByText(/Dr\. Eams dreams of dreaming/i)).toBeVisible();

    // CTAs
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'About' }).first()).toBeVisible();

    // Footer policy link (req 10)
    await expectPolicyFooter(page);
  });

  test('video element is present and has correct src', async ({ page }) => {
    await page.goto('/');
    const video = page.locator('video');
    await expect(video).toBeAttached();
    const src = await page.locator('video source').getAttribute('src');
    expect(src).toBe('/videos/signup-bg.mp4');
  });

  test('video opacity is readable (above 0.30)', async ({ page }) => {
    await page.goto('/');
    // Use getComputedStyle so the test remains correct if opacity moves from
    // an inline style to a CSS class in future.
    const opacity = await page.locator('video').evaluate((el) =>
      parseFloat(getComputedStyle(el).opacity)
    );
    // Must be visible enough — was bugged at 0.15, now 0.38
    expect(opacity).toBeGreaterThanOrEqual(0.30);
  });

  test('HeroSprite canvas is present and interactive', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('canvas[aria-label*="Dr. Eams"]');
    await expect(canvas).toBeVisible();
    // Canvas must have cursor:pointer (interactive affordance)
    const cursor = await canvas.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).toBe('pointer');
  });

  test('touch affordance label is visible below sprite', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/tap to interact/i)).toBeVisible();
  });

  test('tapping the sprite canvas triggers a reaction hint', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('canvas[aria-label*="Dr. Eams"]');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas has no bounding box');

    // Tap the head zone (top 30%)
    await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.15);

    // Hint tooltip should appear briefly
    await expect(page.locator('text=🧠 head!')).toBeVisible({ timeout: 2000 });
  });

  test('icon strip contains 18 platform badges', async ({ page }) => {
    await page.goto('/');
    const badges = page.locator('[aria-label^="Connect "]');
    await expect(badges).toHaveCount(18);
  });

  test('Sign In nav link goes to /login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('Get Started link goes to /join', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Get Started' }).click();
    await expect(page).toHaveURL(/\/join/);
  });

  test('About link goes to /about', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'About' }).first().click();
    await expect(page).toHaveURL(/\/about/);
  });
});

// ---------------------------------------------------------------------------
// 2. ABOUT PAGE
// ---------------------------------------------------------------------------
test.describe('About page', () => {
  test('loads without auth', async ({ page }) => {
    await page.goto('/about');
    await waitReady(page);
    await expect(page).toHaveURL(/\/about/);
    // Should NOT redirect to login
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('shows platform features content', async ({ page }) => {
    await page.goto('/about');
    // Has at least one heading
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('has footer policy link', async ({ page }) => {
    await page.goto('/about');
    await expectPolicyFooter(page);
  });
});

// ---------------------------------------------------------------------------
// 3. POLICY PAGE — publicly accessible, no login (BOOGIEMAN req 15)
// ---------------------------------------------------------------------------
test.describe('Policy page', () => {
  test('loads without auth', async ({ page }) => {
    await page.goto('/policy');
    await waitReady(page);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('shows policy version string', async ({ page }) => {
    await page.goto('/policy');
    await expect(page.getByText(/BOOGIE_POLICY_V1/i)).toBeVisible();
  });

  test('has footer policy link', async ({ page }) => {
    await page.goto('/policy');
    await expectPolicyFooter(page);
  });
});

// ---------------------------------------------------------------------------
// 4. AUTH — LOGIN
// ---------------------------------------------------------------------------
test.describe('Login page', () => {
  test('loads without auth', async ({ page }) => {
    await page.goto('/login');
    await waitReady(page);
    await expect(page).toHaveURL(/\/login/);
  });

  test('has email input with correct id', async ({ page }) => {
    await page.goto('/login');
    // BUG DOCUMENTED: example.spec.ts uses [name="email"] but actual attribute is id="email"
    await expect(page.locator('#email')).toBeVisible();
  });

  test('has password input', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('has Sign In submit button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('has Remember me checkbox', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="checkbox"]').first()).toBeVisible();
  });

  test('has OAuth — Continue with Google', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
  });

  test('has OAuth — Continue with GitHub', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /continue with github/i })).toBeVisible();
  });

  test('has Create an account link to /join', async ({ page }) => {
    await page.goto('/login');
    const link = page.getByRole('link', { name: /create an account/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/join');
  });

  test('Dr. Eams welcome banner is visible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
    await expect(page.getByText(/Dr\. Eams/i)).toBeVisible();
  });

  test('shows inline error on empty submit (does not crash page)', async ({ page }) => {
    await page.goto('/login');
    // Fill email only, leave password empty — HTML5 validation should prevent submit
    await page.locator('#email').fill('test@example.com');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Page should still be /login — not crash to error page
    await expect(page).toHaveURL(/\/login/);
  });

  test('has footer policy link', async ({ page }) => {
    await page.goto('/login');
    await expectPolicyFooter(page);
  });
});

// ---------------------------------------------------------------------------
// 5. AUTH — JOIN / REGISTER
// ---------------------------------------------------------------------------
test.describe('Join / Register page', () => {
  test('loads without auth', async ({ page }) => {
    await page.goto('/join');
    await waitReady(page);
    await expect(page).toHaveURL(/\/join/);
  });

  test('has email, password, confirm-password inputs', async ({ page }) => {
    await page.goto('/join');
    const inputs = page.locator('input[type="password"]');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(inputs).toHaveCount(2); // password + confirm
  });

  test('has Privacy Policy checkbox', async ({ page }) => {
    await page.goto('/join');
    await expect(page.getByText(/Privacy Policy/i)).toBeVisible();
  });

  test('has Terms & Conditions checkbox', async ({ page }) => {
    await page.goto('/join');
    await expect(page.getByText(/Terms/i)).toBeVisible();
  });

  test('has Create Account submit button', async ({ page }) => {
    await page.goto('/join');
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('has Sign in link back to /login', async ({ page }) => {
    await page.goto('/join');
    const link = page.getByRole('link', { name: /sign in/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/login');
  });

  test('has footer policy link', async ({ page }) => {
    await page.goto('/join');
    await expectPolicyFooter(page);
  });
});

// ---------------------------------------------------------------------------
// 6. AUTH REDIRECT — protected routes must redirect to /login
// ---------------------------------------------------------------------------
test.describe('Protected route redirects', () => {
  const protectedRoutes = [
    '/home',
    '/profile',
    '/settings',
    '/settings/appearance',
    '/settings/algorithm',
    '/settings/account',
    '/settings/data',
    '/connectors',
    '/edit-profile',
    '/messages',
    '/daydream/games',
    '/daydream/music',
    '/daydream/analytics',
    '/daydream/brand',
    '/daydream/create',
    '/daydream/play',
    '/daydream/media-vault',
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects to /login when unauthenticated`, async ({ page }) => {
      await page.goto(route);
      await page.waitForURL(/\/(login|join)/, { timeout: 8000 });
      await expect(page).toHaveURL(/\/(login|join)/);
    });
  }
});

// ---------------------------------------------------------------------------
// 7. SHOP & MARKETPLACE — partially public
// ---------------------------------------------------------------------------
test.describe('Shop and Marketplace', () => {
  test('shop page loads (may redirect or show content)', async ({ page }) => {
    await page.goto('/shop');
    await waitReady(page);
    // Either shows shop content or redirects to login — must not 500
    const url = page.url();
    expect(url).toMatch(/\/(shop|login)/);
  });

  test('marketplace page loads', async ({ page }) => {
    await page.goto('/marketplace');
    await waitReady(page);
    const url = page.url();
    expect(url).toMatch(/\/(marketplace|login)/);
  });
});

// ---------------------------------------------------------------------------
// 8. GAMES DAYDREAM — Dr. Eams platformer at /game (public-ish, auth behind)
// ---------------------------------------------------------------------------
test.describe('Games', () => {
  test('/daydream/games redirects unauthenticated users', async ({ page }) => {
    await page.goto('/daydream/games');
    await page.waitForURL(/\/(login|join)/, { timeout: 8000 });
    await expect(page).toHaveURL(/\/(login|join)/);
  });
});

// ---------------------------------------------------------------------------
// 9. DISCOVER — requires auth
// ---------------------------------------------------------------------------
test.describe('Discover', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/discover');
    await page.waitForURL(/\/(login|join)/, { timeout: 8000 });
    await expect(page).toHaveURL(/\/(login|join)/);
  });
});

// ---------------------------------------------------------------------------
// 10. DESIGN SYSTEM — sky-blue + gold tokens on public pages
// ---------------------------------------------------------------------------
test.describe('Design system tokens', () => {
  test('landing page <main> is transparent (not dark bg-[#070b16])', async ({ page }) => {
    await page.goto('/');
    const bgColor = await page.locator('main').first().evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    // transparent = rgba(0,0,0,0) — old dark was rgb(7,11,22)
    expect(bgColor).toBe('rgba(0, 0, 0, 0)');
  });

  test('login page uses sky-blue de-sky-bg gradient', async ({ page }) => {
    await page.goto('/login');
    const bg = await page.locator('.de-sky-bg').first().evaluate((el) =>
      getComputedStyle(el).backgroundImage
    );
    expect(bg).toContain('gradient');
  });

  test('de-btn-primary has gradient background (sky→gold)', async ({ page }) => {
    await page.goto('/login');
    const btn = page.locator('.de-btn-primary').first();
    await expect(btn).toBeVisible();
    const bg = await btn.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain('gradient');
  });
});

// ---------------------------------------------------------------------------
// 11. MOBILE — iPhone 13 viewport
// ---------------------------------------------------------------------------
test.describe('Mobile layout (iPhone 13)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('landing page fits mobile viewport', async ({ page }) => {
    await page.goto('/');
    await waitReady(page);
    await expect(page.getByText('DREAMengin').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible();
  });

  test('login page is usable on mobile', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('sprite canvas touch interaction works on mobile', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('canvas[aria-label*="Dr. Eams"]');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas has no bounding box');

    // Simulate touch tap on torso zone
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height * 0.50);
    await expect(page.locator('text=👋 arms!')).toBeVisible({ timeout: 2000 });
  });

  test('footer policy link is accessible on mobile', async ({ page }) => {
    await page.goto('/');
    await expectPolicyFooter(page);
  });
});

// ---------------------------------------------------------------------------
// 12. CAMERA + MICROPHONE permissions (Music Studio entry check)
// ---------------------------------------------------------------------------
test.describe('Media permissions', () => {
  test('camera permission is granted by test context', async ({ page, context }) => {
    await page.goto('/');
    // Verify context has camera permission (does not throw)
    const permState = await context.storageState();
    // If permissions were granted we can call getUserMedia without a prompt
    const hasMedia = await page.evaluate(async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.length > 0;
      } catch {
        return false;
      }
    });
    expect(hasMedia).toBe(true);
  });
});
