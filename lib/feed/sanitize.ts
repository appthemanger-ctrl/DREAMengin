// ─── Feed Sanitizers ─────────────────────────────────────────────────────────
// Helpers that scrub external content before it enters the app layer.

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'mc_cid',
  'mc_eid',
  'yclid',
  'twclid',
  '_ga',
  'ref',
  'source',
];

/**
 * Remove common tracking query-string parameters from a URL.
 * Returns the cleaned URL string, or the original if parsing fails.
 */
export function sanitizeUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    for (const param of TRACKING_PARAMS) {
      url.searchParams.delete(param);
    }
    return url.toString();
  } catch {
    return raw;
  }
}

/** Strip all HTML tags and decode basic entities, returning plain text. */
export function htmlToText(html: string): string {
  // Strip all HTML tags (generic stripper handles script/style tags too;
  // content of script/style blocks appears as text which is safe in a plain-text context)
  const text = html
    .replace(/<[^>]+>/g, ' ')
    // Decode entities in a single pass (no double-decode risk)
    .replace(/&[a-z]+;|&#\d+;|&#x[\da-f]+;/gi, (entity) => {
      switch (entity.toLowerCase()) {
        case '&amp;':  return '&';
        case '&lt;':   return '<';
        case '&gt;':   return '>';
        case '&quot;': return '"';
        case '&#39;':
        case '&apos;': return "'";
        case '&nbsp;': return ' ';
        default:       return entity;
      }
    })
    .replace(/\s{2,}/g, ' ')
    .trim();
  return text;
}

/**
 * Sanitize HTML: convert to plain text to eliminate any injection risk.
 * The optional html field on FeedItem is always converted to plain text
 * before being stored, so there is no HTML injection surface.
 */
export function sanitizeHtml(html: string | undefined): string | undefined {
  if (!html) return undefined;
  return htmlToText(html);
}

/** Truncate text to maxLen chars, appending "…" if trimmed. */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}

