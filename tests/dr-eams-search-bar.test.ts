/**
 * tests/dr-eams-search-bar.test.ts
 *
 * Unit tests for lib/dreamengin/drEamsSearch.ts — the pure helper layer
 * powering the Dr. Eams HomeDream search bar.
 *
 * Architecture justification:
 *   - docs/FEATURE_STATUS.md Phase 6 item #4: Dr. Eams as HomeDream search
 *     bar with send-to-DreamDM routing.
 *   - docs/AXIOMS.md: every visible action must do something real.
 *
 * All functions are pure — no Next.js, no DOM, no network needed.
 */

import { describe, expect, it } from 'vitest';
import {
  buildDreamDMUrl,
  buildDrEamsRequest,
  matchNavSuggestions,
  NAV_SUGGESTIONS,
  parseDrEamsReply,
  truncatePreview,
} from '@/lib/dreamengin/drEamsSearch';

// ── matchNavSuggestions ────────────────────────────────────────────────────────

describe('matchNavSuggestions', () => {
  it('returns empty array for empty query', () => {
    expect(matchNavSuggestions('')).toEqual([]);
    expect(matchNavSuggestions('   ')).toEqual([]);
  });

  it('matches "music" to Music Daydream', () => {
    const results = matchNavSuggestions('music');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.label.toLowerCase().includes('music'))).toBe(true);
  });

  it('is case-insensitive', () => {
    const lower = matchNavSuggestions('dream');
    const upper = matchNavSuggestions('DREAM');
    const mixed = matchNavSuggestions('dReAm');
    expect(lower.length).toBe(upper.length);
    expect(lower.length).toBe(mixed.length);
  });

  it('matches canonical product names (DreamShop, DreamDM, DreamAds, DreamMarketplace)', () => {
    expect(matchNavSuggestions('shop').some(r => r.label === 'DreamShop')).toBe(true);
    expect(matchNavSuggestions('dm').some(r => r.label === 'DreamDM')).toBe(true);
    expect(matchNavSuggestions('ads').some(r => r.label === 'DreamAds')).toBe(true);
    expect(matchNavSuggestions('market').some(r => r.label === 'DreamMarketplace')).toBe(true);
  });

  it('matches "eams" to Dr. Eams (null href)', () => {
    const results = matchNavSuggestions('eams');
    expect(results.length).toBeGreaterThan(0);
    const drEams = results.find(r => r.label === 'Dr. Eams');
    expect(drEams).toBeDefined();
    expect(drEams?.href).toBeNull();
  });

  it('respects the default limit of 5', () => {
    // "dream" matches many labels — result must not exceed 5
    const results = matchNavSuggestions('dream');
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('respects a custom limit', () => {
    const results = matchNavSuggestions('a', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('returns a subset of NAV_SUGGESTIONS', () => {
    const results = matchNavSuggestions('music');
    for (const r of results) {
      expect(NAV_SUGGESTIONS).toContainEqual(r);
    }
  });

  it('EditProfileDream appears for "profile" query', () => {
    const results = matchNavSuggestions('profile');
    expect(results.some(r => r.label === 'EditProfileDream')).toBe(true);
  });

  it('returns suggestions with href or null (never undefined)', () => {
    const results = matchNavSuggestions('code');
    for (const r of results) {
      expect(r.href === null || typeof r.href === 'string').toBe(true);
    }
  });
});

// ── buildDrEamsRequest ─────────────────────────────────────────────────────────

describe('buildDrEamsRequest', () => {
  it('trims whitespace from the message', () => {
    const req = buildDrEamsRequest('  hello world  ');
    expect(req.message).toBe('hello world');
  });

  it('defaults route to /homedream', () => {
    const req = buildDrEamsRequest('test');
    expect(req.ui.route).toBe('/homedream');
  });

  it('uses provided route', () => {
    const req = buildDrEamsRequest('test', '/daydream/music');
    expect(req.ui.route).toBe('/daydream/music');
  });

  it('produces a shape compatible with DrEamsRunBodySchema', () => {
    const req = buildDrEamsRequest('how do I add a widget?');
    expect(typeof req.message).toBe('string');
    expect(req.message.length).toBeGreaterThan(0);
    expect(typeof req.ui).toBe('object');
    expect(typeof req.ui.route).toBe('string');
  });

  it('does not include client_session_id by default', () => {
    const req = buildDrEamsRequest('test');
    expect(req.client_session_id).toBeUndefined();
  });
});

// ── parseDrEamsReply ───────────────────────────────────────────────────────────

describe('parseDrEamsReply', () => {
  it('extracts response_text from a normal reply', () => {
    const data = { response_text: 'Here is how to add a widget.' };
    const result = parseDrEamsReply(data);
    expect(result.text).toBe('Here is how to add a widget.');
    expect(result.isError).toBe(false);
  });

  it('trims whitespace from response_text', () => {
    const data = { response_text: '  Hello!  ' };
    const result = parseDrEamsReply(data);
    expect(result.text).toBe('Hello!');
  });

  it('extracts error message from { ok: false, error: { message } }', () => {
    const data = { ok: false, error: { message: 'Rate limit exceeded.' } };
    const result = parseDrEamsReply(data);
    expect(result.text).toContain('Rate limit exceeded.');
    expect(result.isError).toBe(true);
  });

  it('returns safe fallback for null', () => {
    const result = parseDrEamsReply(null);
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.isError).toBe(false);
  });

  it('returns safe fallback for undefined', () => {
    const result = parseDrEamsReply(undefined);
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('returns safe fallback for empty object', () => {
    const result = parseDrEamsReply({});
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.isError).toBe(false);
  });

  it('returns safe fallback when response_text is empty string', () => {
    const data = { response_text: '   ' };
    const result = parseDrEamsReply(data);
    // Empty response_text → falls through to fallback
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('returns safe fallback for a network error shape', () => {
    const result = parseDrEamsReply('Network error');
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('prioritises response_text over error field when both present', () => {
    const data = {
      response_text: 'Real response here.',
      error: { message: 'Should be ignored.' },
    };
    const result = parseDrEamsReply(data);
    expect(result.text).toBe('Real response here.');
    expect(result.isError).toBe(false);
  });
});

// ── buildDreamDMUrl ────────────────────────────────────────────────────────────

describe('buildDreamDMUrl', () => {
  it('always starts with /messages', () => {
    expect(buildDreamDMUrl('hello')).toMatch(/^\/messages\?/);
  });

  it('includes from=dr-eams param', () => {
    const url = buildDreamDMUrl('test query');
    expect(url).toContain('from=dr-eams');
  });

  it('includes the query as the q param', () => {
    const url = buildDreamDMUrl('how do I add music?');
    expect(url).toContain('q=');
    // URLSearchParams encodes spaces as '+'; use URL API to properly decode
    const full = new URL(`http://localhost${url}`);
    expect(full.searchParams.get('q')).toBe('how do I add music?');
  });

  it('trims the query before encoding', () => {
    const url = buildDreamDMUrl('  spaces  ');
    expect(decodeURIComponent(url)).toContain('q=spaces');
  });

  it('URL-encodes special characters', () => {
    const url = buildDreamDMUrl('music & games?');
    // Should not throw and should be a valid URL segment
    expect(() => new URL(`http://localhost${url}`)).not.toThrow();
  });
});

// ── truncatePreview ────────────────────────────────────────────────────────────

describe('truncatePreview', () => {
  it('returns short strings unchanged', () => {
    expect(truncatePreview('hello', 36)).toBe('hello');
  });

  it('truncates long strings and appends …', () => {
    const result = truncatePreview('a'.repeat(40), 36);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(37); // 36 chars + ellipsis
  });

  it('defaults maxChars to 36', () => {
    const longStr = 'x'.repeat(100);
    const result = truncatePreview(longStr);
    expect(result.length).toBeLessThanOrEqual(37);
  });

  it('returns exact-length strings unchanged', () => {
    const str = 'a'.repeat(36);
    expect(truncatePreview(str, 36)).toBe(str);
  });
});

// ── NAV_SUGGESTIONS catalogue integrity ───────────────────────────────────────

describe('NAV_SUGGESTIONS catalogue', () => {
  it('contains all six Daydream pairs', () => {
    const labels = NAV_SUGGESTIONS.map(s => s.label);
    expect(labels).toContain('Music Daydream');
    expect(labels).toContain('Games Daydream');
    expect(labels).toContain('Lab Daydream');
    expect(labels).toContain('Code Daydream');
    expect(labels).toContain('Brand Daydream');
    expect(labels).toContain('Create Daydream');
  });

  it('contains canonical platform modules (docs/ARCHITECTURE.md §1)', () => {
    const labels = NAV_SUGGESTIONS.map(s => s.label);
    expect(labels).toContain('DreamShop');
    expect(labels).toContain('DreamMarketplace');
    expect(labels).toContain('DreamDM');
    expect(labels).toContain('DreamAds');
    expect(labels).toContain('EditProfileDream');
    expect(labels).toContain('HomeDream');
  });

  it('contains Dr. Eams with a null href', () => {
    const drEams = NAV_SUGGESTIONS.find(s => s.label === 'Dr. Eams');
    expect(drEams).toBeDefined();
    expect(drEams?.href).toBeNull();
  });

  it('every suggestion with a href starts with /', () => {
    for (const s of NAV_SUGGESTIONS) {
      if (s.href !== null) {
        expect(s.href.startsWith('/')).toBe(true);
      }
    }
  });

  it('every suggestion has a non-empty icon', () => {
    for (const s of NAV_SUGGESTIONS) {
      expect(s.icon.trim().length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate labels', () => {
    const labels = NAV_SUGGESTIONS.map(s => s.label);
    const unique = new Set(labels);
    expect(unique.size).toBe(labels.length);
  });
});
