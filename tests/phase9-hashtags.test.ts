/**
 * tests/phase9-hashtags.test.ts
 *
 * Tests for lib/feed/hashtags.ts — hashtag extraction, validation,
 * trending calculation, and text segmentation.
 */

import { describe, expect, it } from 'vitest';
import {
  extractHashtags,
  validateTag,
  calculateTrending,
  formatTag,
  segmentText,
  MAX_TAGS_PER_POST,
  MAX_TAG_LENGTH,
} from '@/lib/feed/hashtags';

// ─── extractHashtags ──────────────────────────────────────────────────────────

describe('Hashtags — extractHashtags', () => {
  it('extracts simple hashtags', () => {
    const tags = extractHashtags('Check out #DREAMengin and #3dart');
    expect(tags).toHaveLength(2);
    expect(tags[0].tag).toBe('dreamengin');
    expect(tags[0].display).toBe('DREAMengin');
    expect(tags[1].tag).toBe('3dart');
  });

  it('handles tags with hyphens and underscores', () => {
    const tags = extractHashtags('#web-dev #game_art');
    expect(tags).toHaveLength(2);
    expect(tags[0].tag).toBe('web-dev');
    expect(tags[1].tag).toBe('game_art');
  });

  it('deduplicates case-insensitively, keeping first occurrence', () => {
    const tags = extractHashtags('#Dream #dream #DREAM');
    expect(tags).toHaveLength(1);
    expect(tags[0].display).toBe('Dream');
    expect(tags[0].tag).toBe('dream');
  });

  it('returns empty for text without hashtags', () => {
    expect(extractHashtags('No tags here')).toEqual([]);
  });

  it('returns empty for empty string', () => {
    expect(extractHashtags('')).toEqual([]);
  });

  it('limits to MAX_TAGS_PER_POST', () => {
    const text = Array.from({ length: 20 }, (_, i) => `#tag${i}`).join(' ');
    const tags = extractHashtags(text);
    expect(tags.length).toBe(MAX_TAGS_PER_POST);
  });

  it('skips tags longer than MAX_TAG_LENGTH', () => {
    const longTag = '#' + 'a'.repeat(MAX_TAG_LENGTH + 1);
    expect(extractHashtags(longTag)).toEqual([]);

    const okTag = '#' + 'a'.repeat(MAX_TAG_LENGTH);
    expect(extractHashtags(okTag)).toHaveLength(1);
  });

  it('ignores # followed by non-alphanumeric', () => {
    expect(extractHashtags('# nope #!bad')).toEqual([]);
  });
});

// ─── validateTag ──────────────────────────────────────────────────────────────

describe('Hashtags — validateTag', () => {
  it('validates simple tags', () => {
    expect(validateTag('DREAMengin')).toBe('dreamengin');
    expect(validateTag('web-dev')).toBe('web-dev');
    expect(validateTag('game_art')).toBe('game_art');
  });

  it('strips # prefix', () => {
    expect(validateTag('#hello')).toBe('hello');
  });

  it('trims whitespace', () => {
    expect(validateTag('  hello  ')).toBe('hello');
  });

  it('rejects empty strings', () => {
    expect(validateTag('')).toBeNull();
    expect(validateTag('#')).toBeNull();
    expect(validateTag('  ')).toBeNull();
  });

  it('rejects tags with special characters', () => {
    expect(validateTag('hello world')).toBeNull();
    expect(validateTag('bad@tag')).toBeNull();
  });

  it('rejects tags starting with non-alphanumeric', () => {
    expect(validateTag('-bad')).toBeNull();
    expect(validateTag('_bad')).toBeNull();
  });

  it('rejects tags exceeding MAX_TAG_LENGTH', () => {
    expect(validateTag('a'.repeat(MAX_TAG_LENGTH + 1))).toBeNull();
  });
});

// ─── calculateTrending ───────────────────────────────────────────────────────

describe('Hashtags — calculateTrending', () => {
  const NOW = Date.now();
  const HOUR = 3_600_000;

  it('ranks by momentum (recent usage higher)', () => {
    const usages = [
      { tag: 'old-tag', timestamp: NOW - 24 * HOUR },
      { tag: 'old-tag', timestamp: NOW - 24 * HOUR },
      { tag: 'new-tag', timestamp: NOW - 1 * HOUR },
    ];
    const trending = calculateTrending(usages, NOW);
    expect(trending[0].tag).toBe('new-tag');
  });

  it('counts total usage per tag', () => {
    const usages = [
      { tag: 'popular', timestamp: NOW },
      { tag: 'popular', timestamp: NOW },
      { tag: 'popular', timestamp: NOW },
      { tag: 'niche', timestamp: NOW },
    ];
    const trending = calculateTrending(usages, NOW);
    const popular = trending.find((t) => t.tag === 'popular');
    expect(popular?.count).toBe(3);
  });

  it('respects limit parameter', () => {
    const usages = Array.from({ length: 50 }, (_, i) => ({
      tag: `tag-${i}`,
      timestamp: NOW,
    }));
    const trending = calculateTrending(usages, NOW, 0.1, 5);
    expect(trending).toHaveLength(5);
  });

  it('returns empty for no usages', () => {
    expect(calculateTrending([])).toEqual([]);
  });
});

// ─── formatTag ────────────────────────────────────────────────────────────────

describe('Hashtags — formatTag', () => {
  it('prepends #', () => {
    expect(formatTag('dream')).toBe('#dream');
    expect(formatTag('DREAMengin')).toBe('#DREAMengin');
  });
});

// ─── segmentText ──────────────────────────────────────────────────────────────

describe('Hashtags — segmentText', () => {
  it('splits text and hashtags into segments', () => {
    const segments = segmentText('Hello #world from #DREAMengin');
    expect(segments).toEqual([
      { type: 'text', value: 'Hello ' },
      { type: 'hashtag', value: '#world' },
      { type: 'text', value: ' from ' },
      { type: 'hashtag', value: '#DREAMengin' },
    ]);
  });

  it('handles text without hashtags', () => {
    const segments = segmentText('No hashtags here');
    expect(segments).toEqual([
      { type: 'text', value: 'No hashtags here' },
    ]);
  });

  it('handles text starting with hashtag', () => {
    const segments = segmentText('#first text');
    expect(segments).toEqual([
      { type: 'hashtag', value: '#first' },
      { type: 'text', value: ' text' },
    ]);
  });

  it('handles consecutive hashtags', () => {
    const segments = segmentText('#a #b');
    expect(segments).toEqual([
      { type: 'hashtag', value: '#a' },
      { type: 'text', value: ' ' },
      { type: 'hashtag', value: '#b' },
    ]);
  });

  it('handles empty string', () => {
    expect(segmentText('')).toEqual([]);
  });
});
