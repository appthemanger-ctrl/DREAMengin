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
  // Remove script / style blocks first
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return text;
}

/**
 * Sanitize HTML to a safe subset (no scripts, no event handlers).
 * Returns plain text fallback when safeHtml is not needed.
 */
export function sanitizeHtml(html: string | undefined): string | undefined {
  if (!html) return undefined;
  // Remove dangerous tags/attributes; keep bold, italic, links, paragraphs
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/\s+on\w+="[^"]*"/gi, '')
    .replace(/\s+on\w+='[^']*'/gi, '')
    .replace(/<(?!\/?(?:b|i|em|strong|p|br|ul|ol|li|a|img)[> /])[^>]+>/gi, '');
}

/** Truncate text to maxLen chars, appending "…" if trimmed. */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}
