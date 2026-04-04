/**
 * lib/social/crossPost.ts
 *
 * Phase 9 §20: Cross-post to external platforms — one-click share of a
 * Dream to Twitter/X, Mastodon, or other platforms as a rich link preview.
 *
 * Architecture justification:
 *   - docs/LAW.md §3: every visible action must do something real. The
 *     share buttons open real share intents; no fake UI.
 *   - Reuses the SOCIAL_PLATFORMS registry from lib/social/platforms.ts.
 *
 * Privacy: no user data is sent to external platforms. The share URL is
 * a standard web share intent that the user controls.
 */

import { PLATFORM_MAP, type SocialPlatform } from './platforms';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DreamSharePayload {
  /** Dream / post ID */
  id: string;
  /** Title / name of the Dream */
  title: string;
  /** Short description / caption */
  description?: string;
  /** Canonical URL for the Dream page */
  url: string;
  /** 3D thumbnail image URL (for rich link preview) */
  thumbnailUrl?: string;
  /** Tags associated with the Dream */
  tags?: string[];
}

export interface CrossPostTarget {
  platformId: string;
  platform: SocialPlatform;
  shareUrl: string;
}

// ─── Share URL targets supported for one-click cross-post ─────────────────────

const CROSS_POST_PLATFORM_IDS = [
  'twitter',
  'mastodon',
  'bluesky',
  'threads',
  'facebook',
  'linkedin',
  'whatsapp',
  'pinterest',
] as const;

/**
 * Build cross-post targets for a Dream.
 *
 * Returns an array of { platformId, platform, shareUrl } objects for each
 * supported cross-post platform.
 */
export function buildCrossPostTargets(
  payload: DreamSharePayload,
): CrossPostTarget[] {
  const text = formatShareText(payload);

  return CROSS_POST_PLATFORM_IDS
    .map((id): CrossPostTarget | null => {
      const platform = PLATFORM_MAP[id];
      if (!platform || !platform.supportsShare) return null;
      return {
        platformId: id,
        platform,
        shareUrl: platform.buildShareUrl(payload.url, text),
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);
}

/**
 * Format the share text for cross-posting.
 * Includes title, description (if short), and hashtags.
 */
export function formatShareText(payload: DreamSharePayload): string {
  const parts: string[] = [];

  parts.push(payload.title);

  if (payload.description && payload.description.length <= 120) {
    parts.push(payload.description);
  }

  if (payload.tags && payload.tags.length > 0) {
    const tagStr = payload.tags.slice(0, 5).map((t) => `#${t}`).join(' ');
    parts.push(tagStr);
  }

  return parts.join(' — ');
}

/**
 * Open a cross-post share URL in a new window/tab.
 * Uses window.open with standard social share dimensions.
 */
export function openCrossPost(shareUrl: string): void {
  if (typeof window === 'undefined') return;

  // Try native Web Share API first (better on mobile)
  // Only if the URL is a simple intent URL, not a complex share dialog
  window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
}

/**
 * Use the native Web Share API if available (mobile-first).
 * Falls back to openCrossPost if not supported.
 */
export async function nativeShare(payload: DreamSharePayload): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;

  if (navigator.share) {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.description ?? payload.title,
        url: payload.url,
      });
      return true;
    } catch {
      // User cancelled or API error — fall through
    }
  }

  return false;
}

// ─── OG Meta helpers (for rich link previews) ─────────────────────────────────

/**
 * Build Open Graph meta tags for a Dream page.
 * These ensure rich link previews when the Dream URL is shared.
 *
 * Usage: return these from a Next.js generateMetadata() function.
 */
export function buildDreamOgMeta(payload: DreamSharePayload): Record<string, string> {
  const meta: Record<string, string> = {
    'og:type': 'website',
    'og:title': payload.title,
    'og:url': payload.url,
    'og:site_name': 'DREAMengin',
  };

  if (payload.description) {
    meta['og:description'] = payload.description;
  }

  if (payload.thumbnailUrl) {
    meta['og:image'] = payload.thumbnailUrl;
    meta['og:image:width'] = '1200';
    meta['og:image:height'] = '630';
    meta['twitter:card'] = 'summary_large_image';
    meta['twitter:image'] = payload.thumbnailUrl;
  } else {
    meta['twitter:card'] = 'summary';
  }

  meta['twitter:title'] = payload.title;
  if (payload.description) {
    meta['twitter:description'] = payload.description;
  }

  return meta;
}
