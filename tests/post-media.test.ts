import { describe, expect, it } from 'vitest';
import { getPostMediaUrls, getPrimaryPostMediaUrl } from '@/lib/media/postMedia';

describe('post media normalization', () => {
  it('prefers the canonical media_url when present', () => {
    expect(getPrimaryPostMediaUrl({
      media_url: 'https://example.com/direct.png',
      media_urls: ['https://example.com/other.png'],
    })).toBe('https://example.com/direct.png');
  });

  it('collects media urls from media_urls and media_json payloads', () => {
    expect(getPostMediaUrls({
      media_urls: ['https://example.com/a.png'],
      media_json: {
        images: ['https://example.com/a.png', 'https://example.com/b.png'],
        audio: ['https://example.com/c.mp3'],
      },
    })).toEqual([
      'https://example.com/a.png',
      'https://example.com/b.png',
      'https://example.com/c.mp3',
    ]);
  });
});
