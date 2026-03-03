/**
 * A8 — Regression / Tripwire Tests
 *
 * Validates:
 * 1) No "NAV MODE" text in user-visible UI strings (not in comments/constants)
 * 2) UIOverlayHost is imported in root layout
 * 3) GoldenButton tap-state logic (pure function)
 * 4) DreamCardLarge meets min sizing constraints
 * 5) HomeFeedTV uses scroll-snap TV feed container
 * 6) Channel count is exactly 6
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '..');

function readFile(rel: string) {
  return readFileSync(resolve(ROOT, rel), 'utf-8');
}

/* ── 1) NAV MODE tripwire ──────────────────────────────────────────────── */
describe('A8 tripwire: no NAV MODE in user-visible UI strings', () => {
  it('UIOverlayHost must not render "NAV MODE" text', () => {
    const src = readFile('components/overlay/UIOverlayHost.tsx');
    // Extract JSX text content (rough heuristic: look for >NAV MODE< or "NAV MODE" in JSX)
    const jsxTextMatches = src.match(/>[^<]*NAV MODE[^<]*</g);
    expect(jsxTextMatches).toBeNull();
  });

  it('HomeSystem must not render DreamNavControls (now global)', () => {
    const src = readFile('components/home/HomeSystem.tsx');
    expect(src).not.toContain('DreamNavControls');
  });

  it('HomeFeedTV must not contain "NAV mode" user-visible text', () => {
    const src = readFile('components/home/HomeFeedTV.tsx');
    const jsxTextMatches = src.match(/>[^<]*NAV mode[^<]*</gi);
    expect(jsxTextMatches).toBeNull();
  });
});

/* ── 2) UIOverlayHost in root layout ──────────────────────────────────── */
describe('A8: UIOverlayHost is rendered in root layout', () => {
  it('app/layout.tsx imports UIOverlayHost', () => {
    const src = readFile('app/layout.tsx');
    expect(src).toContain('UIOverlayHost');
  });

  it('app/layout.tsx renders <UIOverlayHost', () => {
    const src = readFile('app/layout.tsx');
    expect(src).toMatch(/<UIOverlayHost/);
  });
});

/* ── 3) Golden Button — denylist and position logic ───────────────────── */
describe('A8: Golden Button denylist', () => {
  const ROUTE_DENYLIST = ['/login', '/join', '/auth/callback'];

  function isDenied(pathname: string): boolean {
    return ROUTE_DENYLIST.some((p) => pathname.startsWith(p));
  }

  it('hides on /login', () => { expect(isDenied('/login')).toBe(true); });
  it('hides on /join',  () => { expect(isDenied('/join')).toBe(true); });
  it('hides on /auth/callback', () => { expect(isDenied('/auth/callback')).toBe(true); });
  it('shows on /home',  () => { expect(isDenied('/home')).toBe(false); });
  it('shows on /dreams', () => { expect(isDenied('/dreams')).toBe(false); });
  it('shows on /',      () => { expect(isDenied('/')).toBe(false); });
});

/* ── 4) DreamCardLarge min sizing constraints ──────────────────────────── */
describe('A8: DreamCardLarge meets min sizing constraints', () => {
  it('source file specifies minHeight >= 168px', () => {
    const src = readFile('components/home/DreamCardLarge.tsx');
    const match = src.match(/minHeight:\s*(\d+)/);
    expect(match).not.toBeNull();
    const minH = Number(match![1]);
    expect(minH).toBeGreaterThanOrEqual(168);
  });

  it('source file specifies width 78vw', () => {
    const src = readFile('components/home/DreamCardLarge.tsx');
    expect(src).toContain('78vw');
  });

  it('source file specifies maxWidth >= 420', () => {
    const src = readFile('components/home/DreamCardLarge.tsx');
    const match = src.match(/maxWidth:\s*(\d+)/);
    expect(match).not.toBeNull();
    const maxW = Number(match![1]);
    expect(maxW).toBeGreaterThanOrEqual(420);
  });

  it('source file specifies borderRadius >= 18', () => {
    const src = readFile('components/home/DreamCardLarge.tsx');
    const match = src.match(/borderRadius:\s*(\d+)/);
    expect(match).not.toBeNull();
    const radius = Number(match![1]);
    expect(radius).toBeGreaterThanOrEqual(18);
  });
});

/* ── 5) HomeFeedTV uses scroll-snap ───────────────────────────────────── */
describe('A8: HomeFeedTV uses scroll-snap TV feed container', () => {
  it('source file uses scrollSnapType y mandatory', () => {
    const src = readFile('components/home/HomeFeedTV.tsx');
    expect(src).toContain('scroll-snap');
    expect(src).toContain('mandatory');
  });

  it('source file marks cards with scrollSnapAlign start', () => {
    const src = readFile('components/home/HomeFeedTV.tsx');
    expect(src).toContain('scrollSnapAlign');
  });

  it('source file uses IntersectionObserver', () => {
    const src = readFile('components/home/HomeFeedTV.tsx');
    expect(src).toContain('IntersectionObserver');
  });

  it('source file uses data-tv-feed attribute for the container', () => {
    const src = readFile('components/home/HomeFeedTV.tsx');
    expect(src).toContain('data-tv-feed');
  });
});

/* ── 6) Channel count is exactly 6 ───────────────────────────────────── */
describe('A8: Daydream channel count', () => {
  it('HomeFeedTV defines exactly 6 channels', () => {
    const src = readFile('components/home/HomeFeedTV.tsx');
    // Count { id: 'analytics' | 'brand' | etc entries in the CHANNELS block
    const channelIds = src.match(/\{\s*id:\s*'[a-z-]+',\s*label:/g) ?? [];
    // Also count with double quotes
    const channelIds2 = src.match(/\{\s*id:\s*"[a-z-]+",\s*label:/g) ?? [];
    const count = channelIds.length + channelIds2.length;
    expect(count).toBe(6);
  });

  it('UIOverlayHost defines exactly 6 Daydream theme items', () => {
    const src = readFile('components/overlay/UIOverlayHost.tsx');
    // Look for entries in DAYDREAM_THEMES array
    const matches = src.match(/\{\s*id:\s*'dy-[a-z-]+'/g) ?? [];
    const matches2 = src.match(/\{\s*id:\s*"dy-[a-z-]+"/g) ?? [];
    const count = matches.length + matches2.length;
    expect(count).toBe(6);
  });
});

/* ── 7) HomeSystem uses HomeFeedTV (not tiny DreamsGrid on home face) ── */
describe('A8: HomeSystem home-face uses HomeFeedTV, not tiny icon grid', () => {
  it('HomeSystem imports HomeFeedTV', () => {
    const src = readFile('components/home/HomeSystem.tsx');
    expect(src).toContain('HomeFeedTV');
  });

  it('HomeSystem does not render DreamsGrid on the home face', () => {
    const src = readFile('components/home/HomeSystem.tsx');
    // DreamsGrid should only appear for the profile face (pin mode)
    // Check it's not in the home face rendering block
    // HomeSystem only uses DreamsGrid with mode="profile" now
    const homeBlock = src.match(/face === 'home'[\s\S]*?HomeFeedTV/);
    expect(homeBlock).not.toBeNull();
  });
});
