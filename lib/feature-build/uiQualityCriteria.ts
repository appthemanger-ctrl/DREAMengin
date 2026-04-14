/**
 * lib/feature-build/uiQualityCriteria.ts
 *
 * SICC — the four UI quality dimensions pursued in the REFINE phase:
 *   Synchronized — real-time coordination across runtimes, shared state, and immediate feedback
 *   Intuitive    — discoverable interactions, clear affordances, accessible
 *   Cohesive     — surfaces feel unified; shared color, spacing, and motion
 *   Coherent     — naming, copy, and structure match platform vocabulary
 *
 * Each criterion has a grep detectPattern so the build-cycle workflow can
 * scan the codebase and report pass/fail per check.
 */

// ─── Dimensions ───────────────────────────────────────────────────────────────

export type SICCDimension = 'synchronized' | 'intuitive' | 'cohesive' | 'coherent';

export interface UIQualityCheck {
  id: string;
  dimension: SICCDimension;
  label: string;
  description: string;
  /**
   * grep-compatible pattern. Empty string = manual review only (no auto-scan).
   */
  detectPattern: string;
  /** Repo-relative paths to search. Empty = whole repo. */
  detectPaths: string[];
}

// ─── Global SICC checks (apply to every surface) ─────────────────────────────

export const SICC_GLOBAL_CRITERIA: readonly UIQualityCheck[] = [
  // ── Synchronized ──────────────────────────────────────────────────────────
  {
    id: 'design-tokens',
    dimension: 'synchronized',
    label: 'Design Token Usage',
    description: 'CSS custom properties (--de-*) used instead of raw colour literals',
    detectPattern: 'var\\(--de-',
    detectPaths: ['components/daydream', 'components/dreams'],
  },
  {
    id: 'dream-word-treatment',
    dimension: 'synchronized',
    label: 'DreamWord Treatment',
    description: 'de-dream-word class or DreamWord component applied to brand copy',
    detectPattern: 'de-dream-word|DreamWord',
    detectPaths: ['components'],
  },
  {
    id: 'premium-gradient',
    dimension: 'synchronized',
    label: 'Premium Neutral Gradient',
    description: 'Background gradient uses the premium neutral token range (#e9ecf1 → #f7f3ec)',
    detectPattern: '#e9ecf1|#f0f2f6|#f7f3ec',
    detectPaths: ['styles'],
  },

  // ── Intuitive ─────────────────────────────────────────────────────────────
  {
    id: 'aria-labels',
    dimension: 'intuitive',
    label: 'ARIA Labels on Actions',
    description: 'Interactive controls carry aria-label attributes',
    detectPattern: 'aria-label=',
    detectPaths: ['components/daydream', 'components/dreams'],
  },
  {
    id: 'hover-states',
    dimension: 'intuitive',
    label: 'Hover & Focus States',
    description: 'Buttons/cards have onMouseEnter/onMouseLeave or CSS :hover/:focus',
    detectPattern: 'onMouseEnter|:hover|:focus-visible',
    detectPaths: ['components/daydream', 'components/dreams'],
  },
  {
    id: 'press-feedback',
    dimension: 'intuitive',
    label: 'Press Feedback',
    description: 'de-pressable or de-card-pressable CSS class applied to interactive tiles',
    detectPattern: 'de-pressable|de-card-pressable',
    detectPaths: ['components'],
  },

  // ── Cohesive ──────────────────────────────────────────────────────────────
  {
    id: 'accent-token',
    dimension: 'cohesive',
    label: 'Per-Surface Accent Tokens',
    description: 'Each Engin surface defines and applies its own ACCENT constant',
    detectPattern: "const ACCENT = '",
    detectPaths: ['components/daydream'],
  },
  {
    id: 'border-radius-consistency',
    dimension: 'cohesive',
    label: 'Consistent Border Radius',
    description: 'Cards use 8px, 10px, or 12px border-radius (not arbitrary values)',
    detectPattern: 'borderRadius: (8|10|12)',
    detectPaths: ['components/daydream', 'components/dreams'],
  },
  {
    id: 'transition-timing',
    dimension: 'cohesive',
    label: 'Consistent Transition Timing',
    description: 'Micro-interactions use 0.15 s or 0.2 s transitions',
    detectPattern: 'transition:.*0\\.(15|2)s',
    detectPaths: ['components/daydream', 'components/dreams'],
  },

  // ── Coherent ──────────────────────────────────────────────────────────────
  {
    id: 'canonical-naming',
    dimension: 'coherent',
    label: 'Canonical Platform Naming',
    description: 'No rejected OS-layer terms (app, page, widget, engine) in surface copy',
    detectPattern: '\\b(widget|engine|dashboard|app store)\\b',
    detectPaths: ['components/daydream', 'components/dreams'],
  },
  {
    id: 'dual-runtime-bridge',
    dimension: 'coherent',
    label: 'Bridge Emit on Key Actions',
    description: 'Engin surfaces emit typed bridge events on meaningful actions',
    detectPattern: "bridge\\.emit\\(",
    detectPaths: ['components/daydream'],
  },
  {
    id: 'back-nav',
    dimension: 'coherent',
    label: 'Back Navigation in All Engins',
    description: 'Every Engin surface exposes an onBack prop and renders a back button',
    detectPattern: 'onBack',
    detectPaths: ['components/daydream'],
  },
] as const;

// ─── Per-dimension helpers ────────────────────────────────────────────────────

/** Filter global criteria to a single SICC dimension. */
export function getCriteriaForDimension(dim: SICCDimension): UIQualityCheck[] {
  return SICC_GLOBAL_CRITERIA.filter((c) => c.dimension === dim);
}

/** All four SICC dimension labels in display order. */
export const SICC_DIMENSIONS: readonly { id: SICCDimension; label: string; emoji: string }[] = [
  { id: 'synchronized', label: 'Synchronized', emoji: '✦' },
  { id: 'intuitive', label: 'Intuitive', emoji: '◈' },
  { id: 'cohesive',  label: 'Cohesive',  emoji: '◎' },
  { id: 'coherent',  label: 'Coherent',  emoji: '◇' },
] as const;
