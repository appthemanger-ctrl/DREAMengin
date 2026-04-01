import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('youtube provider discovery helpers', () => {
  const originalEnv = {
    API_KEY: process.env.API_KEY,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    YOUTUBE_ANALYTICS_API_KEY: process.env.YOUTUBE_ANALYTICS_API_KEY,
  };

  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    delete process.env.API_KEY;
    delete process.env.YOUTUBE_API_KEY;
    delete process.env.YOUTUBE_ANALYTICS_API_KEY;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();

    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('falls back to API_KEY when YOUTUBE_API_KEY is not configured', async () => {
    process.env.API_KEY = 'shared-key';

    const { getYouTubeApiKey, getYouTubeAnalyticsApiKey } = await import('@/lib/connectors/providers/youtube');

    expect(getYouTubeApiKey()).toBe('shared-key');
    expect(getYouTubeAnalyticsApiKey()).toBe('shared-key');
  });

  it('prefers the explicit YouTube-specific keys when present', async () => {
    process.env.API_KEY = 'shared-key';
    process.env.YOUTUBE_API_KEY = 'youtube-key';
    process.env.YOUTUBE_ANALYTICS_API_KEY = 'youtube-analytics-key';

    const { getYouTubeApiKey, getYouTubeAnalyticsApiKey } = await import('@/lib/connectors/providers/youtube');

    expect(getYouTubeApiKey()).toBe('youtube-key');
    expect(getYouTubeAnalyticsApiKey()).toBe('youtube-analytics-key');
  });

  it('mixes trending and world-news items into a capped discovery feed', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        items: [
          {
            id: 'trend-1',
            snippet: {
              title: 'Trending build fix',
              channelTitle: 'DREAMengin',
              publishedAt: '2026-03-25T00:00:00.000Z',
              thumbnails: { high: { url: 'https://img.example/trend-1.jpg' } },
            },
          },
          {
            id: 'shared-video',
            snippet: {
              title: 'Shared story',
              channelTitle: 'Shared Channel',
              publishedAt: '2026-03-24T00:00:00.000Z',
              thumbnails: { high: { url: 'https://img.example/shared.jpg' } },
            },
          },
        ],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        items: [
          {
            id: { videoId: 'news-1' },
            snippet: {
              title: 'World news update',
              channelTitle: 'News Desk',
              publishedAt: '2026-03-23T00:00:00.000Z',
              thumbnails: { high: { url: 'https://img.example/news-1.jpg' } },
            },
          },
          {
            id: { videoId: 'shared-video' },
            snippet: {
              title: 'Shared story',
              channelTitle: 'Shared Channel',
              publishedAt: '2026-03-22T00:00:00.000Z',
              thumbnails: { high: { url: 'https://img.example/shared-news.jpg' } },
            },
          },
        ],
      }), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);
    const { youtubeDiscovery } = await import('@/lib/connectors/providers/youtube');

    const items = await youtubeDiscovery('youtube-key', 3);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/videos?part=snippet&chart=mostPopular');
    expect(fetchMock.mock.calls[1]?.[0]).toContain('/search?part=snippet&q=world%20news');
    expect(items).toHaveLength(3);
    expect(new Set(items.map((item) => item.external_id)).size).toBe(3);
    expect(items.map((item) => item.external_id)).toEqual(expect.arrayContaining([
      'subs:trend-1',
      'subs:news-1',
      'subs:shared-video',
    ]));
  });

  it('surfaces API request failures from discovery fetches', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response('boom', { status: 500, statusText: 'Internal Server Error' }));

    vi.stubGlobal('fetch', fetchMock);
    const { youtubeDiscovery } = await import('@/lib/connectors/providers/youtube');

    await expect(youtubeDiscovery('youtube-key', 5)).rejects.toThrow(
      'YouTube request failed: 500 Internal Server Error — boom',
    );
  });

  it('youtubeSearchByQuery returns normalised feed items for a keyword', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({
        items: [
          {
            id: { videoId: 'weed-1' },
            snippet: {
              title: 'Top 10 Weed Strains',
              channelTitle: 'Cannabis Daily',
              publishedAt: '2026-03-28T10:00:00.000Z',
              thumbnails: { high: { url: 'https://img.example/weed-1.jpg' } },
            },
          },
        ],
      }), { status: 200 }),
    );

    vi.stubGlobal('fetch', fetchMock);
    const { youtubeSearchByQuery } = await import('@/lib/connectors/providers/youtube');

    const items = await youtubeSearchByQuery('youtube-key', 'weed', 5);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/search?part=snippet&q=weed');
    expect(fetchMock.mock.calls[0]?.[0]).toContain('type=video');
    expect(fetchMock.mock.calls[0]?.[0]).toContain('key=youtube-key');
    expect(items).toHaveLength(1);
    expect(items[0]?.external_id).toBe('subs:weed-1');
    expect(items[0]?.content_text).toBe('Top 10 Weed Strains');
    expect(items[0]?.author_name).toBe('Cannabis Daily');
    expect(items[0]?.provider).toBe('youtube');
    expect(items[0]?.media[0]?.type).toBe('video');
  });

  it('youtubeSearchByQuery caps max at 50', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { youtubeSearchByQuery } = await import('@/lib/connectors/providers/youtube');

    await youtubeSearchByQuery('youtube-key', 'neil degrasse tyson', 999);

    // max should be clamped to 50
    expect(fetchMock.mock.calls[0]?.[0]).toContain('maxResults=50');
  });

  it('youtubeSearchByQuery rejects when API key is missing', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const { youtubeSearchByQuery } = await import('@/lib/connectors/providers/youtube');

    await expect(youtubeSearchByQuery('', 'world news', 5)).rejects.toThrow(
      'YouTube API key is required.',
    );
  });
});
