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
