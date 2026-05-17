'use client';
/**
 * components/gameengin/dream.cartridge.FeaturedCartridges.tsx
 *
 * Compact "Featured Cartridges" widget for HomeDream.
 * Spec: GameENGINspec.md §7.4.
 *
 * Pulls from the existing CARTRIDGE_MANIFEST. Pure presentation; the full
 * filterable browser lives in `CartridgeBrowser.tsx`.
 */

import Link from 'next/link';
import {
  CARTRIDGE_MANIFEST,
  type CartridgeManifestEntry,
} from '@/lib/gameengin/cartridges/manifest';

export interface FeaturedCartridgesProps {
  /** Explicit cartridge ids to feature, in order. Defaults to flagship tier. */
  featured?: string[];
  /** Hard limit on rendered cards. */
  limit?: number;
}

export default function FeaturedCartridges(){
  featured,
  limit = 3,
}: FeaturedCartridgesProps) {
  let entries: CartridgeManifestEntry[];
  if (featured && featured.length > 0) {
    entries = featured
      .map((id: Record<string, unknown>) => CARTRIDGE_MANIFEST.find((c: Record<string, unknown>) => c.id === id))
      .filter((c): c is CartridgeManifestEntry => Boolean(c));
  } else {
    entries = CARTRIDGE_MANIFEST.filter((c: Record<string, unknown>) => c.tier === 'flagship');
  }
  entries = entries.slice(0, Math.max(1, limit));

  return (
    <section aria-label="Featured cartridges" className="featured-cartridges">
      <header className="featured-cartridges__head">
        <h2>🎮 Featured Cartridges</h2>
        <Link href="/gameengin/cartridges" className="featured-cartridges__more">
          Browse all →
        </Link>
      </header>
      <ul className="featured-cartridges__grid">
        {entries.map((c: Record<string, unknown>) => (
          <li
            key={c.id}
            className="featured-cartridges__card"
            style={{ borderColor: c.color }}
          >
            <Link href={`/gameengin/cartridges/${c.id}`}>
              <div className="featured-cartridges__emoji" aria-hidden>{c.emoji}</div>
              <div className="featured-cartridges__title">{c.label}</div>
              {c.subtitle ? (
                <div className="featured-cartridges__subtitle">{c.subtitle}</div>
              ) : null}
              <div className="featured-cartridges__meta">
                <span>{c.category}</span>
                <span>·</span>
                <span>{c.tier}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}