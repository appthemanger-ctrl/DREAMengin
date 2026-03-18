import { describe, expect, it } from 'vitest';

import {
  SOCIAL_PLATFORMS,
  PLATFORM_MAP,
  PROFILE_SHARE_PLATFORMS,
  detectPlatform,
  getPlatform,
} from '@/lib/social/platforms';

// ─── Registry shape ──────────────────────────────────────────────────────────

describe('SOCIAL_PLATFORMS registry', () => {
  it('contains at least 10 platforms', () => {
    expect(SOCIAL_PLATFORMS.length).toBeGreaterThanOrEqual(10);
  });

  it('every platform has a non-empty id, label, color, and emoji', () => {
    for (const p of SOCIAL_PLATFORMS) {
      expect(p.id.length).toBeGreaterThan(0);
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.color).toMatch(/^#/);
      expect(p.emoji.length).toBeGreaterThan(0);
    }
  });

  it('every platform has a buildShareUrl function', () => {
    for (const p of SOCIAL_PLATFORMS) {
      expect(typeof p.buildShareUrl).toBe('function');
    }
  });

  it('every platform has an explicit supportsShare boolean', () => {
    for (const p of SOCIAL_PLATFORMS) {
      expect(typeof p.supportsShare).toBe('boolean');
    }
  });

  it('platform ids are unique', () => {
    const ids = SOCIAL_PLATFORMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes the expected key platforms', () => {
    const ids = SOCIAL_PLATFORMS.map((p) => p.id);
    for (const expected of ['twitter', 'instagram', 'youtube', 'tiktok', 'linkedin', 'facebook', 'bluesky', 'discord', 'github', 'website', 'other']) {
      expect(ids).toContain(expected);
    }
  });

  it('platforms without web-share intents have supportsShare === false', () => {
    for (const id of ['instagram', 'youtube', 'tiktok', 'discord', 'twitch', 'github', 'spotify', 'soundcloud']) {
      expect(PLATFORM_MAP[id].supportsShare).toBe(false);
    }
  });

  it('platforms with web-share intents have supportsShare === true', () => {
    for (const id of ['twitter', 'facebook', 'linkedin', 'whatsapp', 'bluesky', 'threads']) {
      expect(PLATFORM_MAP[id].supportsShare).toBe(true);
    }
  });
});

// ─── PLATFORM_MAP ─────────────────────────────────────────────────────────────

describe('PLATFORM_MAP', () => {
  it('contains every platform from SOCIAL_PLATFORMS', () => {
    for (const p of SOCIAL_PLATFORMS) {
      expect(PLATFORM_MAP[p.id]).toBeDefined();
      expect(PLATFORM_MAP[p.id]).toBe(p);
    }
  });
});

// ─── detectPlatform ──────────────────────────────────────────────────────────

describe('detectPlatform', () => {
  it('detects twitter.com URL', () => {
    expect(detectPlatform('https://twitter.com/dreamengin')?.id).toBe('twitter');
  });

  it('detects x.com URL', () => {
    expect(detectPlatform('https://x.com/dreamengin')?.id).toBe('twitter');
  });

  it('detects instagram.com URL', () => {
    expect(detectPlatform('https://www.instagram.com/dreamengin')?.id).toBe('instagram');
  });

  it('detects youtube.com URL', () => {
    expect(detectPlatform('https://www.youtube.com/@dreamengin')?.id).toBe('youtube');
  });

  it('detects youtu.be URL', () => {
    expect(detectPlatform('https://youtu.be/abc123')?.id).toBe('youtube');
  });

  it('detects tiktok.com URL', () => {
    expect(detectPlatform('https://www.tiktok.com/@dreamengin')?.id).toBe('tiktok');
  });

  it('detects linkedin.com URL', () => {
    expect(detectPlatform('https://www.linkedin.com/in/dreamengin')?.id).toBe('linkedin');
  });

  it('detects facebook.com URL', () => {
    expect(detectPlatform('https://www.facebook.com/dreamengin')?.id).toBe('facebook');
  });

  it('detects bsky.app URL', () => {
    expect(detectPlatform('https://bsky.app/profile/dreamengin.bsky.social')?.id).toBe('bluesky');
  });

  it('detects threads.net URL', () => {
    expect(detectPlatform('https://www.threads.net/@dreamengin')?.id).toBe('threads');
  });

  it('detects github.com URL', () => {
    expect(detectPlatform('https://github.com/dreamengin')?.id).toBe('github');
  });

  it('detects discord.gg URL', () => {
    expect(detectPlatform('https://discord.gg/dreamengin')?.id).toBe('discord');
  });

  it('detects twitch.tv URL', () => {
    expect(detectPlatform('https://www.twitch.tv/dreamengin')?.id).toBe('twitch');
  });

  it('detects spotify URL', () => {
    expect(detectPlatform('https://open.spotify.com/user/dreamengin')?.id).toBe('spotify');
  });

  it('returns undefined for an unrecognised URL', () => {
    expect(detectPlatform('https://example.com/user')).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(detectPlatform('')).toBeUndefined();
  });
});

// ─── getPlatform ──────────────────────────────────────────────────────────────

describe('getPlatform', () => {
  it('returns the correct platform for a known id', () => {
    expect(getPlatform('twitter').id).toBe('twitter');
    expect(getPlatform('instagram').id).toBe('instagram');
  });

  it('returns the "other" platform for an unknown id', () => {
    expect(getPlatform('nonexistent').id).toBe('other');
  });
});

// ─── buildShareUrl ───────────────────────────────────────────────────────────

describe('buildShareUrl', () => {
  const profileUrl = 'https://dreamengin.app/u/testuser';
  const shareText = 'Check this out!';

  it('Twitter share URL contains the encoded profile URL', () => {
    const url = PLATFORM_MAP['twitter'].buildShareUrl(profileUrl, shareText);
    expect(url).toContain('twitter.com/intent/tweet');
    expect(url).toContain(encodeURIComponent(profileUrl));
    expect(url).toContain(encodeURIComponent(shareText));
  });

  it('Facebook share URL contains the encoded profile URL', () => {
    const url = PLATFORM_MAP['facebook'].buildShareUrl(profileUrl);
    expect(url).toContain('facebook.com/sharer');
    expect(url).toContain(encodeURIComponent(profileUrl));
  });

  it('LinkedIn share URL contains the encoded profile URL', () => {
    const url = PLATFORM_MAP['linkedin'].buildShareUrl(profileUrl);
    expect(url).toContain('linkedin.com/sharing');
    expect(url).toContain(encodeURIComponent(profileUrl));
  });

  it('WhatsApp share URL contains the encoded text and URL', () => {
    const url = PLATFORM_MAP['whatsapp'].buildShareUrl(profileUrl, shareText);
    expect(url).toContain('api.whatsapp.com/send');
    expect(url).toContain(encodeURIComponent(profileUrl));
  });

  it('Bluesky share URL contains the encoded text + URL', () => {
    const url = PLATFORM_MAP['bluesky'].buildShareUrl(profileUrl, shareText);
    expect(url).toContain('bsky.app/intent/compose');
    expect(url).toContain(encodeURIComponent(profileUrl));
  });

  it('Threads share URL contains the encoded text + URL', () => {
    const url = PLATFORM_MAP['threads'].buildShareUrl(profileUrl, shareText);
    expect(url).toContain('threads.net/intent/post');
    expect(url).toContain(encodeURIComponent(profileUrl));
  });

  it('website buildShareUrl returns the URL unchanged', () => {
    expect(PLATFORM_MAP['website'].buildShareUrl(profileUrl)).toBe(profileUrl);
  });

  it('other buildShareUrl returns the URL unchanged', () => {
    expect(PLATFORM_MAP['other'].buildShareUrl(profileUrl)).toBe(profileUrl);
  });
});

// ─── PROFILE_SHARE_PLATFORMS ─────────────────────────────────────────────────

describe('PROFILE_SHARE_PLATFORMS', () => {
  it('contains at least 4 platforms', () => {
    expect(PROFILE_SHARE_PLATFORMS.length).toBeGreaterThanOrEqual(4);
  });

  it('every platform in the list has supportsShare === true', () => {
    for (const p of PROFILE_SHARE_PLATFORMS) {
      expect(p.supportsShare).toBe(true);
    }
  });

  it('includes twitter, facebook, linkedin, and whatsapp', () => {
    const ids = PROFILE_SHARE_PLATFORMS.map((p) => p.id);
    expect(ids).toContain('twitter');
    expect(ids).toContain('facebook');
    expect(ids).toContain('linkedin');
    expect(ids).toContain('whatsapp');
  });

  it('excludes link-only platforms (instagram, youtube, discord, github)', () => {
    const ids = PROFILE_SHARE_PLATFORMS.map((p) => p.id);
    expect(ids).not.toContain('instagram');
    expect(ids).not.toContain('youtube');
    expect(ids).not.toContain('discord');
    expect(ids).not.toContain('github');
  });

  it('every platform in the list has a meaningful buildShareUrl', () => {
    const url = 'https://dreamengin.app/u/test';
    for (const p of PROFILE_SHARE_PLATFORMS) {
      const result = p.buildShareUrl(url);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }
  });
});
