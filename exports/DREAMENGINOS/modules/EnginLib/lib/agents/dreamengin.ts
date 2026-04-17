// lib/agents/dreamengin.ts
// DREAMengin Agent — the embodiment of the DREAMengin philosophy.
//
// This agent IS the DREAMengin idea expressed as executable validation.
// It does not read the README. It IS the README, encoded as enforcement
// rules, vocabulary authority, and architectural truth.
//
// DREAMengin is a privacy-first, dual-runtime, spatial operating
// environment. This agent validates that every surface, Dream Window,
// route, and interaction aligns with that identity.

// ---------------------------------------------------------------------------
// Core Identity — What DREAMengin IS
// ---------------------------------------------------------------------------

/** DREAMengin is a dual-runtime spatial operating environment. */
export const IDENTITY = {
  name: 'DREAMengin',
  kind: 'dual-runtime spatial operating environment',
  palette: ['gold', 'light-blue', 'white'] as const,
  font: 'Space Grotesk',
  radiusFamily: [6, 10, 14, 18, 24, 32, 9999] as const,
} as const;

// ---------------------------------------------------------------------------
// Product Axioms — Non-negotiable truths
// ---------------------------------------------------------------------------

export const AXIOMS = [
  'Nothing is public by default.',
  'All creation starts private.',
  'Every visible action must do something real.',
  'No fake buttons.',
  'No accidental sharing.',
  'No hidden posting.',
  'No platform system may bypass privacy rules.',
] as const;

// ---------------------------------------------------------------------------
// Canonical Vocabulary — Say THIS, not THAT
// ---------------------------------------------------------------------------

export const VOCABULARY: ReadonlyArray<{ canonical: string; forbidden: string[] }> = [
  { canonical: 'surface',            forbidden: ['page'] },
  { canonical: 'Dream Window',       forbidden: ['widget', 'card'] },
  { canonical: 'DreamSpace',         forbidden: ['widget layer'] },
  { canonical: 'Surface Space',      forbidden: ['top area', 'main area'] },
  { canonical: 'runtime',            forbidden: ['app'] },
  { canonical: 'runtime environment', forbidden: ['platform'] },
  { canonical: 'surface switching',  forbidden: ['tab navigation'] },
  { canonical: 'bind',              forbidden: ['link widget'] },
  { canonical: 'mount',             forbidden: ['open page'] },
  { canonical: 'activate',          forbidden: ['launch card'] },
  { canonical: 'connection path',   forbidden: ['pair'] },
];

// ---------------------------------------------------------------------------
// Core Surfaces — The only stable entry points
// ---------------------------------------------------------------------------

export const CORE_SURFACES = {
  HomeDream:        { route: '/homedream',          privacy: 'private' },
  EditProfileDream: { route: '/edit-profiledream',  privacy: 'private' },
  ViewProfile:      { route: '/view-profile',       privacy: 'public-output' },
  DreamDM:          { route: '/messages',            privacy: 'private' },
  DreamShop:        { route: '/shop',                privacy: 'mixed' },
  DreamMarketplace: { route: '/marketplace',         privacy: 'mixed' },
  DreamAds:         { route: '/ads',                 privacy: 'mixed' },
} as const;

// ---------------------------------------------------------------------------
// Daydream Network — 6 surfaces × 6 engins × 11 connection paths
// ---------------------------------------------------------------------------

export const DAYDREAM_SURFACES = [
  { name: 'Music Daydream',  route: '/daydream/music',  engin: 'StarMakerEngin' },
  { name: 'Games Daydream',  route: '/daydream/games',  engin: 'GameEngin' },
  { name: 'Lab Daydream',    route: '/daydream/lab',    engin: 'LabEngin' },
  { name: 'Code Daydream',   route: '/daydream/code',   engin: 'CodeEngin' },
  { name: 'Brand Daydream',  route: '/daydream/brand',  engin: 'BrandingEngin' },
  { name: 'Create Daydream', route: '/daydream/create', engin: 'ContentEngin' },
] as const;

/** A Daydream can invoke multiple Engins. An Engin can support multiple Daydreams. */
export const CONNECTION_PATH_COUNT = 11;

// ---------------------------------------------------------------------------
// Design Tokens — Gold / Light-Blue / White
// ---------------------------------------------------------------------------

export const DESIGN_TOKENS = {
  gold:      { meaning: 'save, confirm, action, premium emphasis',  hex: '#c8a84e' },
  lightBlue: { meaning: 'live state, connected state, signal state', hex: '#a0c3f0' },
  white:     { meaning: 'base surface, clarity, space',              hex: '#ffffff' },
} as const;

// ---------------------------------------------------------------------------
// Privacy Model — The source of truth for visibility defaults
// ---------------------------------------------------------------------------

export type PrivacyDefault = 'private' | 'public-output' | 'mixed';

export interface PrivacyRule {
  surface: string;
  defaultVisibility: PrivacyDefault;
  rule: string;
}

export const PRIVACY_RULES: ReadonlyArray<PrivacyRule> = [
  { surface: 'HomeDream',        defaultVisibility: 'private',       rule: 'Private by default. Personal operating surface.' },
  { surface: 'EditProfileDream', defaultVisibility: 'private',       rule: 'Private builder. Never directly visible to others.' },
  { surface: 'ViewProfile',      defaultVisibility: 'public-output', rule: 'Shows only explicitly shared/saved projections.' },
  { surface: 'DreamDM',          defaultVisibility: 'private',       rule: 'Private messaging. End-to-end when possible.' },
  { surface: 'DreamShop',        defaultVisibility: 'mixed',         rule: 'Public storefront, private purchase history.' },
  { surface: 'DreamMarketplace', defaultVisibility: 'mixed',         rule: 'Public listings, private transaction details.' },
  { surface: 'DreamAds',         defaultVisibility: 'mixed',         rule: 'Transparent, user-controlled ad spaces.' },
];

// ---------------------------------------------------------------------------
// Navigation Rules — Depth, not page switching
// ---------------------------------------------------------------------------

export const NAVIGATION_RULES = [
  'Navigation must feel like depth, not page switching.',
  'Going back must restore context, not reload a new world.',
  'Users must never feel they have left the DREAMengin environment.',
  'Side A leads naturally into Side B (Engin). Side B is the powered control layer.',
  'The Gold Button is the primary travel control.',
  'Single tap: open dual menus. Double tap: go Home.',
] as const;

// ---------------------------------------------------------------------------
// Dream Window States — The four canonical lifecycle states
// ---------------------------------------------------------------------------

export const DREAM_WINDOW_STATES = ['Unbound', 'Bound', 'Mounted', 'Collapsed'] as const;
export type DreamWindowState = (typeof DREAM_WINDOW_STATES)[number];

// ---------------------------------------------------------------------------
// AI Triad — Three agents, strict roles
// ---------------------------------------------------------------------------

export const AI_TRIAD = {
  DrEams:       { role: 'User assistant / routing / discovery', audience: 'All authenticated users', route: '/api/ai/eams' },
  IDARi:        { role: 'Admin bug-fixer + optimizer',          audience: 'Admins only',              route: '/api/ai/idari' },
  TheBoogieMan: { role: 'Policy enforcer + system overwatch',   audience: 'System / Admins only',     route: '/api/ai/boogieman' },
} as const;

// ---------------------------------------------------------------------------
// DreamDM Bar — The runtime seam between two live worlds
// ---------------------------------------------------------------------------

export const DREAMDM_BAR = {
  purpose: 'Persistent interaction rail and draggable spatial divider between Surface Space and Dream Space.',
  snapPoints: ['surface-focus', 'balanced', 'dream-focus', 'pinned'] as const,
  functions: [
    'quick message composition',
    'notification aggregation',
    'draft persistence',
    'quick replies',
    'search shortcuts',
    'content routing',
    'quick post creation',
    'command-surface access',
    'physical resizing of the two active spaces',
  ],
} as const;

// ---------------------------------------------------------------------------
// Validation Engine — The agent's active capability
// ---------------------------------------------------------------------------

export type ViolationSeverity = 'info' | 'warning' | 'violation';

export interface Violation {
  rule: string;
  severity: ViolationSeverity;
  file?: string;
  detail: string;
}

/**
 * Validate a piece of text (code, UI copy, commit message) against
 * DREAMengin vocabulary rules. Returns violations for any forbidden
 * terminology that should use canonical vocabulary instead.
 */
export function validateVocabulary(text: string): Violation[] {
  const violations: Violation[] = [];
  for (const entry of VOCABULARY) {
    for (const bad of entry.forbidden) {
      const regex = new RegExp(`\\b${bad}\\b`, 'gi');
      if (regex.test(text)) {
        violations.push({
          rule: 'vocabulary',
          severity: 'warning',
          detail: `Use "${entry.canonical}" instead of "${bad}".`,
        });
      }
    }
  }
  return violations;
}

/**
 * Validate that a color palette does not use traffic-light colors.
 * DREAMengin uses gold / light-blue / white — not red / yellow / green
 * status indicators.
 */
export function validatePalette(hexColors: string[]): Violation[] {
  const trafficLightPatterns = [
    { pattern: /^#(22c55e|16a34a|15803d|4ade80|86efac)/i, name: 'green (traffic-light)' },
    { pattern: /^#(f59e0b|d97706|fbbf24|fcd34d)/i,        name: 'amber/yellow (traffic-light)' },
    { pattern: /^#(dc4444|ef4444|b91c1c|f87171)/i,         name: 'red (traffic-light)' },
  ];
  const violations: Violation[] = [];
  for (const hex of hexColors) {
    for (const { pattern, name } of trafficLightPatterns) {
      if (pattern.test(hex)) {
        violations.push({
          rule: 'palette',
          severity: 'violation',
          detail: `Color ${hex} is ${name}. Use gold (#c8a84e), light-blue (#a0c3f0), or white (#ffffff) per DREAMengin design system.`,
        });
      }
    }
  }
  return violations;
}

/**
 * Validate that a surface respects its privacy default.
 * Returns a violation if a private surface is being exposed publicly.
 */
export function validatePrivacy(
  surfaceName: string,
  intendedVisibility: 'private' | 'public' | 'shared',
): Violation[] {
  const rule = PRIVACY_RULES.find((r) => r.surface === surfaceName);
  if (!rule) return [];
  if (rule.defaultVisibility === 'private' && intendedVisibility === 'public') {
    return [{
      rule: 'privacy',
      severity: 'violation',
      detail: `${surfaceName} is private by default. Public exposure requires explicit user intent.`,
    }];
  }
  return [];
}

/**
 * Validate that navigation between surfaces preserves context
 * (no world reset, no page-loss feeling).
 */
export function validateNavigation(transition: {
  from: string;
  to: string;
  preservesContext: boolean;
}): Violation[] {
  if (!transition.preservesContext) {
    return [{
      rule: 'navigation',
      severity: 'warning',
      detail: `Transition from ${transition.from} to ${transition.to} does not preserve context. Navigation must feel like depth, not page switching.`,
    }];
  }
  return [];
}

/**
 * Validate that an action in the UI is real (not a fake button).
 * Every visible action must do something real per AXIOMS.
 */
export function validateAction(action: {
  label: string;
  hasHandler: boolean;
  isDisabledWithReason: boolean;
}): Violation[] {
  if (!action.hasHandler && !action.isDisabledWithReason) {
    return [{
      rule: 'real-action',
      severity: 'violation',
      detail: `"${action.label}" has no handler and no disabled explanation. Every visible action must do something real.`,
    }];
  }
  return [];
}

/**
 * Validate that OAuth tokens and credentials are never exposed in
 * client-side UI. Credential input must use type="password" and
 * OAuth flows must use server-side redirects, not token paste fields.
 */
export function validateCredentialSafety(field: {
  label: string;
  type: string;
  exposesToken: boolean;
}): Violation[] {
  const violations: Violation[] = [];
  if (field.exposesToken) {
    violations.push({
      rule: 'credential-safety',
      severity: 'violation',
      detail: `"${field.label}" exposes a credential/token in the UI. Use OAuth redirect or type="password" — never expose tokens.`,
    });
  }
  if (field.type !== 'password' && /token|secret|key|credential/i.test(field.label)) {
    violations.push({
      rule: 'credential-safety',
      severity: 'warning',
      detail: `"${field.label}" looks like a credential but uses type="${field.type}". Should be type="password".`,
    });
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Event System — client-side event bridge
// ---------------------------------------------------------------------------

export const DREAMENGIN_EVENT = 'dreamengin:agent';

export type DreamEnginEventType = 'validation' | 'guidance' | 'enforcement';

export interface DreamEnginEventDetail {
  type: DreamEnginEventType;
  timestamp: string;
  violations: Violation[];
  message: string;
}

export function emitDreamEnginEvent(detail: DreamEnginEventDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<DreamEnginEventDetail>(DREAMENGIN_EVENT, { detail }),
  );
}

export function onDreamEnginEvent(
  handler: (detail: DreamEnginEventDetail) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (evt: Event) => {
    const ce = evt as CustomEvent<DreamEnginEventDetail>;
    if (!ce.detail) return;
    handler(ce.detail);
  };
  window.addEventListener(DREAMENGIN_EVENT, listener);
  return () => window.removeEventListener(DREAMENGIN_EVENT, listener);
}
