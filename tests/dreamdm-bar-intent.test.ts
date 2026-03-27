/**
 * tests/dreamdm-bar-intent.test.ts
 *
 * Unit tests for the DreamDM Bar intent system — the context-aware mode
 * switching that lets users type in a single input bar and choose whether
 * to search, message, comment, or ask Dr. Eams.
 *
 * Tests:
 *   - resolveIntentOverride: pure function that maps BarIntentMode to context
 *   - detectSurface: unchanged, but re-validated for completeness
 *   - DEFAULT_BAR_INTENT: structural contract
 *   - BarIntentMode type coverage
 *
 * Architecture justification: docs/ARCHITECTURE.md §1 — DreamDM Bar is the
 * Runtime Seam / Persistent Interaction Rail.
 *
 * Performance impact: none (pure tests, no runtime).
 */

import { describe, it, expect } from 'vitest';

import {
  detectSurface,
  resolveIntentOverride,
} from '@/lib/dreamdm/useDreamBarContext';

import {
  DEFAULT_BAR_INTENT,
  type BarIntentMode,
  type BarIntent,
} from '@/lib/dreamdm/DreamSystemContext';

// ── DEFAULT_BAR_INTENT ────────────────────────────────────────────────────────

describe('DEFAULT_BAR_INTENT', () => {
  it('defaults to "default" mode', () => {
    expect(DEFAULT_BAR_INTENT.mode).toBe('default');
  });

  it('has no targetPostId', () => {
    expect(DEFAULT_BAR_INTENT.targetPostId).toBeUndefined();
  });

  it('has no targetLabel', () => {
    expect(DEFAULT_BAR_INTENT.targetLabel).toBeUndefined();
  });
});

// ── resolveIntentOverride ─────────────────────────────────────────────────────

describe('resolveIntentOverride', () => {
  it('returns undefined for "default" mode (no override)', () => {
    expect(resolveIntentOverride('default')).toBeUndefined();
  });

  it('returns search context for "search" mode', () => {
    const result = resolveIntentOverride('search');
    expect(result).toBeDefined();
    expect(result!.iconHint).toBe('search');
    expect(result!.actionLabel).toBe('Search');
    expect(result!.placeholder).toContain('Search');
  });

  it('returns message context for "message" mode', () => {
    const result = resolveIntentOverride('message');
    expect(result).toBeDefined();
    expect(result!.iconHint).toBe('send');
    expect(result!.actionLabel).toBe('Send');
    expect(result!.placeholder).toContain('message');
  });

  it('returns Dr. Eams context for "dreams" mode', () => {
    const result = resolveIntentOverride('dreams');
    expect(result).toBeDefined();
    expect(result!.iconHint).toBe('bot');
    expect(result!.actionLabel).toBe('Ask');
    expect(result!.placeholder).toContain('Dr. Eams');
  });

  it('returns comment context for "comment" mode', () => {
    const result = resolveIntentOverride('comment');
    expect(result).toBeDefined();
    expect(result!.iconHint).toBe('message-circle');
    expect(result!.actionLabel).toBe('Comment');
  });

  it('includes the target label in comment placeholder when provided', () => {
    const result = resolveIntentOverride('comment', 'Jane');
    expect(result).toBeDefined();
    expect(result!.placeholder).toContain('Jane');
  });

  it('shows generic comment placeholder when no target label', () => {
    const result = resolveIntentOverride('comment');
    expect(result).toBeDefined();
    expect(result!.placeholder).toContain('comment');
    expect(result!.placeholder).not.toContain('undefined');
  });

  it('every non-default mode returns a valid action aria label', () => {
    const modes: BarIntentMode[] = ['search', 'message', 'dreams', 'comment'];
    for (const mode of modes) {
      const result = resolveIntentOverride(mode);
      expect(result).toBeDefined();
      expect(typeof result!.actionAriaLabel).toBe('string');
      expect(result!.actionAriaLabel.length).toBeGreaterThan(0);
    }
  });
});

// ── detectSurface with intent mode combinations ──────────────────────────────

describe('detectSurface (baseline re-validation)', () => {
  it('detects /homedream as feed', () => {
    expect(detectSurface('/homedream')).toBe('feed');
  });

  it('detects /messages as messages', () => {
    expect(detectSurface('/messages')).toBe('messages');
  });

  it('detects /discover as discover', () => {
    expect(detectSurface('/discover')).toBe('discover');
  });

  it('detects unknown route as general', () => {
    expect(detectSurface('/some-other-route')).toBe('general');
  });
});

// ── BarIntent shape contract ─────────────────────────────────────────────────

describe('BarIntent shape contract', () => {
  it('comment intent includes targetPostId', () => {
    const intent: BarIntent = {
      mode: 'comment',
      targetPostId: 'post-123',
      targetLabel: 'Jane',
    };
    expect(intent.mode).toBe('comment');
    expect(intent.targetPostId).toBe('post-123');
    expect(intent.targetLabel).toBe('Jane');
  });

  it('search intent has no targetPostId', () => {
    const intent: BarIntent = { mode: 'search' };
    expect(intent.targetPostId).toBeUndefined();
  });

  it('message intent has no targetPostId', () => {
    const intent: BarIntent = { mode: 'message' };
    expect(intent.targetPostId).toBeUndefined();
  });

  it('dreams intent has no targetPostId', () => {
    const intent: BarIntent = { mode: 'dreams' };
    expect(intent.targetPostId).toBeUndefined();
  });

  it('all five modes are valid BarIntentMode values', () => {
    const modes: BarIntentMode[] = ['default', 'search', 'message', 'dreams', 'comment'];
    expect(modes.length).toBe(5);
    for (const m of modes) {
      const intent: BarIntent = { mode: m };
      expect(intent.mode).toBe(m);
    }
  });
});
