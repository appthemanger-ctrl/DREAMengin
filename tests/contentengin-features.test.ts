import { afterEach, describe, expect, it, vi } from 'vitest';

// ─── Supabase mock ────────────────────────────────────────────────────────────
const createServerClient = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient,
}));

function makeAuthedSupabase(extraFrom?: (table: string) => object) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-42' } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => extraFrom?.(table) ?? { insert: vi.fn() }),
  };
}

function makeUnauthSupabase() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'not authenticated' } }),
    },
  };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

// ─────────────────────────────────────────────────────────────────────────────
// Transcript Editor (lib/content/transcriptEditor)
// ─────────────────────────────────────────────────────────────────────────────
describe('transcriptEditor – parseSRT', () => {
  it('parses a basic SRT file into segments', async () => {
    const { parseSRT } = await import('../lib/content/transcriptEditor');
    const srt = `1\n00:00:00,000 --> 00:00:02,500\nHello world\n\n2\n00:00:03,000 --> 00:00:05,000\nFoo bar baz\n`;
    const segs = parseSRT(srt);
    expect(segs).toHaveLength(2);
    expect(segs[0].id).toBe(1);
    expect(segs[0].startMs).toBe(0);
    expect(segs[0].endMs).toBe(2500);
    expect(segs[0].text).toBe('Hello world');
    expect(segs[0].words).toHaveLength(2);
    expect(segs[1].text).toBe('Foo bar baz');
  });

  it('returns empty array for invalid SRT', async () => {
    const { parseSRT } = await import('../lib/content/transcriptEditor');
    expect(parseSRT('')).toHaveLength(0);
    expect(parseSRT('not an srt file at all')).toHaveLength(0);
  });
});

describe('transcriptEditor – parseVTT', () => {
  it('parses a WebVTT file into segments', async () => {
    const { parseVTT } = await import('../lib/content/transcriptEditor');
    const vtt = `WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nOne two three\n\n00:00:03.000 --> 00:00:05.000\nFour five\n`;
    const segs = parseVTT(vtt);
    expect(segs).toHaveLength(2);
    expect(segs[0].startMs).toBe(0);
    expect(segs[0].endMs).toBe(2000);
    expect(segs[0].text).toBe('One two three');
    expect(segs[0].words).toHaveLength(3);
  });
});

describe('transcriptEditor – computeCuts', () => {
  it('returns empty cuts when no words are deleted', async () => {
    const { parseSRT, computeCuts } = await import('../lib/content/transcriptEditor');
    const segs = parseSRT(`1\n00:00:00,000 --> 00:00:02,000\nHello world\n`);
    const cuts = computeCuts(segs, new Set());
    expect(cuts).toHaveLength(0);
  });

  it('computes a single cut when one word is deleted', async () => {
    const { parseSRT, computeCuts } = await import('../lib/content/transcriptEditor');
    const segs = parseSRT(`1\n00:00:00,000 --> 00:00:02,000\nHello world\n`);
    const firstWordIdx = segs[0].words[0].index;
    const cuts = computeCuts(segs, new Set([firstWordIdx]));
    expect(cuts).toHaveLength(1);
    expect(cuts[0].cutStartMs).toBeGreaterThanOrEqual(0);
    expect(cuts[0].cutEndMs).toBeGreaterThan(cuts[0].cutStartMs);
  });

  it('merges adjacent word deletions into a single cut', async () => {
    const { parseSRT, computeCuts } = await import('../lib/content/transcriptEditor');
    const segs = parseSRT(`1\n00:00:00,000 --> 00:00:03,000\nOne two three\n`);
    const wordIndices = segs[0].words.map(w => w.index);
    // delete all words — expect one merged cut
    const cuts = computeCuts(segs, new Set(wordIndices));
    expect(cuts).toHaveLength(1);
  });
});

describe('transcriptEditor – segmentsToPlainText', () => {
  it('joins segment texts with spaces', async () => {
    const { parseSRT, segmentsToPlainText } = await import('../lib/content/transcriptEditor');
    const segs = parseSRT(`1\n00:00:00,000 --> 00:00:01,000\nHello\n\n2\n00:00:01,000 --> 00:00:02,000\nworld\n`);
    expect(segmentsToPlainText(segs)).toBe('Hello world');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SEO Scorer (lib/content/seoScorer)
// ─────────────────────────────────────────────────────────────────────────────
describe('seoScorer – scoreContent', () => {
  it('returns overall score between 0 and 100', async () => {
    const { scoreContent } = await import('../lib/content/seoScorer');
    const result = scoreContent({ title: 'How to Build a Creator Funnel in 7 Days' });
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  it('rewards good title length and power words', async () => {
    const { scoreContent } = await import('../lib/content/seoScorer');
    const good = scoreContent({ title: 'The Ultimate Guide to Content Marketing for Beginners' });
    const bad = scoreContent({ title: 'Content' });
    expect(good.overall).toBeGreaterThan(bad.overall);
  });

  it('includes readabilityGrade in result', async () => {
    const { scoreContent } = await import('../lib/content/seoScorer');
    const result = scoreContent({ title: 'Test', body: 'This is a short body of text used for scoring purposes.' });
    expect(result.readabilityGrade).toBeTruthy();
    expect(typeof result.readabilityGrade).toBe('string');
  });

  it('returns topSuggestions array', async () => {
    const { scoreContent } = await import('../lib/content/seoScorer');
    const result = scoreContent({ title: 'x' });
    expect(Array.isArray(result.topSuggestions)).toBe(true);
  });

  it('penalises keyword over-stuffing', async () => {
    const { scoreContent } = await import('../lib/content/seoScorer');
    const body = 'creator creator creator creator creator creator creator creator creator creator creator creator creator';
    const stuffed = scoreContent({ title: 'Creator tips', body, keywords: ['creator'] });
    const balanced = scoreContent({ title: 'Creator tips', body: 'Here are some creator tips for building your audience effectively in 2026.', keywords: ['creator'] });
    // stuffed should have lower or equal score than balanced
    expect(stuffed.overall).toBeLessThanOrEqual(balanced.overall + 10);
  });

  it('returns dimensions array with per-category scores', async () => {
    const { scoreContent } = await import('../lib/content/seoScorer');
    const result = scoreContent({ title: 'My post title', body: 'A body with some content.' });
    expect(Array.isArray(result.dimensions)).toBe(true);
    expect(result.dimensions.length).toBeGreaterThanOrEqual(1);
    for (const d of result.dimensions) {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.maxScore).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Transcribe API route
// ─────────────────────────────────────────────────────────────────────────────
describe('/api/content/transcribe', () => {
  it('rejects unauthenticated requests with 401', async () => {
    createServerClient.mockResolvedValue(makeUnauthSupabase());
    const { POST } = await import('../app/api/content/transcribe/route');
    const req = new Request('https://dreamengin.app/api/content/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtitleContent: '1\n00:00:00,000 --> 00:00:01,000\nHello\n', format: 'srt' }),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(401);
  });

  it('returns rawContent when valid SRT is uploaded', async () => {
    createServerClient.mockResolvedValue(makeAuthedSupabase());
    const { POST } = await import('../app/api/content/transcribe/route');
    const srt = '1\n00:00:00,000 --> 00:00:01,000\nHello world\n';
    const req = new Request('https://dreamengin.app/api/content/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtitleContent: srt, format: 'srt' }),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.rawContent).toContain('Hello world');
    expect(json.source).toBe('srt');
  });

  it('returns graceful stub when audioBase64 is provided without ML backend', async () => {
    createServerClient.mockResolvedValue(makeAuthedSupabase());
    const { POST } = await import('../app/api/content/transcribe/route');
    const req = new Request('https://dreamengin.app/api/content/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64: 'dGVzdA==' }),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.source).toBe('audio');
    expect(typeof json.message).toBe('string');
  });

  it('returns 400 when neither subtitleContent nor audioBase64 is provided', async () => {
    createServerClient.mockResolvedValue(makeAuthedSupabase());
    const { POST } = await import('../app/api/content/transcribe/route');
    const req = new Request('https://dreamengin.app/api/content/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Generative Fill API route
// ─────────────────────────────────────────────────────────────────────────────
describe('/api/content/generative-fill', () => {
  it('rejects unauthenticated requests with 401', async () => {
    createServerClient.mockResolvedValue(makeUnauthSupabase());
    const { POST } = await import('../app/api/content/generative-fill/route');
    const req = new Request('https://dreamengin.app/api/content/generative-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'abc123', prompt: 'sunset sky' }),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(401);
  });

  it('returns mock result when no provider is configured', async () => {
    const oldReplicate = process.env.REPLICATE_API_TOKEN;
    const oldStability = process.env.STABILITY_API_KEY;
    delete process.env.REPLICATE_API_TOKEN;
    delete process.env.STABILITY_API_KEY;

    createServerClient.mockResolvedValue(makeAuthedSupabase());
    const { POST } = await import('../app/api/content/generative-fill/route');
    const req = new Request('https://dreamengin.app/api/content/generative-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'abc123def456', prompt: 'replace sky with sunset' }),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.provider).toBe('mock');
    expect(json.resultBase64).toBe('abc123def456');
    expect(json.message).toContain('REPLICATE_API_TOKEN');

    if (oldReplicate) process.env.REPLICATE_API_TOKEN = oldReplicate;
    if (oldStability) process.env.STABILITY_API_KEY = oldStability;
  });

  it('returns 400 for missing prompt', async () => {
    createServerClient.mockResolvedValue(makeAuthedSupabase());
    const { POST } = await import('../app/api/content/generative-fill/route');
    const req = new Request('https://dreamengin.app/api/content/generative-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'abc123def456' }),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Voice Clone API route
// ─────────────────────────────────────────────────────────────────────────────
describe('/api/content/voice-clone', () => {
  it('rejects unauthenticated clone requests with 401', async () => {
    createServerClient.mockResolvedValue(makeUnauthSupabase());
    const { POST } = await import('../app/api/content/voice-clone/route');
    const req = new Request('https://dreamengin.app/api/content/voice-clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clone', sampleBase64: 'abc', voiceName: 'Test Voice' }),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(401);
  });

  it('creates a mock voice profile when no ElevenLabs key is configured', async () => {
    const oldKey = process.env.ELEVENLABS_API_KEY;
    delete process.env.ELEVENLABS_API_KEY;

    const single = vi.fn().mockResolvedValue({ data: null, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    createServerClient.mockResolvedValue(makeAuthedSupabase(() => ({ insert })));

    const { POST } = await import('../app/api/content/voice-clone/route');
    const req = new Request('https://dreamengin.app/api/content/voice-clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clone', sampleBase64: 'dGVzdGF1ZGlvZGF0YQ==', voiceName: 'My Voice' }),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.profile.name).toBe('My Voice');
    expect(json.profile.id).toMatch(/^voice_/);
    expect(json.message).toContain('ELEVENLABS_API_KEY');

    if (oldKey) process.env.ELEVENLABS_API_KEY = oldKey;
  });

  it('returns TTS stub response with estimated duration', async () => {
    const oldKey = process.env.ELEVENLABS_API_KEY;
    delete process.env.ELEVENLABS_API_KEY;

    createServerClient.mockResolvedValue(makeAuthedSupabase());
    const { POST } = await import('../app/api/content/voice-clone/route');
    const req = new Request('https://dreamengin.app/api/content/voice-clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'tts', text: 'Hello world this is a test', voiceId: 'voice_123' }),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(typeof json.durationSeconds).toBe('number');
    expect(json.durationSeconds).toBeGreaterThan(0);
    expect(json.voiceId).toBe('voice_123');

    if (oldKey) process.env.ELEVENLABS_API_KEY = oldKey;
  });

  it('returns 400 for missing voiceName in clone action', async () => {
    createServerClient.mockResolvedValue(makeAuthedSupabase());
    const { POST } = await import('../app/api/content/voice-clone/route');
    const req = new Request('https://dreamengin.app/api/content/voice-clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clone', sampleBase64: 'abc' }),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(400);
  });
});
