import { describe, expect, it, vi } from 'vitest';
import {
  formatPublishError,
  publishToDreamR,
  resolvePublishIntent,
} from '@/lib/content/publishIntent';

describe('resolvePublishIntent', () => {
  it('prefers the explicit draft text', () => {
    expect(resolvePublishIntent({
      draft: '  publish this draft  ',
      captionResult: 'fallback caption',
      videoTitle: 'Fallback title',
    })).toBe('publish this draft');
  });

  it('falls back to generated caption text', () => {
    expect(resolvePublishIntent({
      draft: '   ',
      captionResult: 'Ready caption',
    })).toBe('Ready caption');
  });

  it('turns a video title into publishable copy when no richer text exists', () => {
    expect(resolvePublishIntent({
      videoTitle: 'Launch Day',
    })).toBe('New video: Launch Day');
  });

  it('falls back through topical fields when direct copy is missing', () => {
    expect(resolvePublishIntent({
      draftTopic: 'Creator workflow',
      captionTopic: 'Unused fallback',
    })).toBe('Creator workflow');
    expect(resolvePublishIntent({
      hookTopic: 'Hook only',
    })).toBe('Hook only');
  });

  it('uses seoInput as the last non-null fallback', () => {
    expect(resolvePublishIntent({
      draft: ' ',
      captionResult: '',
      videoTitle: null,
      draftTopic: undefined,
      captionTopic: '   ',
      hookTopic: '',
      seoInput: 'Search-led publish copy',
    })).toBe('Search-led publish copy');
  });

  it('returns null when nothing publishable is available', () => {
    expect(resolvePublishIntent({
      draft: '   ',
      captionResult: '\n',
      videoTitle: '',
      draftTopic: '  ',
      captionTopic: null,
      hookTopic: undefined,
      seoInput: '',
    })).toBeNull();
  });
});

describe('formatPublishError', () => {
  it('prefers an explicit API error', () => {
    expect(formatPublishError({ status: 400, statusText: 'Bad Request' }, { error: 'Rate limited' })).toBe('Rate limited');
  });

  it('falls back to status text, then an explicit default', () => {
    expect(formatPublishError({ status: 500, statusText: 'Server exploded' })).toBe('Server exploded');
    expect(formatPublishError({ status: 0, statusText: '' })).toBe('Failed to publish to DreamR (unknown)');
  });
});

describe('publishToDreamR', () => {
  it('creates a real post and emits the create:published payload after success', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      statusText: 'Created',
      json: vi.fn().mockResolvedValue({ post: { id: 'post-123' } }),
    });
    const onPublished = vi.fn();

    const id = await publishToDreamR({
      content: 'Ship it',
      platforms: ['Feed', 'TikTok'],
      fetchImpl,
      onPublished,
    });

    expect(id).toBe('post-123');
    expect(fetchImpl).toHaveBeenCalledWith('/api/posts', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }));
    expect(onPublished).toHaveBeenCalledWith({
      contentId: 'post-123',
      platform: 'Feed,TikTok',
    });
  });

  it('throws a formatted error when the publish API rejects the request', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: '',
      json: vi.fn().mockResolvedValue({}),
    });

    await expect(publishToDreamR({
      content: 'Ship it',
      platforms: ['Feed'],
      fetchImpl,
      onPublished: vi.fn(),
    })).rejects.toThrow('Failed to publish to DreamR (429)');
  });

  it('throws when the publish API succeeds without returning a persisted post id', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      statusText: 'Created',
      json: vi.fn().mockResolvedValue({ post: {} }),
    });

    await expect(publishToDreamR({
      content: 'Ship it',
      platforms: ['Feed'],
      fetchImpl,
      onPublished: vi.fn(),
    })).rejects.toThrow('DreamR publish response did not include a post id.');
  });
});
