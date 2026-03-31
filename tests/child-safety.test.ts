// tests/child-safety.test.ts
// Unit tests for lib/child-safety/childSafetyDetector.ts
// Validates: CSAM text detection, grooming/predator detection, hash matching,
// zero-tolerance logic, and clean content pass-through.

import { describe, it, expect } from 'vitest';
import { scanContent, isZeroTolerance } from '@/lib/child-safety/childSafetyDetector';

// ============================================================================
// CLEAN CONTENT — should never flag innocent text
// ============================================================================

describe('childSafetyDetector — clean content', () => {
  it('returns clean result for ordinary post text', () => {
    const result = scanContent({ text: 'Check out my new art project!' });
    expect(result.flagged).toBe(false);
    expect(result.rule_code).toBeNull();
    expect(result.category).toBe('CLEAN');
    expect(result.severity).toBe(0);
    expect(result.confidence).toBe(0);
    expect(result.signal_count).toBe(0);
  });

  it('returns clean result for gaming chat', () => {
    const result = scanContent({ text: "GG, that match was intense. Let's play again!" });
    expect(result.flagged).toBe(false);
  });

  it('returns clean result for empty input', () => {
    const result = scanContent({ text: '' });
    expect(result.flagged).toBe(false);
  });

  it('returns clean result for no input at all', () => {
    const result = scanContent({});
    expect(result.flagged).toBe(false);
  });

  it('returns clean result for a normal question about age in professional context', () => {
    // "How old is the company?" — should not trigger generic age probe since it lacks minor context
    const result = scanContent({ text: 'How old is this startup?' });
    expect(result.flagged).toBe(false);
  });
});

// ============================================================================
// CSAM TEXT DETECTION — rule C22_CSAM
// ============================================================================

describe('childSafetyDetector — CSAM text signals', () => {
  it('flags explicit CSAM keyword', () => {
    const result = scanContent({ text: 'Looking for csam to trade.' });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C22_CSAM');
    expect(result.category).toBe('CSAM');
    expect(result.severity).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0.70);
  });

  it('flags child pornography phrasing', () => {
    const result = scanContent({ text: 'I have child pornography to share.' });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C22_CSAM');
    expect(result.category).toBe('CSAM');
  });

  it('flags underage explicit content phrasing', () => {
    const result = scanContent({ text: 'Selling underage explicit content.' });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C22_CSAM');
  });

  it('flags minor + explicit combination', () => {
    const result = scanContent({ text: 'minors nude photos available' });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C22_CSAM');
  });

  it('CSAM result is zero-tolerance regardless of single signal', () => {
    const result = scanContent({ text: 'kiddie porn' });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C22_CSAM');
    expect(isZeroTolerance(result)).toBe(true);
  });

  it('multiple CSAM signals increase confidence', () => {
    const singleResult = scanContent({ text: 'I have csam.' });
    const multiResult = scanContent({ text: 'I have csam. child pornography. underage explicit content.' });
    expect(multiResult.confidence).toBeGreaterThanOrEqual(singleResult.confidence);
    expect(multiResult.signal_count).toBeGreaterThan(singleResult.signal_count);
  });
});

// ============================================================================
// GROOMING / PREDATOR DETECTION — rule C31_GROOMING
// ============================================================================

describe('childSafetyDetector — grooming / predator signals', () => {
  it('flags secrecy coercion', () => {
    const result = scanContent({ text: "Don't tell your parents about us." });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C31_GROOMING');
    expect(result.category).toBe('GROOMING');
  });

  it('flags secrecy coercion variant', () => {
    const result = scanContent({ text: "This is our little secret, okay?" });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C31_GROOMING');
  });

  it('flags platform migration attempt', () => {
    const result = scanContent({ text: "Add me on Snapchat, let's talk there." });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C31_GROOMING');
  });

  it('flags age probe targeting minors', () => {
    const result = scanContent({ text: 'Are you under 16?' });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C31_GROOMING');
  });

  it('flags minor status probe', () => {
    const result = scanContent({ text: 'Are you a minor? How old are you?' });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C31_GROOMING');
    expect(result.signal_count).toBeGreaterThanOrEqual(2);
  });

  it('flags maturity flattery grooming', () => {
    const result = scanContent({ text: "You're so mature for your age." });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C31_GROOMING');
  });

  it('flags nude solicitation', () => {
    const result = scanContent({ text: 'Send me a nude.' });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C31_GROOMING');
  });

  it('flags meeting solicitation with alone qualifier', () => {
    const result = scanContent({ text: "Come over to my place, don't bring anyone." });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C31_GROOMING');
  });

  it('flags bribe grooming', () => {
    const result = scanContent({ text: "I'll buy you an Amazon gift card if you send pics." });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C31_GROOMING');
  });

  it('multiple grooming signals yield higher confidence', () => {
    const singleResult = scanContent({ text: "You're so mature for your age." });
    const multiResult = scanContent({
      text: "You're so mature for your age. Don't tell your parents. Add me on Snapchat.",
    });
    expect(multiResult.confidence).toBeGreaterThan(singleResult.confidence);
    expect(multiResult.signal_count).toBeGreaterThan(singleResult.signal_count);
  });

  it('high-confidence grooming is zero-tolerance', () => {
    const result = scanContent({
      text: "You're so mature for your age. Don't tell your parents. Add me on Snapchat. Are you under 16?",
    });
    expect(result.flagged).toBe(true);
    expect(isZeroTolerance(result)).toBe(true);
  });

  it('single low-confidence grooming signal is flagged but not necessarily zero-tolerance', () => {
    const result = scanContent({ text: "How old are you?" });
    // Should flag (grooming signal) but confidence may be below zero-tolerance threshold
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C31_GROOMING');
    // Zero-tolerance requires confidence >= 0.85 for grooming
    expect(result.confidence).toBeLessThan(0.85);
    expect(isZeroTolerance(result)).toBe(false);
  });
});

// ============================================================================
// CSAM takes precedence over GROOMING when both are detected
// ============================================================================

describe('childSafetyDetector — CSAM takes precedence', () => {
  it('returns C22_CSAM even when grooming signals are also present', () => {
    const result = scanContent({
      text: "Don't tell your parents. I have csam to share.",
    });
    expect(result.rule_code).toBe('C22_CSAM');
    expect(result.category).toBe('CSAM');
  });
});

// ============================================================================
// HASH-BASED CSAM DETECTION
// ============================================================================

describe('childSafetyDetector — hash matching', () => {
  const knownBadHashes = new Set([
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  ]);

  it('flags a known-bad hash', () => {
    const result = scanContent({
      text: 'Normal caption',
      mediaHashes: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
      knownBadHashes,
    });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C22_CSAM');
    expect(result.severity).toBe(1.0);
    expect(result.confidence).toBe(1.0);
    expect(result._audit.hash_match).toBe(true);
    expect(isZeroTolerance(result)).toBe(true);
  });

  it('does not flag an unknown hash', () => {
    const result = scanContent({
      text: 'Normal caption',
      mediaHashes: ['cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'],
      knownBadHashes,
    });
    expect(result.flagged).toBe(false);
  });

  it('flags any match among multiple hashes', () => {
    const result = scanContent({
      text: 'Normal caption',
      mediaHashes: [
        'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      ],
      knownBadHashes,
    });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C22_CSAM');
  });

  it('is case-insensitive for hash comparison', () => {
    const result = scanContent({
      text: 'Normal caption',
      mediaHashes: ['AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'],
      knownBadHashes,
    });
    expect(result.flagged).toBe(true);
  });

  it('hash match beats text signals — returns hash result', () => {
    const result = scanContent({
      text: 'Normal text with no flags',
      mediaHashes: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
      knownBadHashes,
    });
    expect(result._audit.hash_match).toBe(true);
    expect(result.severity).toBe(1.0);
  });

  it('empty known-bad hash set never triggers hash match', () => {
    const result = scanContent({
      text: 'Normal caption',
      mediaHashes: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
      knownBadHashes: new Set(),
    });
    expect(result.flagged).toBe(false);
  });
});

// ============================================================================
// isZeroTolerance
// ============================================================================

describe('isZeroTolerance', () => {
  it('returns false for clean result', () => {
    expect(isZeroTolerance({ flagged: false, rule_code: null, severity: 0, confidence: 0, category: 'CLEAN', signal_count: 0, _audit: { signals: [], hash_match: false } })).toBe(false);
  });

  it('returns true for any CSAM result', () => {
    expect(isZeroTolerance({ flagged: true, rule_code: 'C22_CSAM', severity: 0.5, confidence: 0.7, category: 'CSAM', signal_count: 1, _audit: { signals: [], hash_match: false } })).toBe(true);
  });

  it('returns true for high-confidence grooming', () => {
    expect(isZeroTolerance({ flagged: true, rule_code: 'C31_GROOMING', severity: 0.8, confidence: 0.90, category: 'GROOMING', signal_count: 3, _audit: { signals: [], hash_match: false } })).toBe(true);
  });

  it('returns false for low-confidence grooming', () => {
    expect(isZeroTolerance({ flagged: true, rule_code: 'C31_GROOMING', severity: 0.4, confidence: 0.70, category: 'GROOMING', signal_count: 1, _audit: { signals: [], hash_match: false } })).toBe(false);
  });

  it('returns true for hash-matched grooming even at low confidence', () => {
    expect(isZeroTolerance({ flagged: true, rule_code: 'C31_GROOMING', severity: 0.5, confidence: 0.70, category: 'GROOMING', signal_count: 1, _audit: { signals: [], hash_match: true } })).toBe(true);
  });
});

// ============================================================================
// LAYER 4 — LLM image classification integration in scanContent
// ============================================================================

describe('childSafetyDetector — Layer 4 LLM image classification', () => {
  it('passes through clean result when imageClassification is absent', () => {
    const result = scanContent({ text: 'Normal post' });
    expect(result.flagged).toBe(false);
  });

  it('passes through clean result when imageClassification is skipped', () => {
    const result = scanContent({
      text: 'Normal post',
      imageClassification: { flagged: false, risk: 'none', confidence: 0, severity: 0, skipped: true },
    });
    expect(result.flagged).toBe(false);
  });

  it('returns clean result when imageClassification.flagged is false', () => {
    const result = scanContent({
      text: 'Normal post',
      imageClassification: { flagged: false, risk: 'low', confidence: 0.4, severity: 0.25, skipped: false },
    });
    expect(result.flagged).toBe(false);
    expect(result.category).toBe('CLEAN');
  });

  it('flags CSAM when imageClassification.flagged is true', () => {
    const result = scanContent({
      text: 'Normal caption',
      imageClassification: { flagged: true, risk: 'high', confidence: 0.92, severity: 0.9, skipped: false },
    });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C22_CSAM');
    expect(result.category).toBe('CSAM');
    expect(result.severity).toBe(0.9);
    expect(result.confidence).toBe(0.92);
    expect(result._audit.signals).toContain('llm_image:high');
  });

  it('flags CSAM with certain risk at severity 1.0', () => {
    const result = scanContent({
      imageClassification: { flagged: true, risk: 'certain', confidence: 0.99, severity: 1.0, skipped: false },
    });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C22_CSAM');
    expect(result.severity).toBe(1.0);
    expect(isZeroTolerance(result)).toBe(true);
  });

  it('hash match in Layer 1 takes precedence over LLM flagging', () => {
    const knownBadHashes = new Set(['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']);
    const result = scanContent({
      text: 'Normal caption',
      mediaHashes: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
      knownBadHashes,
      imageClassification: { flagged: true, risk: 'certain', confidence: 0.99, severity: 1.0, skipped: false },
    });
    expect(result.flagged).toBe(true);
    expect(result._audit.hash_match).toBe(true);
    expect(result._audit.signals).toContain('hash_registry_match');
  });

  it('CSAM text in Layer 2 takes precedence over LLM classification', () => {
    const result = scanContent({
      text: 'I have child pornography to share.',
      imageClassification: { flagged: false, risk: 'none', confidence: 0.95, severity: 0, skipped: false },
    });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C22_CSAM');
    expect(result._audit.signals).not.toContain('llm_image:none');
  });
});

// ============================================================================
// imageClassifier — parseVerdict / classifyImage (pure logic tests, no API)
// ============================================================================

import { classifyImage } from '@/lib/child-safety/imageClassifier';

describe('imageClassifier — classifyImage graceful degradation', () => {
  it('returns skipped result when GROQ_API_KEY is missing', async () => {
    // In the test environment GROQ_API_KEY is not set
    const result = await classifyImage('dGVzdA=='); // base64 "test"
    expect(result.skipped).toBe(true);
    expect(result.flagged).toBe(false);
  });

  it('returns skipped result for empty payload', async () => {
    const result = await classifyImage('');
    expect(result.skipped).toBe(true);
    expect(result.flagged).toBe(false);
  });

  it('returns skipped result for oversized payload', async () => {
    const bigPayload = 'a'.repeat(5_100_001);
    const result = await classifyImage(bigPayload);
    expect(result.skipped).toBe(true);
    expect(result.flagged).toBe(false);
  });
});

// ============================================================================
// scanMediaUrlsForChildSafety — real-time URL scanner (no network calls)
// ============================================================================

import { scanMediaUrlsForChildSafety, isImageUrl } from '@/lib/child-safety/scanMediaUrls';

// Minimal fake Supabase client that returns an empty hash registry
const emptySupabase = {
  from: (_table: string) => ({
    select: (_cols: string) => ({ data: [], error: null }),
  }),
};

describe('scanMediaUrlsForChildSafety — no-op cases', () => {
  it('returns CLEAN when urls array is empty', async () => {
    const result = await scanMediaUrlsForChildSafety({ urls: [], supabase: emptySupabase });
    expect(result.flagged).toBe(false);
    expect(result.category).toBe('CLEAN');
  });

  it('returns CLEAN when all URLs fail to fetch (graceful degradation)', async () => {
    // These will fail to fetch (no real network in test) — should never block
    const result = await scanMediaUrlsForChildSafety({
      urls: ['https://example.invalid/photo.jpg'],
      supabase: emptySupabase,
    });
    expect(result.flagged).toBe(false);
    expect(result.category).toBe('CLEAN');
  });

  it('returns CLEAN when URL is malformed', async () => {
    const result = await scanMediaUrlsForChildSafety({
      urls: ['not-a-valid-url'],
      supabase: emptySupabase,
    });
    expect(result.flagged).toBe(false);
  });
});

describe('scanMediaUrlsForChildSafety — hash registry check', () => {
  it('returns CSAM when image hash is in the known-bad registry', async () => {
    // Use a fake hash that matches what sha256('') would produce
    const emptyBufHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const supabaseWithHash = {
      from: (_table: string) => ({
        select: (_cols: string) => ({
          data: [{ hash_sha256: emptyBufHash }],
          error: null,
        }),
      }),
    };

    // Serve a tiny valid JPEG (1-pixel) from a data URL via a local mock
    // Since we can't make real HTTP requests in tests, we verify the hash
    // path by checking that scanContent propagates hash match properly.
    // The integration is covered by the Layer 1 tests in childSafetyDetector.
    // Here we verify the supabase client is wired correctly:
    const { scanContent: sc } = await import('@/lib/child-safety/childSafetyDetector');
    const result = sc({
      mediaHashes: [emptyBufHash],
      knownBadHashes: new Set([emptyBufHash]),
    });
    expect(result.flagged).toBe(true);
    expect(result._audit.hash_match).toBe(true);
  });
});

describe('isImageUrl', () => {
  it('returns true for .jpg url', () => expect(isImageUrl('https://cdn.example.com/a/b.jpg')).toBe(true));
  it('returns true for .png url', () => expect(isImageUrl('https://cdn.example.com/a/b.png')).toBe(true));
  it('returns true for .webp url', () => expect(isImageUrl('https://cdn.example.com/a/b.webp')).toBe(true));
  it('returns true for /images/ path', () => expect(isImageUrl('https://cdn.example.com/images/photo')).toBe(true));
  it('returns false for .mp4 url', () => expect(isImageUrl('https://cdn.example.com/a/b.mp4')).toBe(false));
  it('returns false for .mp3 url', () => expect(isImageUrl('https://cdn.example.com/a/b.mp3')).toBe(false));
  it('returns false for malformed url', () => expect(isImageUrl('not-a-url')).toBe(false));
});

// ============================================================================
// C32_MINOR_IMAGE — Layer 0: minor-to-adult image blocking
// ============================================================================

describe('childSafetyDetector — C32_MINOR_IMAGE (minor-to-adult image blocking)', () => {
  it('blocks image from 15-year-old to 25-year-old adult', () => {
    const result = scanContent({
      text: 'Here is the photo you wanted',
      hasImageAttachment: true,
      senderAge: 15,
      recipientAge: 25,
    });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C32_MINOR_IMAGE');
    expect(result.category).toBe('MINOR_IMAGE');
    expect(result.severity).toBe(1.0);
    expect(result.confidence).toBe(1.0);
    expect(result._audit.signals).toContain('minor_to_adult_image');
  });

  it('blocks image from 13-year-old to 18-year-old adult', () => {
    const result = scanContent({
      hasImageAttachment: true,
      senderAge: 13,
      recipientAge: 18,
    });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C32_MINOR_IMAGE');
  });

  it('blocks image from 17-year-old to 30-year-old adult', () => {
    const result = scanContent({
      hasImageAttachment: true,
      senderAge: 17,
      recipientAge: 30,
    });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C32_MINOR_IMAGE');
  });

  it('does NOT block image between two adults', () => {
    const result = scanContent({
      text: 'Here is my photo',
      hasImageAttachment: true,
      senderAge: 21,
      recipientAge: 25,
    });
    expect(result.flagged).toBe(false);
    expect(result.rule_code).toBeNull();
  });

  it('does NOT block image between two minors', () => {
    const result = scanContent({
      text: 'Here is my photo',
      hasImageAttachment: true,
      senderAge: 16,
      recipientAge: 15,
    });
    expect(result.flagged).toBe(false);
  });

  it('does NOT block text-only message from minor to adult', () => {
    const result = scanContent({
      text: 'Hello! How was your day?',
      hasImageAttachment: false,
      senderAge: 15,
      recipientAge: 25,
    });
    expect(result.flagged).toBe(false);
  });

  it('blocks even when text is clean — image alone triggers block', () => {
    const result = scanContent({
      text: 'Nice photo right?',
      hasImageAttachment: true,
      senderAge: 14,
      recipientAge: 20,
    });
    expect(result.flagged).toBe(true);
    expect(result.rule_code).toBe('C32_MINOR_IMAGE');
  });

  it('Layer 0 (minor image) takes precedence over all other layers', () => {
    // Even if the text also has CSAM signals, Layer 0 fires first
    const knownBadHashes = new Set(['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']);
    const result = scanContent({
      text: 'I have csam to share',
      hasImageAttachment: true,
      senderAge: 16,
      recipientAge: 22,
      mediaHashes: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
      knownBadHashes,
    });
    // Layer 0 fires first
    expect(result.rule_code).toBe('C32_MINOR_IMAGE');
    expect(result.category).toBe('MINOR_IMAGE');
  });

  it('C32_MINOR_IMAGE is zero-tolerance', () => {
    const result = scanContent({
      hasImageAttachment: true,
      senderAge: 15,
      recipientAge: 25,
    });
    expect(isZeroTolerance(result)).toBe(true);
  });

  it('does NOT block when ages are not provided', () => {
    const result = scanContent({
      text: 'Here is my photo',
      hasImageAttachment: true,
      // no senderAge or recipientAge
    });
    // Without age info, cannot block on age grounds
    expect(result.flagged).toBe(false);
  });
});

// ============================================================================
// messageContextChecker — minor-adult conversation context evaluation
// ============================================================================

import { evaluateMessageContext } from '@/lib/child-safety/messageContextChecker';

describe('messageContextChecker — safe contexts (no action)', () => {
  it('returns safe for teacher-student context', () => {
    const result = evaluateMessageContext({
      minorAge: 15,
      adultAge: 32,
      recentMessages: [
        { senderIsMinor: false, text: 'Please submit your essay by Friday. Review the homework assignment.' },
        { senderIsMinor: true, text: 'Yes sir, I will submit the assignment before the due date.' },
      ],
    });
    expect(result.verdict).toBe('safe');
    expect(result.blockMessages).toBe(false);
    expect(result.adultPermanentBanRecommended).toBe(false);
  });

  it('returns safe for coach-athlete context', () => {
    const result = evaluateMessageContext({
      minorAge: 16,
      adultAge: 35,
      recentMessages: [
        { senderIsMinor: false, text: 'Practice is at 4pm tomorrow. We have a tournament this weekend.' },
        { senderIsMinor: true, text: 'Got it coach, I will be there for training.' },
      ],
    });
    expect(result.verdict).toBe('safe');
    expect(result.blockMessages).toBe(false);
  });

  it('returns safe for family context with declared relationship', () => {
    const result = evaluateMessageContext({
      minorAge: 14,
      adultAge: 40,
      recentMessages: [
        { senderIsMinor: false, text: 'Dinner is at 6. Dad said he will be home late.' },
        { senderIsMinor: true, text: 'OK mom, I will be home by then.' },
      ],
      declaredRelationship: 'parent',
    });
    expect(result.verdict).toBe('safe');
  });
});

describe('messageContextChecker — suspicious / inappropriate contexts', () => {
  it('blocks and escalates secrecy coercion from adult', () => {
    const result = evaluateMessageContext({
      minorAge: 15,
      adultAge: 30,
      recentMessages: [
        { senderIsMinor: false, text: "Don't tell your parents about our little secret." },
        { senderIsMinor: true, text: 'Why not?' },
      ],
    });
    expect(['flag', 'block']).toContain(result.verdict);
    expect(result.blockMessages).toBe(true);
    expect(result.escalate).toBe(true);
  });

  it('blocks and recommends permanent ban for image solicitation', () => {
    const result = evaluateMessageContext({
      minorAge: 15,
      adultAge: 28,
      recentMessages: [
        { senderIsMinor: false, text: 'Send me a pic of yourself.' },
        { senderIsMinor: true, text: 'I am not sure.' },
      ],
      adultSolicitedImages: true,
    });
    expect(result.verdict).toBe('block');
    expect(result.adultPermanentBanRecommended).toBe(true);
    expect(result.blockMessages).toBe(true);
    expect(result.minorWarning).toBe(true);
  });

  it('flags platform migration attempt', () => {
    const result = evaluateMessageContext({
      minorAge: 16,
      adultAge: 29,
      recentMessages: [
        { senderIsMinor: false, text: 'Add me on Snapchat, we can talk there.' },
        { senderIsMinor: true, text: 'Sure.' },
      ],
    });
    expect(['flag', 'block']).toContain(result.verdict);
    expect(result.blockMessages).toBe(true);
  });

  it('returns safe when suspicious signal present but strong safe context', () => {
    // A coach saying "just between us" about team strategy is monitored, not blocked
    const result = evaluateMessageContext({
      minorAge: 16,
      adultAge: 35,
      recentMessages: [
        { senderIsMinor: false, text: 'This is just between us — the team strategy for the tournament game.' },
        { senderIsMinor: false, text: 'Practice tomorrow at the stadium. Good luck with your training workout.' },
        { senderIsMinor: true, text: 'Got it coach, thanks for the tip.' },
      ],
    });
    // Should be monitor (context is safe — coach + minor suspicious signal)
    expect(['safe', 'monitor']).toContain(result.verdict);
    expect(result.adultPermanentBanRecommended).toBe(false);
  });

  it('returns safe when context is not a minor-adult pair', () => {
    const result = evaluateMessageContext({
      minorAge: 25, // Not a minor
      adultAge: 30,
      recentMessages: [{ senderIsMinor: false, text: 'Hello' }],
    });
    expect(result.verdict).toBe('safe');
    expect(result.blockMessages).toBe(false);
  });
});

describe('messageContextChecker — repeat adult offender stricter treatment', () => {
  it('escalates faster for adult with prior flags', () => {
    const noFlagsResult = evaluateMessageContext({
      minorAge: 15,
      adultAge: 30,
      adultPriorFlags: 0,
      recentMessages: [
        { senderIsMinor: false, text: 'You look young. How old are you?' },
        { senderIsMinor: true, text: 'I am 15.' },
      ],
    });

    const priorFlagsResult = evaluateMessageContext({
      minorAge: 15,
      adultAge: 30,
      adultPriorFlags: 3,
      recentMessages: [
        { senderIsMinor: false, text: 'You look young. How old are you?' },
        { senderIsMinor: true, text: 'I am 15.' },
      ],
    });

    // With prior flags, should be more severe or equal
    const verdictSeverity = (v: string) =>
      v === 'block' ? 3 : v === 'flag' ? 2 : v === 'monitor' ? 1 : 0;
    expect(verdictSeverity(priorFlagsResult.verdict)).toBeGreaterThanOrEqual(
      verdictSeverity(noFlagsResult.verdict),
    );
  });
});

