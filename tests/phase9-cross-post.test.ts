/**
 * tests/phase9-cross-post.test.ts
 *
 * Tests for lib/social/crossPost.ts — cross-posting to external platforms.
 */

import { describe, expect, it } from 'vitest';
import {
  buildCrossPostTargets,
  formatShareText,
  buildDreamOgMeta,
  type DreamSharePayload,
} from '@/lib/social/crossPost';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePayload(overrides?: Partial<DreamSharePayload>): DreamSharePayload {
  return {
    id: 'dream-1',
    title: 'My Dream Scene',
    url: 'https://dreamengin.app/dream/dream-1',
    ...overrides,
  };
}

// ─── buildCrossPostTargets ────────────────────────────────────────────────────

describe('Cross-Post — buildCrossPostTargets', () => {
  it('returns targets for share-capable platforms', () => {
    const targets = buildCrossPostTargets(makePayload());
    expect(targets.length).toBeGreaterThan(0);

    // Should include Twitter (X)
    const twitter = targets.find((t) => t.platformId === 'twitter');
    expect(twitter).toBeDefined();
    expect(twitter!.shareUrl).toContain('twitter.com/intent/tweet');
    expect(twitter!.shareUrl).toContain(encodeURIComponent('https://dreamengin.app/dream/dream-1'));
  });

  it('includes Mastodon as a target', () => {
    const targets = buildCrossPostTargets(makePayload());
    const mastodon = targets.find((t) => t.platformId === 'mastodon');
    expect(mastodon).toBeDefined();
    expect(mastodon!.shareUrl).toContain('mastodon.social/share');
  });

  it('includes Bluesky as a target', () => {
    const targets = buildCrossPostTargets(makePayload());
    const bsky = targets.find((t) => t.platformId === 'bluesky');
    expect(bsky).toBeDefined();
    expect(bsky!.shareUrl).toContain('bsky.app/intent/compose');
  });

  it('all targets have valid URLs', () => {
    const targets = buildCrossPostTargets(makePayload());
    for (const target of targets) {
      expect(target.shareUrl).toBeTruthy();
      expect(target.platformId).toBeTruthy();
      expect(target.platform).toBeDefined();
    }
  });
});

// ─── formatShareText ──────────────────────────────────────────────────────────

describe('Cross-Post — formatShareText', () => {
  it('includes title', () => {
    const text = formatShareText(makePayload());
    expect(text).toContain('My Dream Scene');
  });

  it('includes description when short', () => {
    const text = formatShareText(makePayload({ description: 'A cool 3D scene' }));
    expect(text).toContain('A cool 3D scene');
  });

  it('excludes description when too long', () => {
    const text = formatShareText(makePayload({
      description: 'x'.repeat(121),
    }));
    expect(text).not.toContain('x'.repeat(121));
  });

  it('includes hashtags', () => {
    const text = formatShareText(makePayload({
      tags: ['dream', '3dart', 'webgpu'],
    }));
    expect(text).toContain('#dream');
    expect(text).toContain('#3dart');
    expect(text).toContain('#webgpu');
  });

  it('limits to 5 hashtags', () => {
    const tags = Array.from({ length: 10 }, (_, i) => `tag${i}`);
    const text = formatShareText(makePayload({ tags }));
    // Count the # symbols
    const hashCount = (text.match(/#/g) || []).length;
    expect(hashCount).toBeLessThanOrEqual(5);
  });
});

// ─── buildDreamOgMeta ─────────────────────────────────────────────────────────

describe('Cross-Post — buildDreamOgMeta', () => {
  it('includes basic OG tags', () => {
    const meta = buildDreamOgMeta(makePayload());
    expect(meta['og:type']).toBe('website');
    expect(meta['og:title']).toBe('My Dream Scene');
    expect(meta['og:url']).toBe('https://dreamengin.app/dream/dream-1');
    expect(meta['og:site_name']).toBe('DREAMengin');
  });

  it('includes description when provided', () => {
    const meta = buildDreamOgMeta(makePayload({ description: 'A 3D scene' }));
    expect(meta['og:description']).toBe('A 3D scene');
  });

  it('uses summary card when no thumbnail', () => {
    const meta = buildDreamOgMeta(makePayload());
    expect(meta['twitter:card']).toBe('summary');
  });

  it('uses large image card when thumbnail provided', () => {
    const meta = buildDreamOgMeta(makePayload({
      thumbnailUrl: 'https://dreamengin.app/thumb/dream-1.jpg',
    }));
    expect(meta['twitter:card']).toBe('summary_large_image');
    expect(meta['og:image']).toBe('https://dreamengin.app/thumb/dream-1.jpg');
    expect(meta['twitter:image']).toBe('https://dreamengin.app/thumb/dream-1.jpg');
    expect(meta['og:image:width']).toBe('1200');
    expect(meta['og:image:height']).toBe('630');
  });

  it('includes twitter title', () => {
    const meta = buildDreamOgMeta(makePayload());
    expect(meta['twitter:title']).toBe('My Dream Scene');
  });
});

// ─── Mastodon in platforms registry ───────────────────────────────────────────

describe('Cross-Post — Mastodon platform', () => {
  it('mastodon is in SOCIAL_PLATFORMS', async () => {
    const { PLATFORM_MAP } = await import('@/lib/social/platforms');
    expect(PLATFORM_MAP['mastodon']).toBeDefined();
    expect(PLATFORM_MAP['mastodon']!.supportsShare).toBe(true);
    expect(PLATFORM_MAP['mastodon']!.label).toBe('Mastodon');
  });
});
