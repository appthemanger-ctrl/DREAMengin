import { describe, expect, it } from 'vitest';
import { resolvePublishIntent } from '@/lib/content/publishIntent';

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
