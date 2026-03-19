'use client';

/**
 * JourneyDreamWindow — compact Journey Trail Dream Window.
 *
 * Mountable in the HomeDream Surface DreamSpace.
 * Shows the 5 most recent journey dots with a link to the full trail in BrandingEngin.
 *
 * Dream Window layer model (docs/ARCHITECTURE.md §Dream Windows):
 *   Layer 1 — DreamShell (header)
 *   Layer 3 — Feature    (compact 5-dot trail)
 *   Layer 4 — Output     (link to full journey in BrandingEngin)
 */

import Link from 'next/link';
import JourneyTrail from '@/components/daydream/JourneyTrail';

export default function JourneyDreamWindow() {
  return (
    <div className="de-widget" style={{ minHeight: 180 }}>
      {/* Layer 1 — DreamShell header */}
      <div className="de-widget-header">
        <span className="de-widget-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#c8981a' }}>✦</span> Your Journey
        </span>
        <Link
          href="/daydream/brand"
          style={{ fontSize: 11, color: 'var(--de-text-dim)', textDecoration: 'none' }}
          aria-label="See full journey in BrandingEngin"
        >
          See all →
        </Link>
      </div>

      {/* Layer 3 — Feature: compact trail showing last 5 dots */}
      <div className="de-widget-body">
        <JourneyTrail limit={5} compact />
      </div>

      {/* Layer 4 — Output: link to Brand Daydream for full journey */}
      <div style={{
        padding:     '8px 16px',
        borderTop:   '1px solid rgba(160,195,240,0.15)',
        textAlign:   'center',
      }}>
        <Link
          href="/daydream/brand"
          style={{ fontSize: 11, color: '#c8981a', textDecoration: 'none', fontWeight: 600 }}
          aria-label="View your full journey in BrandingEngin"
        >
          View your full journey in BrandingEngin
        </Link>
      </div>
    </div>
  );
}
