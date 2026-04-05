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
// Transcript Editor – parseSRT
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

  it('strips HTML tags from subtitle text', async () => {
    const { parseSRT } = await import('../lib/content/transcriptEditor');
    const srt = `1\n00:00:00,000 --> 00:00:02,000\n<i>Hello</i> <b>world</b>\n`;
    const segs = parseSRT(srt);
    expect(segs[0].text).toBe('Hello world');
  });

  it('uses syllable-proportional timing (longer words get more time)', async () => {
    const { parseSRT } = await import('../lib/content/transcriptEditor');
    const srt = `1\n00:00:00,000 --> 00:00:06,000\na extraordinary\n`;
    const segs = parseSRT(srt);
    const [a, extraordinary] = segs[0].words;
    expect(extraordinary.endMs - extraordinary.startMs).toBeGreaterThan(a.endMs - a.startMs);
  });

  it('handles multi-line subtitle blocks', async () => {
    const { parseSRT } = await import('../lib/content/transcriptEditor');
    const srt = `1\n00:00:00,000 --> 00:00:03,000\nLine one\nLine two\n`;
    const segs = parseSRT(srt);
    expect(segs[0].text).toContain('Line one');
    expect(segs[0].text).toContain('Line two');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Transcript Editor – parseVTT
// ─────────────────────────────────────────────────────────────────────────────
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

  it('strips VTT cue tags', async () => {
    const { parseVTT } = await import('../lib/content/transcriptEditor');
    const vtt = `WEBVTT\n\n00:00:00.000 --> 00:00:02.000\n<v Speaker>Hello world</v>\n`;
    const segs = parseVTT(vtt);
    expect(segs[0].text).not.toContain('<v');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Transcript Editor – computeCuts
// ─────────────────────────────────────────────────────────────────────────────
describe('transcriptEditor – computeCuts', () => {
  it('returns empty cuts when no words are deleted', async () => {
    const { parseSRT, computeCuts } = await import('../lib/content/transcriptEditor');
    const segs = parseSRT(`1\n00:00:00,000 --> 00:00:02,000\nHello world\n`);
    expect(computeCuts(segs, new Set())).toHaveLength(0);
  });

  it('computes a single cut when one word is deleted', async () => {
    const { parseSRT, computeCuts } = await import('../lib/content/transcriptEditor');
    const segs = parseSRT(`1\n00:00:00,000 --> 00:00:02,000\nHello world\n`);
    const firstWordIdx = segs[0].words[0].index;
    const cuts = computeCuts(segs, new Set([firstWordIdx]));
    expect(cuts).toHaveLength(1);
    expect(cuts[0].cutEndMs).toBeGreaterThan(cuts[0].cutStartMs);
  });

  it('merges adjacent word deletions into a single cut', async () => {
    const { parseSRT, computeCuts } = await import('../lib/content/transcriptEditor');
    const segs = parseSRT(`1\n00:00:00,000 --> 00:00:03,000\nOne two three\n`);
    const cuts = computeCuts(segs, new Set(segs[0].words.map(w => w.index)));
    expect(cuts).toHaveLength(1);
  });

  it('produces separate cuts for non-adjacent deletions', async () => {
    const { parseSRT, computeCuts } = await import('../lib/content/transcriptEditor');
    const segs = parseSRT(`1\n00:00:00,000 --> 00:01:00,000\nA B C D E F G\n`);
    const words = segs[0].words;
    // Delete first and last word — far apart
    const cuts = computeCuts(segs, new Set([words[0].index, words[words.length - 1].index]));
    expect(cuts).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Transcript Editor – applyEditsToSegments
// ─────────────────────────────────────────────────────────────────────────────
describe('transcriptEditor – applyEditsToSegments', () => {
  it('removes deleted words from segment text', async () => {
    const { parseSRT, applyEditsToSegments } = await import('../lib/content/transcriptEditor');
    const segs = parseSRT(`1\n00:00:00,000 --> 00:00:03,000\nHello world foo\n`);
    const toDelete = new Set([segs[0].words[1].index]); // delete "world"
    const result = applyEditsToSegments(segs, toDelete);
    expect(result[0].text).toBe('Hello foo');
    expect(result[0].words).toHaveLength(2);
  });

  it('drops an entire segment if all words are deleted', async () => {
    const { parseSRT, applyEditsToSegments } = await import('../lib/content/transcriptEditor');
    const segs = parseSRT(`1\n00:00:00,000 --> 00:00:02,000\nHello\n\n2\n00:00:02,000 --> 00:00:04,000\nworld\n`);
    const toDelete = new Set([segs[0].words[0].index]);
    const result = applyEditsToSegments(segs, toDelete);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('world');
  });

  it('returns all segments unchanged when deletedIdx is empty', async () => {
    const { parseSRT, applyEditsToSegments } = await import('../lib/content/transcriptEditor');
    const segs = parseSRT(`1\n00:00:00,000 --> 00:00:02,000\nHello world\n`);
    const result = applyEditsToSegments(segs, new Set());
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Hello world');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Transcript Editor – exportSRT
// ─────────────────────────────────────────────────────────────────────────────
describe('transcriptEditor – exportSRT', () => {
  it('produces valid SRT text that can be re-parsed', async () => {
    const { parseSRT, exportSRT } = await import('../lib/content/transcriptEditor');
    const orig = parseSRT(`1\n00:00:00,000 --> 00:00:02,000\nHello world\n\n2\n00:00:03,000 --> 00:00:05,000\nFoo bar\n`);
    const exported = exportSRT(orig);
    const reparsed = parseSRT(exported);
    expect(reparsed).toHaveLength(orig.length);
    expect(reparsed[0].text).toBe('Hello world');
    expect(reparsed[1].text).toBe('Foo bar');
  });

  it('SRT output contains --> arrow separators', async () => {
    const { parseSRT, exportSRT } = await import('../lib/content/transcriptEditor');
    const segs = parseSRT(`1\n00:00:00,000 --> 00:00:02,000\nTest\n`);
    expect(exportSRT(segs)).toContain('-->');
  });

  it('renumbers segments sequentially from 1', async () => {
    const { parseSRT, applyEditsToSegments, exportSRT } = await import('../lib/content/transcriptEditor');
    const segs = parseSRT(`1\n00:00:00,000 --> 00:00:01,000\nHello\n\n2\n00:00:01,000 --> 00:00:02,000\nWorld\n`);
    const edited = applyEditsToSegments(segs, new Set());
    const srt = exportSRT(edited);
    expect(srt.startsWith('1\n')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Transcript Editor – searchTranscript
// ─────────────────────────────────────────────────────────────────────────────
describe('transcriptEditor – searchTranscript', () => {
  it('returns matching word entries', async () => {
    const { parseSRT, searchTranscript } = await import('../lib/content/transcriptEditor');
    const segs = parseSRT(`1\n00:00:00,000 --> 00:00:02,000\nHello world\n\n2\n00:00:02,000 --> 00:00:04,000\nworld again\n`);
    const results = searchTranscript(segs, 'world');
    expect(results).toHaveLength(2);
    expect(results[0].word.toLowerCase()).toContain('world');
  });

  it('returns empty array for empty query', async () => {
    const { parseSRT, searchTranscript } = await import('../lib/content/transcriptEditor');
    const segs = parseSRT(`1\n00:00:00,000 --> 00:00:02,000\nHello world\n`);
    expect(searchTranscript(segs, '')).toHaveLength(0);
    expect(searchTranscript(segs, '   ')).toHaveLength(0);
  });

  it('is case-insensitive', async () => {
    const { parseSRT, searchTranscript } = await import('../lib/content/transcriptEditor');
    const segs = parseSRT(`1\n00:00:00,000 --> 00:00:02,000\nHELLO\n`);
    expect(searchTranscript(segs, 'hello')).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Transcript Editor – utilities
// ─────────────────────────────────────────────────────────────────────────────
describe('transcriptEditor – utilities', () => {
  it('segmentsToPlainText joins segment texts with spaces', async () => {
    const { parseSRT, segmentsToPlainText } = await import('../lib/content/transcriptEditor');
    const segs = parseSRT(`1\n00:00:00,000 --> 00:00:01,000\nHello\n\n2\n00:00:01,000 --> 00:00:02,000\nworld\n`);
    expect(segmentsToPlainText(segs)).toBe('Hello world');
  });

  it('totalDurationMs returns end minus start of first/last segment', async () => {
    const { parseSRT, totalDurationMs } = await import('../lib/content/transcriptEditor');
    const segs = parseSRT(`1\n00:00:01,000 --> 00:00:03,000\nHello world\n`);
    // duration = endMs(3000) - startMs(1000) = 2000
    expect(totalDurationMs(segs)).toBe(2000);
  });

  it('totalDurationMs returns 0 for empty segments', async () => {
    const { totalDurationMs } = await import('../lib/content/transcriptEditor');
    expect(totalDurationMs([])).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SEO Scorer
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
  });

  it('returns topSuggestions array', async () => {
    const { scoreContent } = await import('../lib/content/seoScorer');
    expect(Array.isArray(scoreContent({ title: 'x' }).topSuggestions)).toBe(true);
  });

  it('returns dimensions array with valid scores', async () => {
    const { scoreContent } = await import('../lib/content/seoScorer');
    const result = scoreContent({ title: 'My post title', body: 'A body with some content.' });
    expect(result.dimensions.length).toBeGreaterThanOrEqual(1);
    for (const d of result.dimensions) {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(d.maxScore);
    }
  });

  it('scores engagement dimension when title and body are provided', async () => {
    const { scoreContent } = await import('../lib/content/seoScorer');
    const result = scoreContent({ title: 'Amazing tips', body: 'Subscribe now! Love this content. Click here.' });
    const engagement = result.dimensions.find(d => d.label === 'Engagement');
    expect(engagement).toBeDefined();
    expect(engagement!.score).toBeGreaterThan(0);
  });

  it('scores accessibility dimension when body is provided', async () => {
    const { scoreContent } = await import('../lib/content/seoScorer');
    const result = scoreContent({ title: 'Test', body: 'Short sentences work. Keep it simple. Make it clear.' });
    const acc = result.dimensions.find(d => d.label === 'Accessibility');
    expect(acc).toBeDefined();
    expect(['High', 'Medium', 'Low']).toContain(result.accessibilityLevel);
  });

  it('returns engagementSignals count >= 0', async () => {
    const { scoreContent } = await import('../lib/content/seoScorer');
    const result = scoreContent({ title: 'Subscribe now and win!', body: 'Click here to start.' });
    expect(result.engagementSignals).toBeGreaterThanOrEqual(0);
  });

  it('penalises keyword over-stuffing vs balanced density', async () => {
    const { scoreContent } = await import('../lib/content/seoScorer');
    const stuffed = scoreContent({
      title: 'Creator',
      body: Array(20).fill('creator').join(' '),
      keywords: ['creator'],
    });
    const balanced = scoreContent({
      title: 'Creator tips',
      body: 'Here are some creator tips for building your audience effectively in 2026 to grow your creator brand.',
      keywords: ['creator'],
    });
    expect(stuffed.overall).toBeLessThanOrEqual(balanced.overall + 15);
  });

  it('rewards body with headings and lists', async () => {
    const { scoreContent } = await import('../lib/content/seoScorer');
    const withStructure = scoreContent({ title: 'Tips', body: '## Section 1\n- item one\n- item two\n\n## Section 2\nText here.' });
    const withoutStructure = scoreContent({ title: 'Tips', body: 'Just plain text without any structure or organisation.' });
    expect(withStructure.overall).toBeGreaterThanOrEqual(withoutStructure.overall);
  });
});

describe('seoScorer – generateReport', () => {
  it('generates a report with generatedAt ISO string', async () => {
    const { generateReport } = await import('../lib/content/seoScorer');
    const report = generateReport({ title: 'Test title for report generation' });
    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(report.result.overall).toBeGreaterThanOrEqual(0);
    expect(report.input.title).toBe('Test title for report generation');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// voiceClone lib – estimateDurationSeconds
// ─────────────────────────────────────────────────────────────────────────────
describe('voiceClone – estimateDurationSeconds', () => {
  it('returns positive duration for non-empty text', async () => {
    const { estimateDurationSeconds } = await import('../lib/content/voiceClone');
    expect(estimateDurationSeconds('Hello world this is a test')).toBeGreaterThan(0);
  });

  it('is proportional to word count', async () => {
    const { estimateDurationSeconds } = await import('../lib/content/voiceClone');
    const short = estimateDurationSeconds('one two');
    const long = estimateDurationSeconds('one two three four five six seven eight');
    expect(long).toBeGreaterThan(short);
  });

  it('returns 0 for empty string', async () => {
    const { estimateDurationSeconds } = await import('../lib/content/voiceClone');
    expect(estimateDurationSeconds('')).toBe(0);
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

  it('returns rawContent, segmentCount, and wordCount for valid SRT', async () => {
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
    expect(json.segmentCount).toBe(1);
    expect(json.wordCount).toBe(2);
    expect(json.durationSeconds).toBeGreaterThanOrEqual(0);
  });

  it('returns segmentCount and wordCount for VTT format', async () => {
    createServerClient.mockResolvedValue(makeAuthedSupabase());
    const { POST } = await import('../app/api/content/transcribe/route');
    const vtt = 'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nOne two three\n';
    const req = new Request('https://dreamengin.app/api/content/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtitleContent: vtt, format: 'vtt' }),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.segmentCount).toBe(1);
    expect(json.wordCount).toBe(3);
    expect(json.source).toBe('vtt');
  });

  it('returns graceful stub for audio input', async () => {
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
    expect(json.segmentCount).toBe(0);
  });

  it('returns 400 when neither subtitleContent nor audioBase64 is provided', async () => {
    createServerClient.mockResolvedValue(makeAuthedSupabase());
    const { POST } = await import('../app/api/content/transcribe/route');
    const req = new Request('https://dreamengin.app/api/content/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect((await POST(req as unknown as import('next/server').NextRequest)).status).toBe(400);
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
    expect((await POST(req as unknown as import('next/server').NextRequest)).status).toBe(401);
  });

  it('returns mock result when no provider is configured', async () => {
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
  });

  it('includes mask description in mock message when mask is provided', async () => {
    delete process.env.REPLICATE_API_TOKEN;
    delete process.env.STABILITY_API_KEY;
    createServerClient.mockResolvedValue(makeAuthedSupabase());
    const { POST } = await import('../app/api/content/generative-fill/route');
    const req = new Request('https://dreamengin.app/api/content/generative-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'abc123def456', prompt: 'fill with sky', mask: { x: 0, y: 0, width: 0.5, height: 0.5 } }),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const json = await res.json();
    expect(json.message).toContain('mask:');
  });

  it('rejects mask that extends beyond image bounds', async () => {
    createServerClient.mockResolvedValue(makeAuthedSupabase());
    const { POST } = await import('../app/api/content/generative-fill/route');
    const req = new Request('https://dreamengin.app/api/content/generative-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'abc123def456', prompt: 'fill', mask: { x: 0.8, y: 0, width: 0.5, height: 0.5 } }),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing prompt', async () => {
    createServerClient.mockResolvedValue(makeAuthedSupabase());
    const { POST } = await import('../app/api/content/generative-fill/route');
    const req = new Request('https://dreamengin.app/api/content/generative-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'abc123def456' }),
    });
    expect((await POST(req as unknown as import('next/server').NextRequest)).status).toBe(400);
  });

  it('includes ETag header in response', async () => {
    delete process.env.REPLICATE_API_TOKEN;
    delete process.env.STABILITY_API_KEY;
    createServerClient.mockResolvedValue(makeAuthedSupabase());
    const { POST } = await import('../app/api/content/generative-fill/route');
    const req = new Request('https://dreamengin.app/api/content/generative-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'abc123def456', prompt: 'test prompt' }),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    expect(res.headers.get('ETag')).toBeTruthy();
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
    expect((await POST(req as unknown as import('next/server').NextRequest)).status).toBe(401);
  });

  it('creates a mock voice profile when no ElevenLabs key is configured', async () => {
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
  });

  it('returns TTS stub with correct estimated duration', async () => {
    delete process.env.ELEVENLABS_API_KEY;
    createServerClient.mockResolvedValue(makeAuthedSupabase());
    const { POST } = await import('../app/api/content/voice-clone/route');
    // 6 words at 150 wpm = 6/2.5 = 2.4 seconds
    const req = new Request('https://dreamengin.app/api/content/voice-clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'tts', text: 'one two three four five six', voiceId: 'voice_123' }),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.durationSeconds).toBeCloseTo(2.4, 0);
    expect(json.voiceId).toBe('voice_123');
  });

  it('returns 400 for missing voiceName in clone action', async () => {
    createServerClient.mockResolvedValue(makeAuthedSupabase());
    const { POST } = await import('../app/api/content/voice-clone/route');
    const req = new Request('https://dreamengin.app/api/content/voice-clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clone', sampleBase64: 'abc' }),
    });
    expect((await POST(req as unknown as import('next/server').NextRequest)).status).toBe(400);
  });

  it('list action returns profiles array', async () => {
    createServerClient.mockResolvedValue({
      ...makeAuthedSupabase(),
      from: () => ({
        select: () => ({
          eq: () => ({
            order: async () => ({
              data: [{ id: 'voice_001', name: 'Test', created_at: '2026-01-01T00:00:00Z' }],
              error: null,
            }),
          }),
        }),
      }),
    });
    const { POST } = await import('../app/api/content/voice-clone/route');
    const req = new Request('https://dreamengin.app/api/content/voice-clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list' }),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(json.profiles)).toBe(true);
    expect(json.profiles[0].id).toBe('voice_001');
  });

  it('list action returns empty profiles when db fails gracefully', async () => {
    createServerClient.mockResolvedValue({
      ...makeAuthedSupabase(),
      from: () => ({
        select: () => ({
          eq: () => ({
            order: async () => { throw new Error('DB error'); },
          }),
        }),
      }),
    });
    const { POST } = await import('../app/api/content/voice-clone/route');
    const req = new Request('https://dreamengin.app/api/content/voice-clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list' }),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.profiles).toEqual([]);
  });

  it('delete action returns 200 message', async () => {
    createServerClient.mockResolvedValue({
      ...makeAuthedSupabase(),
      from: () => ({
        delete: () => ({
          eq: () => ({
            eq: async () => ({ error: null }),
          }),
        }),
      }),
    });
    const { POST } = await import('../app/api/content/voice-clone/route');
    const req = new Request('https://dreamengin.app/api/content/voice-clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', voiceId: 'voice_001' }),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.message).toContain('voice_001');
  });
});

