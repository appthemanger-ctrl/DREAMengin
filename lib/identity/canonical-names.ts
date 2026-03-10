/**
 * DREAMengin Canonical Names — Phase 7 Authority
 *
 * Machine-readable source of truth for all canonical product names,
 * surface names, module names, and validation rules.
 *
 * AI agents and code generators must import from this file to validate
 * names before generating files, routes, UI labels, or component names.
 *
 * See docs/NAMING_AUTHORITY.md for the full written authority.
 */

// ---------------------------------------------------------------------------
// Platform name
// ---------------------------------------------------------------------------

export const PLATFORM_NAME = 'DREAMengin' as const;

/** All rejected platform name variants. Any generated name matching one of these is invalid. */
export const REJECTED_PLATFORM_VARIANTS = [
  'DreamEngin',
  'Dreamengin',
  'dreamengin',
  'DREAMENGIN',
  'Dream Engin',
  'DreamEngine',
] as const;

// ---------------------------------------------------------------------------
// Core surface names
// ---------------------------------------------------------------------------

export const CORE_SURFACES = {
  HOME_DREAM: 'HomeDream',
  EDIT_PROFILE_DREAM_UI: 'Edit ProfileDream',
  EDIT_PROFILE_DREAM_CODE: 'EditProfileDream',
  VIEW_PROFILE_UI: 'View Profile',
  VIEW_PROFILE_CODE: 'ViewProfile',
} as const;

export const CORE_SURFACE_ROUTES = {
  HOME_DREAM: '/homedream',
  EDIT_PROFILE_DREAM: '/edit-profiledream',
  VIEW_PROFILE: '/view-profile',
} as const;

/** Legacy and support routes — valid as redirects and support targets only, never as canonical product surface names */
export const LEGACY_ROUTES = {
  /** Support route for HomeDream — redirects to canonical /homedream */
  HOME: '/home',
  /** Support route for EditProfileDream — redirects to canonical /edit-profiledream */
  EDIT_PROFILE: '/edit-profile',
  /** Current implementation target for ViewProfile by handle — canonical name is /view-profile which redirects here */
  PROFILE_HANDLE: '/profile/[handle]',
  /** Alternate handle-based support route */
  U_HANDLE: '/u/[handle]',
} as const;

export const REJECTED_CORE_SURFACE_NAMES = [
  'home',
  'dashboard',
  'feed',
  'edit-profile',
  'profile-editor',
  'builder',
  'public-profile',
  'profile-page',
] as const;

// ---------------------------------------------------------------------------
// Daydream domain names (Side A)
// ---------------------------------------------------------------------------

export const DAYDREAM_DOMAINS = {
  MUSIC: 'Music',
  GAMES: 'Games',
  LAB: 'Lab',
  CODE: 'Code',
  BRAND: 'Brand',
  CREATE: 'Create',
} as const;

export type DaydreamDomain = (typeof DAYDREAM_DOMAINS)[keyof typeof DAYDREAM_DOMAINS];

export const DAYDREAM_ROUTES: Record<DaydreamDomain, string> = {
  Music: '/daydream/music',
  Games: '/daydream/games',
  Lab: '/daydream/lab',
  Code: '/daydream/code',
  Brand: '/daydream/brand',
  Create: '/daydream/create',
};

// ---------------------------------------------------------------------------
// Engin control surface names (Side B)
// ---------------------------------------------------------------------------

export const ENGIN_SURFACES = {
  MUSIC: 'StarMakerEngin',
  GAMES: 'GameEngin',
  LAB: 'LabEngin',
  CODE: 'CodeEngin',
  BRAND: 'BrandingEngin',
  CREATE: 'ContentEngin',
} as const;

export type EnginSurface = (typeof ENGIN_SURFACES)[keyof typeof ENGIN_SURFACES];

/** Maps each Daydream domain to its canonical Engin control surface name */
export const DAYDREAM_TO_ENGIN: Record<DaydreamDomain, EnginSurface> = {
  Music: 'StarMakerEngin',
  Games: 'GameEngin',
  Lab: 'LabEngin',
  Code: 'CodeEngin',
  Brand: 'BrandingEngin',
  Create: 'ContentEngin',
};

export const ALL_ENGIN_NAMES: readonly EnginSurface[] = Object.values(ENGIN_SURFACES);

export const REJECTED_ENGIN_NAMES = [
  'StarMakerEngine',
  'GameEngine',
  'LabEngine',
  'CodeEngine',
  'BrandingEngine',
  'ContentEngine',
  'Dreamengin',
  'Daydreamengin',
  'DayDreamengin',
  'MusicEngin',
  'GamesEngin',
  'CreateEngin',
] as const;

// ---------------------------------------------------------------------------
// Platform module names
// ---------------------------------------------------------------------------

export const PLATFORM_MODULES = {
  DREAM_DM: 'DreamDM',
  DREAM_DM_BAR: 'DreamDM Bar',
  DREAM_MENU: 'DreamMenu',
  DREAM_MARKETPLACE: 'DreamMarketplace',
  DREAM_SHOP: 'DreamShop',
  DREAM_ADS: 'DreamAds',
} as const;

export type PlatformModule = (typeof PLATFORM_MODULES)[keyof typeof PLATFORM_MODULES];

export const MODULE_ROUTES: Partial<Record<PlatformModule, string>> = {
  DreamDM: '/messages',
  DreamMarketplace: '/marketplace',
  DreamShop: '/shop',
  DreamAds: '/ads',
};

export const REJECTED_MODULE_NAMES = [
  'messages',
  'chat',
  'inbox',
  'nav',
  'sidebar',
  'hamburger',
  'marketplace',
  'shop',
  'store',
  'promotions',
  'ads',
] as const;

// ---------------------------------------------------------------------------
// AI agent names
// ---------------------------------------------------------------------------

export const AI_AGENTS = {
  DR_EAMS: 'Dr. Eams',
  IDARI: 'IDARi',
  THE_BOOGIEMAN: 'TheBoogieMan.Ai',
} as const;

export type AIAgent = (typeof AI_AGENTS)[keyof typeof AI_AGENTS];

export const AI_ROUTES: Record<AIAgent, string> = {
  'Dr. Eams': '/api/ai/eams',
  IDARi: '/api/ai/idari',
  'TheBoogieMan.Ai': '/api/ai/boogieman',
};

// ---------------------------------------------------------------------------
// Validation functions
// ---------------------------------------------------------------------------

/**
 * Returns true if the given string is the canonical platform name.
 */
export function isCanonicalPlatformName(name: string): boolean {
  return name === PLATFORM_NAME;
}

/**
 * Returns true if the given string is a rejected (non-canonical) platform name variant.
 */
export function isRejectedPlatformVariant(name: string): boolean {
  return (REJECTED_PLATFORM_VARIANTS as readonly string[]).includes(name);
}

/**
 * Returns true if the given string is a valid Engin control surface name.
 */
export function isValidEnginName(name: string): name is EnginSurface {
  return (ALL_ENGIN_NAMES as readonly string[]).includes(name);
}

/**
 * Returns true if the given string is a rejected Engin name variant.
 */
export function isRejectedEnginName(name: string): boolean {
  return (REJECTED_ENGIN_NAMES as readonly string[]).includes(name);
}

/**
 * Returns true if the given string ends with the canonical 'Engin' suffix
 * (and is therefore a potential control-layer surface name).
 */
export function hasEnginSuffix(name: string): boolean {
  return name.endsWith('Engin');
}

/**
 * Returns true if the given string ends with the rejected 'Engine' suffix.
 */
export function hasEngineSuffix(name: string): boolean {
  return name.endsWith('Engine');
}

/**
 * Returns true if the given string is a valid canonical Daydream domain name.
 */
export function isValidDaydreamDomain(name: string): name is DaydreamDomain {
  return (Object.values(DAYDREAM_DOMAINS) as string[]).includes(name);
}

/**
 * Returns true if the given string is a valid canonical platform module name.
 */
export function isValidModuleName(name: string): name is PlatformModule {
  return (Object.values(PLATFORM_MODULES) as string[]).includes(name);
}

/**
 * Returns true if the given string is a rejected generic module name.
 */
export function isRejectedModuleName(name: string): boolean {
  return (REJECTED_MODULE_NAMES as readonly string[]).includes(name);
}

/**
 * Returns the canonical Engin surface name for a given Daydream domain.
 * Returns undefined if the domain is not canonical.
 */
export function getEnginForDomain(domain: string): EnginSurface | undefined {
  if (!isValidDaydreamDomain(domain)) return undefined;
  return DAYDREAM_TO_ENGIN[domain];
}

/**
 * Validates a proposed name against all naming authority rules.
 * Returns an array of violation strings. Empty array means the name is valid.
 */
export function validateName(name: string): string[] {
  const violations: string[] = [];

  if (isRejectedPlatformVariant(name)) {
    violations.push(
      `"${name}" is a rejected platform name variant. Use "${PLATFORM_NAME}" instead.`
    );
  }

  if (isRejectedEnginName(name)) {
    violations.push(
      `"${name}" is a rejected Engin surface name. Use one of: ${ALL_ENGIN_NAMES.join(', ')}`
    );
  }

  if (hasEngineSuffix(name) && !hasEnginSuffix(name)) {
    violations.push(`"${name}" uses the rejected "Engine" suffix. DREAMengin surfaces use "Engin".`);
  }

  if ((REJECTED_CORE_SURFACE_NAMES as readonly string[]).includes(name)) {
    violations.push(
      `"${name}" is a rejected core surface name. Use canonical names: HomeDream, EditProfileDream, ViewProfile.`
    );
  }

  if (isRejectedModuleName(name)) {
    violations.push(
      `"${name}" is a rejected module name. Use canonical module names: ${Object.values(PLATFORM_MODULES).join(', ')}`
    );
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Complete canonical name registry (for enumeration and export)
// ---------------------------------------------------------------------------

export const ALL_CANONICAL_NAMES = {
  platform: PLATFORM_NAME,
  coreSurfaces: Object.values(CORE_SURFACES),
  daydreamDomains: Object.values(DAYDREAM_DOMAINS),
  enginSurfaces: Object.values(ENGIN_SURFACES),
  platformModules: Object.values(PLATFORM_MODULES),
  aiAgents: Object.values(AI_AGENTS),
} as const;
