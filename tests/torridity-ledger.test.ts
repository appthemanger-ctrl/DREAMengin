import { describe, expect, it } from 'vitest';
import {
  TORRIDITY_LEDGER_CONFIG,
  calculateRank,
  derivePostMassMeta,
  getInteractionDelta,
  getPostMass,
  resolveSwipeRelease,
  verifyHumanity,
} from '@/lib/dreamr/torridityLedger';

describe('Torridity Ledger', () => {
  it('applies a signed logarithmic interaction delta', () => {
    expect(getInteractionDelta(0)).toBe(0);
    expect(getInteractionDelta(32)).toBeGreaterThan(0);
    expect(getInteractionDelta(-32)).toBeLessThan(0);
    expect(Math.abs(getInteractionDelta(64))).toBeLessThan(64);
  });

  it('locks strong left-whip releases with zero bounce', () => {
    const release = resolveSwipeRelease({
      pixelDelta: -140,
      crossDelta: 18,
      durationMs: 140,
      viewportExtent: 390,
      direction: 'negative',
    });

    expect(release.shouldTrigger).toBe(true);
    expect(release.locked).toBe(true);
    expect(release.releaseVelocity).toBe(0);
  });

  it('rejects weak or non-dominant swipe releases', () => {
    const weak = resolveSwipeRelease({
      pixelDelta: -20,
      crossDelta: 5,
      durationMs: 160,
      viewportExtent: 390,
      direction: 'negative',
    });
    const verticalish = resolveSwipeRelease({
      pixelDelta: -60,
      crossDelta: 58,
      durationMs: 130,
      viewportExtent: 390,
      direction: 'negative',
    });

    expect(weak.shouldTrigger).toBe(false);
    expect(verticalish.shouldTrigger).toBe(false);
  });

  it('caps low-mass posts to the trend gate', () => {
    const rank = calculateRank({
      humanViews: 500,
      metadata: { buildTime: 0.2, uniqueAssets: 0 },
    });

    expect(rank).toBeLessThanOrEqual(TORRIDITY_LEDGER_CONFIG.deltaP);
  });

  it('rewards higher visibility for higher-mass posts', () => {
    const metadata = derivePostMassMeta({
      content: Array(80).fill('crafted motion system').join(' '),
      media_url: 'https://cdn.example.com/post.jpg',
      source: 'post',
      provider: 'dreamengin',
    });

    const lowViews = calculateRank({ humanViews: 10, metadata });
    const highViews = calculateRank({ humanViews: 400, metadata });

    expect(getPostMass(metadata)).toBeGreaterThan(1.5);
    expect(highViews).toBeGreaterThan(lowViews);
  });

  it('verifies humanity inside the configured beta-slope window', () => {
    expect(verifyHumanity({ acceleration: 0.7, time: 1 })).toBe(true);
    expect(verifyHumanity({ acceleration: 0.4, time: 1 })).toBe(false);
  });
});
