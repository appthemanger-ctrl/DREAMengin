/**
 * DREAMengin — Canonical Structural Manifest
 *
 * This file is the single, authoritative map of every zone in the DREAMengin
 * codebase. AI tools, code generators, and new contributors MUST read this
 * before creating any file, folder, route, or component.
 *
 * DREAMengin is a dual-runtime, spatial operating environment — not a
 * conventional page-based web app. The structure below reflects that:
 * surfaces, Dream Windows, Engin runtimes, and the DreamDM Bar seam.
 *
 * TypeScript path aliases (tsconfig.json) mirror these zones:
 *   @identity         → lib/identity/canonical-names.ts
 *   @identity/*       → lib/identity/*
 *   @dreams/*         → components/dreams/*
 *   @home/*           → components/home/*
 *   @daydream/*       → components/daydream/*
 *   @dreamengin/*     → components/dreamengin/*
 *   @runtime/*        → lib/runtime/*
 *   @agents/*         → lib/agents/*
 *   @structure        → lib/structure/index.ts  (this file)
 *
 * Naming authority: lib/identity/canonical-names.ts
 * Architecture law: docs/ARCHITECTURE.md
 * Product law:      docs/LAW.md
 */

// ---------------------------------------------------------------------------
// Zone descriptors
// ---------------------------------------------------------------------------

export interface ZoneDescriptor {
  /** Canonical DREAMengin name for this zone */
  name: string;
  /** Filesystem path relative to repo root */
  path: string;
  /** TypeScript import alias (if any) */
  alias?: string;
  /** What this zone contains */
  contains: string;
  /** What this zone must NOT contain */
  mustNot: string;
}

// ---------------------------------------------------------------------------
// App Router surfaces  (app/)
// ---------------------------------------------------------------------------
//
// Rule: routes use canonical product names, not generic web-app names.
// Never create app/pages/, app/dashboard/, app/feed/ — these are rejected terms.
// Use: app/homedream/, app/daydream/[domain]/, app/view-profile/, etc.
// ---------------------------------------------------------------------------

export const APP_ZONES: readonly ZoneDescriptor[] = [
  {
    name: 'HomeDream Surface',
    path: 'app/homedream',
    contains: 'Root private operating surface. Entry point after auth.',
    mustNot: 'Public data. Legacy /home route logic (that lives at app/home as a redirect).',
  },
  {
    name: 'Edit ProfileDream Surface',
    path: 'app/edit-profiledream',
    contains: 'Private profile builder and staging layer.',
    mustNot: 'Public profile output. /edit-profile route logic (redirect only).',
  },
  {
    name: 'View Profile Surface',
    path: 'app/view-profile',
    contains: 'Shared/public output surface. Reads projections only via visibility_mappings.',
    mustNot: 'Private HomeDream data. Source Dream Window internals.',
  },
  {
    name: 'Daydream Surface Network',
    path: 'app/daydream',
    contains: 'Six canonical Daydream surfaces: /daydream/music, /daydream/games, /daydream/lab, /daydream/code, /daydream/brand, /daydream/create',
    mustNot: 'Seventh Daydream domain. Non-canonical sub-routes not in the six-domain model.',
  },
  {
    name: 'DreamDM Surface',
    path: 'app/messages',
    contains: 'DreamDM messaging surface.',
    mustNot: 'Feed or HomeDream content.',
  },
  {
    name: 'DreamShop Surface',
    path: 'app/shop',
    contains: 'User-owned shop surface.',
    mustNot: 'DreamMarketplace logic.',
  },
  {
    name: 'DreamMarketplace Surface',
    path: 'app/marketplace',
    contains: 'Marketplace browsing surface.',
    mustNot: 'DreamShop seller logic.',
  },
  {
    name: 'DreamAds Surface',
    path: 'app/ads',
    contains: 'User-controlled ad space and DreamAds management.',
    mustNot: 'Platform promotions (separate concept from user DreamAds).',
  },
  {
    name: 'AI Routes',
    path: 'app/api/ai',
    contains: 'Three AI triad endpoints: /api/ai/eams (Dr. Eams), /api/ai/idari (IDARi), /api/ai/boogieman (TheBoogieMan.Ai)',
    mustNot: 'Fourth AI agent. Public-facing AI without auth guard.',
  },
] as const;

// ---------------------------------------------------------------------------
// Component zones  (components/)
// ---------------------------------------------------------------------------
//
// Rule: folder names match the canonical DREAMengin runtime vocabulary.
// Never create components/widgets/ (use components/dreams/).
// Never create components/pages/ (use app/ routes).
// ---------------------------------------------------------------------------

export const COMPONENT_ZONES: readonly ZoneDescriptor[] = [
  {
    name: 'Dream Windows',
    path: 'components/dreams',
    alias: '@dreams/*',
    contains: 'Universal modular runtime containers. DreamShell, DreamConnectorLayer, DreamFeatureLayer, DreamOutputLayer, SuperDreamWidget.',
    mustNot: 'Legacy "widget" code. Non-Dream-Window UI primitives.',
  },
  {
    name: 'HomeDream Surface Components',
    path: 'components/home',
    alias: '@home/*',
    contains: 'HomeDream operating surface UI: HomeSystem, HomeDream, WorkspaceDashboard, GlobalDreamBar, DreamWindowRail.',
    mustNot: 'Daydream surface components. Profile output.',
  },
  {
    name: 'Daydream Surface Components',
    path: 'components/daydream',
    alias: '@daydream/*',
    contains: 'Engin control surfaces for all six Daydream domains: CodeEngin, LabEngin, StarMakerEngin, GameEngin, BrandingEngin, ContentEngin.',
    mustNot: 'HomeDream components. A seventh Engin not in the six canonical pairs.',
  },
  {
    name: 'DREAMenginOS',
    path: 'components/dreamengin',
    alias: '@dreamengin/*',
    contains: 'OS-layer shell: DREAMenginOS, DreamSpace, EnginShell, DrEamsPanel, NexusMenu. The top-level spatial OS container.',
    mustNot: 'Individual surface content. App-level page rendering.',
  },
  {
    name: 'DreamNav',
    path: 'components/dreamnav',
    contains: 'DreamDM Bar, Runtime Seam navigation, DreamMenu navigation components.',
    mustNot: 'Generic navbar components. Non-DreamDM-Bar navigation primitives.',
  },
  {
    name: 'Profile Components',
    path: 'components/profile',
    contains: 'ProfileEditor and profile-related UI components.',
    mustNot: 'View Profile output (that lives in app/view-profile and components read via visibility_mappings only).',
  },
] as const;

// ---------------------------------------------------------------------------
// Library zones  (lib/)
// ---------------------------------------------------------------------------

export const LIB_ZONES: readonly ZoneDescriptor[] = [
  {
    name: 'Canonical Naming Authority',
    path: 'lib/identity',
    alias: '@identity/*',
    contains: 'canonical-names.ts — single source of truth for all product names, surface names, routes, Engin names, AI agent names, and OS-layer vocabulary. ALL code generators must import from here.',
    mustNot: 'Runtime logic. UI code.',
  },
  {
    name: 'Dream Window System',
    path: 'lib/dream-window',
    contains: 'DreamWindowLifecycle state machine, connectionVerbs dispatch, runtimeRegion model, enginConnectionNetwork 11-path map.',
    mustNot: 'UI rendering logic. Supabase calls.',
  },
  {
    name: 'Dual Runtime / Memory',
    path: 'lib/runtime',
    alias: '@runtime/*',
    contains: 'SharedArrayBuffer memory map, EnginDispatcher, dualRuntimeBridge, dreamOSBus, DreamDM Bar seam coordination.',
    mustNot: 'Surface rendering. Supabase auth calls.',
  },
  {
    name: 'AI Triad',
    path: 'lib/agents',
    alias: '@agents/*',
    contains: 'agentBus (client event bridge), idari.ts (PatchPlan helpers), boogieManAI.ts, drEamsMode.ts, idariLoop.ts.',
    mustNot: 'User-facing UI. Public-accessible logic without auth gate.',
  },
  {
    name: 'Structural Manifest',
    path: 'lib/structure',
    alias: '@structure',
    contains: 'This file. Canonical zone map for AI tools and future contributors.',
    mustNot: 'Runtime logic. UI code. Anything that changes at deploy time.',
  },
] as const;

// ---------------------------------------------------------------------------
// Rejected folder patterns
// ---------------------------------------------------------------------------
//
// These patterns must NOT be created. They map to conventions from other
// frameworks or generic Next.js training data — not DREAMengin's structure.
// ---------------------------------------------------------------------------

export const REJECTED_FOLDER_PATTERNS: readonly string[] = [
  'app/pages',            // rejected: Next.js pages-router pattern
  'app/dashboard',        // rejected: use HomeDream Surface
  'app/feed',             // rejected: feed is inside HomeDream, not a top-level route
  'components/widgets',   // rejected: use components/dreams (Dream Windows)
  'components/cards',     // rejected: use Dream Windows
  'components/layout',    // rejected: layout is in app/layout.tsx and DREAMenginOS
  'components/pages',     // rejected: routes live in app/, never in components/
  'components/views',     // rejected: use components/home, components/dreamengin, etc.
  'lib/helpers',          // rejected: too generic — use the named lib sub-modules
  'lib/utils',            // rejected: use lib/utils.ts (existing single file, not a folder)
  'lib/common',           // rejected: too generic
  'lib/shared',           // rejected: too generic
] as const;

// ---------------------------------------------------------------------------
// Routing rules for AI code generation
// ---------------------------------------------------------------------------

export const ROUTE_RULES = {
  /** The root private surface. Post-auth redirect target. */
  HOME_DREAM: '/homedream',
  /** Support redirect only — never the canonical name */
  HOME_LEGACY: '/home',
  /** Six and only six Daydream surface routes */
  DAYDREAM_DOMAINS: [
    '/daydream/music',
    '/daydream/games',
    '/daydream/lab',
    '/daydream/code',
    '/daydream/brand',
    '/daydream/create',
  ] as const,
  /** Creating a seventh /daydream/* route is rejected without explicit product spec change */
  MAX_DAYDREAM_DOMAINS: 6,
  /** AI triad routes */
  AI: {
    DR_EAMS: '/api/ai/eams',
    IDARI: '/api/ai/idari',
    BOOGIEMAN: '/api/ai/boogieman',
  },
} as const;

// ---------------------------------------------------------------------------
// Full zone registry (flat, for tooling enumeration)
// ---------------------------------------------------------------------------

export const ALL_ZONES: readonly ZoneDescriptor[] = [
  ...APP_ZONES,
  ...COMPONENT_ZONES,
  ...LIB_ZONES,
] as const;

/**
 * Returns the zone descriptor for a given filesystem path prefix.
 * Returns undefined if no zone matches.
 */
export function getZoneForPath(path: string): ZoneDescriptor | undefined {
  return ALL_ZONES.find(z => path.startsWith(z.path));
}

/**
 * Returns true if the given folder path is a rejected pattern.
 * Use this in code generators to prevent creating non-canonical folders.
 */
export function isRejectedFolder(path: string): boolean {
  return REJECTED_FOLDER_PATTERNS.some(pattern => path.includes(pattern));
}

/**
 * Returns all zones that expose a TypeScript path alias.
 */
export function getAliasedZones(): ZoneDescriptor[] {
  return ALL_ZONES.filter(z => z.alias !== undefined);
}
