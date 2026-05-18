/**
 * lib/feed/hashtags.ts
 *
 * Phase 9 §17: Hashtag & topic system — users can tag Dreams with #tags;
 * browse by trending tags (momentum-weighted).
 *
 * Pure, side-effect-free helpers for hashtag extraction, validation, and
 * trending calculation.
 *
 * Architecture justification:
 *   - docs/LAW.md §3: every visible action must do something real. Tags
 *     are stored, indexed, and queryable — not decorative.
 *   - docs/ARCHITECTURE.md §8: Gold accent for actions, blue for state.
 *     Tag pills use the blue "live state" colour.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum number of tags per post */
export const MAX_TAGS_PER_POST = 10;

/** Maximum tag length (excluding #) */
export const MAX_TAG_LENGTH = 32;

/** Regex for a valid tag body (no # prefix) */
const TAG_BODY_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Hashtag {
  /** Tag text without the # prefix, lowercased */
  tag: string;
  /** Display-friendly version (original casing preserved) */
  display: string;
}

export interface TrendingTag {
  tag: string;
  /** Number of posts using this tag in the window */
  count: number;
  /** Momentum-weighted score (recent usage counts more) */
  momentum: number;
}

// ─── Extraction ───────────────────────────────────────────────────────────────

/**
 * Extract hashtags from a text string.
 *
 * Rules:
 *   - Tags start with # followed by [a-zA-Z0-9][a-zA-Z0-9_-]*
 *   - Max MAX_TAG_LENGTH characters after the #
 *   - Duplicates (case-insensitive) are removed; first occurrence wins display
 *   - At most MAX_TAGS_PER_POST tags returned
 */
export function extractHashtags(text: string): Hashtag[] {
  if (!text) return [];

  const matches = text.match(/#[a-zA-Z0-9][a-zA-Z0-9_-]*/g);
  if (!matches) return [];

  const seen = new Set<string>();
  const tags: Hashtag[] = [];

  for (const match of matches) {
    const body = match.slice(1); // remove #
    if (body.length > MAX_TAG_LENGTH) continue;

    const normalised = body.toLowerCase();
    if (seen.has(normalised)) continue;
    seen.add(normalised);

    tags.push({ tag: normalised, display: body });
    if (tags.length >= MAX_TAGS_PER_POST) break;
  }

  return tags;
}

/**
 * Validate a single tag string (without # prefix).
 * Returns the normalised (lowercased) tag or null if invalid.
 */
export function validateTag(raw: string): string | null {
  const trimmed = raw.trim().replace(/^#/, '');
  if (!trimmed) return null;
  if (trimmed.length > MAX_TAG_LENGTH) return null;
  if (!TAG_BODY_RE.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

// ─── Trending calculation ─────────────────────────────────────────────────────

interface TagUsage {
  tag: string;
  timestamp: number; // epoch ms
}

/**
 * Calculate trending tags from a list of tag usage records.
 *
 * Momentum formula: each usage contributes `1 / (1 + ageHours * decay)`.
 * Recent posts contribute more; older posts decay exponentially.
 *
 * @param usages - all tag usage records in the window
 * @param now - current timestamp (ms), defaults to Date.now()
 * @param decay - decay rate per hour (higher = faster decay)
 * @param limit - max number of trending tags to return
 */
export function calculateTrending(
  usages: TagUsage[],
  now?: number,
  decay = 0.1,
  limit = 20,
): TrendingTag[] {
  const currentTime = now ?? Date.now();
  const map = new Map<string, { count: number; momentum: number }>();

  for (const u of usages) {
    const existing = map.get(u.tag) ?? { count: 0, momentum: 0 };
    const ageHours = Math.max(0, (currentTime - u.timestamp) / 3_600_000);
    existing.count += 1;
    existing.momentum += 1 / (1 + ageHours * decay);
    map.set(u.tag, existing);
  }

  const results: TrendingTag[] = Array.from(map.entries()).map(
    ([tag, { count, momentum }]) => ({
      tag,
      count,
      momentum: Math.round(momentum * 100) / 100,
    }),
  );

  // Sort by momentum descending
  results.sort((a, b) => b.momentum - a.momentum);

  return results.slice(0, limit);
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Format a tag for display with # prefix.
 */
export function formatTag(tag: string): string {
  return `#${tag}`;
}

/**
 * Convert post text to rich segments, splitting out hashtags for styling.
 *
 * Returns an array of { type: 'text' | 'hashtag', value: string } segments.
 */
export function segmentText(
  text: string,
): Array<{ type: 'text' | 'hashtag'; value: string }> {
  const segments: Array<{ type: 'text' | 'hashtag'; value: string }> = [];
  const re = /#[a-zA-Z0-9][a-zA-Z0-9_-]*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'hashtag', value: match[0] });
    lastIndex = re.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments;
}
