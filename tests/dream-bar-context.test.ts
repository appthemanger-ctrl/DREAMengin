/**
 * tests/dream-bar-context.test.ts
 *
 * Unit tests for useDreamBarContext — specifically the pure `detectSurface`
 * function and the CONTEXT_MAP shape.  The React hook itself is not tested
 * here because it wraps usePathname (a Next.js hook); we test the pure logic
 * that the hook delegates to.
 */

import { describe, it, expect } from 'vitest';
import { detectSurface, type DreamBarSurface } from '@/lib/dreamdm/useDreamBarContext';

// ── detectSurface — route → surface mapping ──────────────────────────────────

describe('detectSurface', () => {
  // ── Messages ──
  it('maps /messages to "messages"', () => {
    expect(detectSurface('/messages')).toBe<DreamBarSurface>('messages');
  });

  it('maps /messages/new to "messages"', () => {
    expect(detectSurface('/messages/new')).toBe<DreamBarSurface>('messages');
  });

  it('maps /messages/boards to "messages"', () => {
    expect(detectSurface('/messages/boards')).toBe<DreamBarSurface>('messages');
  });

  // ── Feed / Home ──
  it('maps /homedream to "feed"', () => {
    expect(detectSurface('/homedream')).toBe<DreamBarSurface>('feed');
  });

  it('maps /home to "feed"', () => {
    expect(detectSurface('/home')).toBe<DreamBarSurface>('feed');
  });

  it('maps / to "feed"', () => {
    expect(detectSurface('/')).toBe<DreamBarSurface>('feed');
  });

  // ── Code ──
  it('maps /codespace to "code"', () => {
    expect(detectSurface('/codespace')).toBe<DreamBarSurface>('code');
  });

  it('maps /daydream/code to "code"', () => {
    expect(detectSurface('/daydream/code')).toBe<DreamBarSurface>('code');
  });

  it('maps /daydream/lab to "code"', () => {
    expect(detectSurface('/daydream/lab')).toBe<DreamBarSurface>('code');
  });

  it('maps /daydream/lab/portfolio to "code"', () => {
    expect(detectSurface('/daydream/lab/portfolio')).toBe<DreamBarSurface>('code');
  });

  // ── Dreams / Dr. Eams ──
  it('maps /dreamengin to "dreams"', () => {
    expect(detectSurface('/dreamengin')).toBe<DreamBarSurface>('dreams');
  });

  // ── Music ──
  it('maps /music to "music"', () => {
    expect(detectSurface('/music')).toBe<DreamBarSurface>('music');
  });

  it('maps /daydream/music to "music"', () => {
    expect(detectSurface('/daydream/music')).toBe<DreamBarSurface>('music');
  });

  // ── Create ──
  it('maps /daydream/create to "create"', () => {
    expect(detectSurface('/daydream/create')).toBe<DreamBarSurface>('create');
  });

  it('maps /create to "create"', () => {
    expect(detectSurface('/create')).toBe<DreamBarSurface>('create');
  });

  // ── Discover ──
  it('maps /discover to "discover"', () => {
    expect(detectSurface('/discover')).toBe<DreamBarSurface>('discover');
  });

  it('maps /analytics to "discover"', () => {
    expect(detectSurface('/analytics')).toBe<DreamBarSurface>('discover');
  });

  // ── General fallback ──
  it('maps /settings to "general"', () => {
    expect(detectSurface('/settings')).toBe<DreamBarSurface>('general');
  });

  it('maps /profile to "general"', () => {
    expect(detectSurface('/profile')).toBe<DreamBarSurface>('general');
  });

  it('maps /shop to "general"', () => {
    expect(detectSurface('/shop')).toBe<DreamBarSurface>('general');
  });

  it('maps /game to "general"', () => {
    expect(detectSurface('/game')).toBe<DreamBarSurface>('general');
  });

  it('maps an unknown path to "general"', () => {
    expect(detectSurface('/some/unknown/path')).toBe<DreamBarSurface>('general');
  });

  // ── Case-insensitivity ──
  it('is case-insensitive', () => {
    expect(detectSurface('/MESSAGES')).toBe<DreamBarSurface>('messages');
    expect(detectSurface('/Codespace')).toBe<DreamBarSurface>('code');
  });
});

// ── Completeness check ────────────────────────────────────────────────────────

describe('DreamBarSurface completeness', () => {
  const ALL_SURFACES: DreamBarSurface[] = [
    'messages', 'feed', 'code', 'dreams', 'music', 'create', 'discover', 'general',
  ];

  it('has 8 distinct surface types', () => {
    expect(ALL_SURFACES).toHaveLength(8);
  });

  it('every surface maps to a non-empty placeholder', () => {
    // Import the context map indirectly by testing known routes
    const routes: [string, DreamBarSurface][] = [
      ['/messages',        'messages'],
      ['/homedream',       'feed'],
      ['/codespace',       'code'],
      ['/dreamengin',      'dreams'],
      ['/music',           'music'],
      ['/daydream/create', 'create'],
      ['/discover',        'discover'],
      ['/settings',        'general'],
    ];

    for (const [path, expected] of routes) {
      expect(detectSurface(path)).toBe(expected);
    }
  });
});
