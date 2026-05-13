/**
 * lib/dreamengin/drEamsSearch.ts
 *
 * Pure helpers for the Dr. Eams HomeDream search bar.
 *
 * Architecture justification: docs/ARCHITECTURE.md §1 (AI triad — Dr. Eams is
 * user-facing), docs/FEATURE_STATUS.md Phase 6 item #4 (Dr. Eams as HomeDream
 * search bar with send-to-DreamDM routing).
 *
 * All functions are pure (no side effects) so they can be unit-tested without
 * DOM, Next.js, or network access.
 */

// ---------------------------------------------------------------------------
// Navigation suggestion catalogue
// ---------------------------------------------------------------------------

export type NavSuggestion = {
  label: string;
  href: string | null; // null → handled by callback (e.g. "Dr. Eams")
  icon: string;
};

export const NAV_SUGGESTIONS: NavSuggestion[] = [
  { label: 'HomeDream',         href: '/homedream',             icon: '🏠' },
  { label: 'DreamShop',         href: '/shop',                  icon: '🛍️' },
  { label: 'DreamMarketplace',  href: '/marketplace',           icon: '🏪' },
  { label: 'DreamDM',           href: '/messages',              icon: '💬' },
  { label: 'DreamAds',          href: '/ads',                   icon: '📢' },
  { label: 'Settings',          href: '/settings',              icon: '⚙️' },
  { label: 'Music Daydream',    href: '/daydream/music',        icon: '🎵' },
  { label: 'Games Daydream',    href: '/daydream/games',        icon: '🎮' },
  { label: 'Lab Daydream',      href: '/daydream/lab',          icon: '🧪' },
  { label: 'Code Daydream',     href: '/daydream/code',         icon: '💻' },
  { label: 'Brand Daydream',    href: '/daydream/brand',        icon: '🎨' },
  { label: 'Create Daydream',   href: '/daydream/create',       icon: '✏️' },
  { label: 'EditProfileDream',  href: '/edit-profiledream',     icon: '👤' },
  { label: 'Discover',          href: '/discover',              icon: '🔭' },
  { label: 'Dr. Eams',          href: null,                     icon: '◈'  },
] as const;

/**
 * Returns nav suggestions whose label contains the query (case-insensitive).
 * Returns at most `limit` results (default 5).
 */
export function matchNavSuggestions(query: string, limit = 5): NavSuggestion[] {
  if (!query.trim()) return [];
  const q = query.trim().toLowerCase();
  return NAV_SUGGESTIONS.filter(s => s.label.toLowerCase().includes(q)).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Dr. Eams API request builder
// ---------------------------------------------------------------------------

/** Minimal body for POST /api/ai/eams that satisfies DrEamsRunBodySchema. */
export type DrEamsRequestBody = {
  message: string;
  ui: { route: string };
  client_session_id?: string;
};

/**
 * Builds the minimal valid request body for the /api/ai/eams endpoint.
 *
 * @param query  The user's search / question text.
 * @param route  The current UI route (e.g. '/homedream'). Defaults to '/homedream'.
 */
export function buildDrEamsRequest(query: string, route = '/homedream'): DrEamsRequestBody {
  return {
    message: query.trim(),
    ui: { route },
  };
}

// ---------------------------------------------------------------------------
// Dr. Eams API response parser
// ---------------------------------------------------------------------------

/** Parsed reply extracted from the /api/ai/eams JSON response. */
export type DrEamsParsedReply = {
  text: string;
  /** True when the reply came from an error field rather than a real response. */
  isError: boolean;
};

/**
 * Extracts a user-displayable reply from the raw /api/ai/eams JSON.
 *
 * Handles:
 *  - Normal: `{ response_text: "..." }`
 *  - API error: `{ ok: false, error: { message: "..." } }`
 *  - Any unknown shape → safe fallback text
 */
export function parseDrEamsReply(data: unknown): DrEamsParsedReply {
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;

    if (typeof d.response_text === 'string' && d.response_text.trim()) {
      return { text: d.response_text.trim(), isError: false };
    }

    const errMsg =
      d.error && typeof d.error === 'object'
        ? (d.error as Record<string, unknown>).message
        : undefined;

    if (typeof errMsg === 'string' && errMsg.trim()) {
      return { text: `⚠️ ${errMsg.trim()}`, isError: true };
    }
  }

  return {
    text: "I'm here to help! Try opening my full panel for a longer chat. ◈",
    isError: false,
  };
}

// ---------------------------------------------------------------------------
// DreamDM URL builder
// ---------------------------------------------------------------------------

/**
 * Builds the /messages URL that pre-fills the DreamDM composer with context
 * from a Dr. Eams exchange.
 *
 * The `from=dr-eams` param signals to the DreamDM surface that this session
 * originated from a Dr. Eams search bar interaction. The `q` param carries
 * the original query so the user can share the insight with a friend.
 */
export function buildDreamDMUrl(query: string): string {
  const params = new URLSearchParams({
    from: 'dr-eams',
    q: query.trim(),
  });
  return `/messages?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Truncation helper
// ---------------------------------------------------------------------------

/**
 * Truncates a string to `maxChars` and appends `…` if cut.
 * Used to keep inline previews readable.
 */
export function truncatePreview(text: string, maxChars = 36): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars).trimEnd() + '…';
}
