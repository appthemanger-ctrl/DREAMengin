// tests/phase7-naming.test.ts
// Phase 7 — Naming Authority validation tests
//
// These tests verify that the canonical-names library correctly identifies
// valid names, rejects invalid names, and enforces the rules defined in
// docs/NAMING_AUTHORITY.md (including the OS-Layer Naming Model extension).

import { describe, it, expect } from 'vitest';
import {
  PLATFORM_NAME,
  PRODUCT_DESCRIPTION,
  REJECTED_PLATFORM_VARIANTS,
  CORE_SURFACES,
  CORE_SURFACE_ROUTES,
  DAYDREAM_DOMAINS,
  ENGIN_SURFACES,
  DAYDREAM_TO_ENGIN,
  ALL_ENGIN_NAMES,
  REJECTED_ENGIN_NAMES,
  PLATFORM_MODULES,
  MODULE_ROUTES,
  AI_AGENTS,
  AI_ROUTES,
  RUNTIME_REGIONS,
  RUNTIME_SEAM_NAMES,
  SURFACE_NAMES,
  DREAM_WINDOW,
  DREAM_WINDOW_STATES,
  DREAM_WINDOW_REQUIRED_FIELDS,
  CONNECTION_VERBS,
  REJECTED_CONNECTION_VERBS,
  REJECTED_OS_TERMS,
  NETWORK_COUNTS,
  isCanonicalPlatformName,
  isRejectedPlatformVariant,
  isValidEnginName,
  isRejectedEnginName,
  hasEnginSuffix,
  hasEngineSuffix,
  isValidDaydreamDomain,
  isValidModuleName,
  isRejectedModuleName,
  getEnginForDomain,
  validateName,
  ALL_CANONICAL_NAMES,
  isRejectedOsTerm,
  isValidDreamWindowState,
  isValidConnectionVerb,
  isRejectedConnectionVerb,
  isValidRuntimeRegion,
  isValidSurfaceName,
} from '@/lib/identity/canonical-names';

// ---------------------------------------------------------------------------
// Platform name
// ---------------------------------------------------------------------------

describe('Platform name authority', () => {
  it('canonical platform name is DREAMengin', () => {
    expect(PLATFORM_NAME).toBe('DREAMengin');
  });

  it('isCanonicalPlatformName returns true only for DREAMengin', () => {
    expect(isCanonicalPlatformName('DREAMengin')).toBe(true);
    expect(isCanonicalPlatformName('DreamEngin')).toBe(false);
    expect(isCanonicalPlatformName('Dreamengin')).toBe(false);
    expect(isCanonicalPlatformName('dreamengin')).toBe(false);
  });

  it('all rejected platform name variants are flagged', () => {
    for (const variant of REJECTED_PLATFORM_VARIANTS) {
      expect(isRejectedPlatformVariant(variant)).toBe(true);
    }
  });

  it('DREAMengin itself is not a rejected variant', () => {
    expect(isRejectedPlatformVariant('DREAMengin')).toBe(false);
  });

  it('rejects known bad platform variants individually', () => {
    expect(isRejectedPlatformVariant('DreamEngin')).toBe(true);
    expect(isRejectedPlatformVariant('Dreamengin')).toBe(true);
    expect(isRejectedPlatformVariant('dreamengin')).toBe(true);
    expect(isRejectedPlatformVariant('DreamEngine')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Core surface names
// ---------------------------------------------------------------------------

describe('Core surface names', () => {
  it('HomeDream is the canonical home surface name', () => {
    expect(CORE_SURFACES.HOME_DREAM).toBe('HomeDream');
  });

  it('Edit ProfileDream is the canonical user-facing profile builder label', () => {
    expect(CORE_SURFACES.EDIT_PROFILE_DREAM_UI).toBe('Edit ProfileDream');
  });

  it('EditProfileDream is the canonical code identifier for the profile builder', () => {
    expect(CORE_SURFACES.EDIT_PROFILE_DREAM_CODE).toBe('EditProfileDream');
  });

  it('View Profile is the canonical user-facing public output label', () => {
    expect(CORE_SURFACES.VIEW_PROFILE_UI).toBe('View Profile');
  });

  it('ViewProfile is the canonical code identifier for the public output', () => {
    expect(CORE_SURFACES.VIEW_PROFILE_CODE).toBe('ViewProfile');
  });

  it('canonical routes are correct', () => {
    expect(CORE_SURFACE_ROUTES.HOME_DREAM).toBe('/homedream');
    expect(CORE_SURFACE_ROUTES.EDIT_PROFILE_DREAM).toBe('/edit-profiledream');
    expect(CORE_SURFACE_ROUTES.VIEW_PROFILE).toBe('/view-profile');
  });
});

// ---------------------------------------------------------------------------
// Daydream domain names (Side A)
// ---------------------------------------------------------------------------

describe('Daydream domain names (Side A)', () => {
  it('six canonical Daydream domains exist', () => {
    expect(Object.keys(DAYDREAM_DOMAINS)).toHaveLength(6);
  });

  it('all six canonical domain names are correct', () => {
    expect(DAYDREAM_DOMAINS.MUSIC).toBe('Music');
    expect(DAYDREAM_DOMAINS.GAMES).toBe('Games');
    expect(DAYDREAM_DOMAINS.LAB).toBe('Lab');
    expect(DAYDREAM_DOMAINS.CODE).toBe('Code');
    expect(DAYDREAM_DOMAINS.BRAND).toBe('Brand');
    expect(DAYDREAM_DOMAINS.CREATE).toBe('Create');
  });

  it('isValidDaydreamDomain returns true for all canonical domains', () => {
    for (const domain of Object.values(DAYDREAM_DOMAINS)) {
      expect(isValidDaydreamDomain(domain)).toBe(true);
    }
  });

  it('isValidDaydreamDomain returns false for non-canonical names', () => {
    expect(isValidDaydreamDomain('music')).toBe(false);
    expect(isValidDaydreamDomain('Analytics')).toBe(false);
    expect(isValidDaydreamDomain('MediaVault')).toBe(false);
    expect(isValidDaydreamDomain('Play')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Engin surface names (Side B) — Rule: only "Engin" suffix, not "Engine"
// ---------------------------------------------------------------------------

describe('Engin control surface names (Side B)', () => {
  it('six canonical Engin surfaces exist', () => {
    expect(ALL_ENGIN_NAMES).toHaveLength(6);
  });

  it('all six canonical Engin names are correct', () => {
    expect(ENGIN_SURFACES.MUSIC).toBe('StarMakerEngin');
    expect(ENGIN_SURFACES.GAMES).toBe('GameEngin');
    expect(ENGIN_SURFACES.LAB).toBe('LabEngin');
    expect(ENGIN_SURFACES.CODE).toBe('CodeEngin');
    expect(ENGIN_SURFACES.BRAND).toBe('BrandingEngin');
    expect(ENGIN_SURFACES.CREATE).toBe('ContentEngin');
  });

  it('all canonical Engin names end with "Engin" suffix (not "Engine")', () => {
    for (const name of ALL_ENGIN_NAMES) {
      expect(hasEnginSuffix(name)).toBe(true);
      expect(hasEngineSuffix(name)).toBe(false);
    }
  });

  it('isValidEnginName returns true for all canonical Engin names', () => {
    for (const name of ALL_ENGIN_NAMES) {
      expect(isValidEnginName(name)).toBe(true);
    }
  });

  it('isValidEnginName returns false for non-canonical names', () => {
    expect(isValidEnginName('StarMakerEngine')).toBe(false);
    expect(isValidEnginName('GameEngine')).toBe(false);
    expect(isValidEnginName('MusicEngin')).toBe(false);
    expect(isValidEnginName('Dreamengin')).toBe(false);
    expect(isValidEnginName('DayDreamengin')).toBe(false);
  });

  it('isRejectedEnginName identifies all rejected variants', () => {
    for (const name of REJECTED_ENGIN_NAMES) {
      expect(isRejectedEnginName(name)).toBe(true);
    }
  });

  it('canonical Engin names are not rejected', () => {
    for (const name of ALL_ENGIN_NAMES) {
      expect(isRejectedEnginName(name)).toBe(false);
    }
  });

  it('rejects Dreamengin, Daydreamengin, DayDreamengin as surface names', () => {
    expect(isRejectedEnginName('Dreamengin')).toBe(true);
    expect(isRejectedEnginName('Daydreamengin')).toBe(true);
    expect(isRejectedEnginName('DayDreamengin')).toBe(true);
  });

  it('Music domain uses StarMakerEngin, not MusicEngin', () => {
    expect(ENGIN_SURFACES.MUSIC).toBe('StarMakerEngin');
    expect(ENGIN_SURFACES.MUSIC).not.toBe('MusicEngin');
  });

  it('Games domain uses GameEngin (no s), not GamesEngin', () => {
    expect(ENGIN_SURFACES.GAMES).toBe('GameEngin');
    expect(ENGIN_SURFACES.GAMES).not.toBe('GamesEngin');
  });

  it('Create domain uses ContentEngin, not CreateEngin', () => {
    expect(ENGIN_SURFACES.CREATE).toBe('ContentEngin');
    expect(ENGIN_SURFACES.CREATE).not.toBe('CreateEngin');
  });
});

// ---------------------------------------------------------------------------
// Daydream → Engin mapping
// ---------------------------------------------------------------------------

describe('Daydream to Engin mapping', () => {
  it('every canonical Daydream maps to a canonical Engin', () => {
    for (const [domain, engin] of Object.entries(DAYDREAM_TO_ENGIN)) {
      expect(isValidDaydreamDomain(domain)).toBe(true);
      expect(isValidEnginName(engin)).toBe(true);
    }
  });

  it('getEnginForDomain returns the correct Engin for each domain', () => {
    expect(getEnginForDomain('Music')).toBe('StarMakerEngin');
    expect(getEnginForDomain('Games')).toBe('GameEngin');
    expect(getEnginForDomain('Lab')).toBe('LabEngin');
    expect(getEnginForDomain('Code')).toBe('CodeEngin');
    expect(getEnginForDomain('Brand')).toBe('BrandingEngin');
    expect(getEnginForDomain('Create')).toBe('ContentEngin');
  });

  it('getEnginForDomain returns undefined for non-canonical domains', () => {
    expect(getEnginForDomain('music')).toBeUndefined();
    expect(getEnginForDomain('Analytics')).toBeUndefined();
    expect(getEnginForDomain('')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Platform module names
// ---------------------------------------------------------------------------

describe('Platform module names', () => {
  it('six canonical platform modules exist', () => {
    expect(Object.keys(PLATFORM_MODULES)).toHaveLength(6);
  });

  it('all canonical module names are correct', () => {
    expect(PLATFORM_MODULES.DREAM_DM).toBe('DreamDM');
    expect(PLATFORM_MODULES.DREAM_DM_BAR).toBe('DreamDM Bar');
    expect(PLATFORM_MODULES.DREAM_MENU).toBe('DreamMenu');
    expect(PLATFORM_MODULES.DREAM_MARKETPLACE).toBe('DreamMarketplace');
    expect(PLATFORM_MODULES.DREAM_SHOP).toBe('DreamShop');
    expect(PLATFORM_MODULES.DREAM_ADS).toBe('DreamAds');
  });

  it('isValidModuleName returns true for canonical module names', () => {
    for (const name of Object.values(PLATFORM_MODULES)) {
      expect(isValidModuleName(name)).toBe(true);
    }
  });

  it('isValidModuleName returns false for generic substitutes', () => {
    expect(isValidModuleName('messages')).toBe(false);
    expect(isValidModuleName('chat')).toBe(false);
    expect(isValidModuleName('shop')).toBe(false);
    expect(isValidModuleName('marketplace')).toBe(false);
    expect(isValidModuleName('nav')).toBe(false);
  });

  it('isRejectedModuleName identifies all rejected generic names', () => {
    const rejected = ['messages', 'chat', 'inbox', 'nav', 'sidebar', 'hamburger', 'marketplace', 'shop', 'store', 'promotions', 'ads'];
    for (const name of rejected) {
      expect(isRejectedModuleName(name)).toBe(true);
    }
  });

  it('canonical module names are not rejected', () => {
    for (const name of Object.values(PLATFORM_MODULES)) {
      expect(isRejectedModuleName(name)).toBe(false);
    }
  });

  it('module routes are correct', () => {
    expect(MODULE_ROUTES['DreamDM']).toBe('/messages');
    expect(MODULE_ROUTES['DreamMarketplace']).toBe('/marketplace');
    expect(MODULE_ROUTES['DreamShop']).toBe('/shop');
    expect(MODULE_ROUTES['DreamAds']).toBe('/ads');
  });
});

// ---------------------------------------------------------------------------
// AI agent names
// ---------------------------------------------------------------------------

describe('AI agent names', () => {
  it('three AI agents exist', () => {
    expect(Object.keys(AI_AGENTS)).toHaveLength(3);
  });

  it('canonical AI agent names are correct', () => {
    expect(AI_AGENTS.DR_EAMS).toBe('Dr. Eams');
    expect(AI_AGENTS.IDARI).toBe('IDARi');
    expect(AI_AGENTS.THE_BOOGIEMAN).toBe('TheBoogieMan.Ai');
  });

  it('AI agent routes are correct', () => {
    expect(AI_ROUTES['Dr. Eams']).toBe('/api/ai/eams');
    expect(AI_ROUTES['IDARi']).toBe('/api/ai/idari');
    expect(AI_ROUTES['TheBoogieMan.Ai']).toBe('/api/ai/boogieman');
  });
});

// ---------------------------------------------------------------------------
// validateName — combined violation checker
// ---------------------------------------------------------------------------

describe('validateName — naming authority validator', () => {
  it('returns no violations for a fresh unrelated name', () => {
    expect(validateName('MyNewThing')).toHaveLength(0);
  });

  it('returns a violation for a rejected platform variant', () => {
    const violations = validateName('DreamEngin');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]).toMatch(/DreamEngin/);
  });

  it('returns a violation for a rejected Engin name', () => {
    const violations = validateName('GameEngine');
    expect(violations.length).toBeGreaterThan(0);
  });

  it('returns a violation for a name with the Engine suffix', () => {
    const violations = validateName('StarMakerEngine');
    expect(violations.length).toBeGreaterThan(0);
  });

  it('returns a violation for a rejected core surface name', () => {
    const violations = validateName('dashboard');
    expect(violations.length).toBeGreaterThan(0);
  });

  it('returns a violation for a rejected module name', () => {
    const violations = validateName('messages');
    expect(violations.length).toBeGreaterThan(0);
  });

  it('returns no violations for each canonical Engin name', () => {
    for (const name of ALL_ENGIN_NAMES) {
      expect(validateName(name)).toHaveLength(0);
    }
  });
});

// ---------------------------------------------------------------------------
// ALL_CANONICAL_NAMES — completeness check
// ---------------------------------------------------------------------------

describe('ALL_CANONICAL_NAMES registry', () => {
  it('platform entry is DREAMengin', () => {
    expect(ALL_CANONICAL_NAMES.platform).toBe('DREAMengin');
  });

  it('registry includes 6 Daydream domain names', () => {
    expect(ALL_CANONICAL_NAMES.daydreamDomains).toHaveLength(6);
  });

  it('registry includes 6 Engin surface names', () => {
    expect(ALL_CANONICAL_NAMES.enginSurfaces).toHaveLength(6);
  });

  it('registry includes 6 platform module names', () => {
    expect(ALL_CANONICAL_NAMES.platformModules).toHaveLength(6);
  });

  it('registry includes 3 AI agent names', () => {
    expect(ALL_CANONICAL_NAMES.aiAgents).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// OS-Layer: product description
// ---------------------------------------------------------------------------

describe('OS-layer product description', () => {
  it('canonical product description contains "dual-runtime"', () => {
    expect(PRODUCT_DESCRIPTION).toContain('dual-runtime');
  });

  it('canonical product description contains "spatial operating environment"', () => {
    expect(PRODUCT_DESCRIPTION).toContain('spatial operating environment');
  });

  it('registry exposes the product description', () => {
    expect(ALL_CANONICAL_NAMES.productDescription).toBe(PRODUCT_DESCRIPTION);
  });
});

// ---------------------------------------------------------------------------
// OS-Layer: runtime regions
// ---------------------------------------------------------------------------

describe('Runtime regions', () => {
  it('Surface Space is the upper active runtime region', () => {
    expect(RUNTIME_REGIONS.SURFACE_SPACE).toBe('Surface Space');
  });

  it('DreamSpace is the lower modular runtime region', () => {
    expect(RUNTIME_REGIONS.DREAM_SPACE).toBe('DreamSpace');
  });

  it('isValidRuntimeRegion returns true for canonical regions', () => {
    expect(isValidRuntimeRegion('Surface Space')).toBe(true);
    expect(isValidRuntimeRegion('DreamSpace')).toBe(true);
  });

  it('isValidRuntimeRegion returns false for non-canonical names', () => {
    expect(isValidRuntimeRegion('dreamspace')).toBe(false);
    expect(isValidRuntimeRegion('widget layer')).toBe(false);
    expect(isValidRuntimeRegion('bottom panel')).toBe(false);
  });

  it('DreamDM Bar is a canonical Runtime Seam name', () => {
    expect(RUNTIME_SEAM_NAMES).toContain('DreamDM Bar');
  });

  it('Runtime Seam names include all four canonical forms', () => {
    expect(RUNTIME_SEAM_NAMES).toContain('Persistent Interaction Rail');
    expect(RUNTIME_SEAM_NAMES).toContain('Persistent Spatial Divider');
    expect(RUNTIME_SEAM_NAMES).toContain('Runtime Seam');
  });

  it('registry includes 2 runtime regions', () => {
    expect(ALL_CANONICAL_NAMES.runtimeRegions).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// OS-Layer: Surface names (with "Surface" suffix)
// ---------------------------------------------------------------------------

describe('Canonical Surface names', () => {
  it('HomeDream Surface is the canonical main surface name', () => {
    expect(SURFACE_NAMES.HOME_DREAM_SURFACE).toBe('HomeDream Surface');
  });

  it('all six Daydream Surface names are present', () => {
    expect(SURFACE_NAMES.MUSIC_DAYDREAM_SURFACE).toBe('Music Daydream Surface');
    expect(SURFACE_NAMES.GAMES_DAYDREAM_SURFACE).toBe('Games Daydream Surface');
    expect(SURFACE_NAMES.LAB_DAYDREAM_SURFACE).toBe('Lab Daydream Surface');
    expect(SURFACE_NAMES.CODE_DAYDREAM_SURFACE).toBe('Code Daydream Surface');
    expect(SURFACE_NAMES.BRAND_DAYDREAM_SURFACE).toBe('Brand Daydream Surface');
    expect(SURFACE_NAMES.CREATE_DAYDREAM_SURFACE).toBe('Create Daydream Surface');
  });

  it('platform module surfaces are present', () => {
    expect(SURFACE_NAMES.DREAM_DM_SURFACE).toBe('DreamDM Surface');
    expect(SURFACE_NAMES.DREAM_SHOP_SURFACE).toBe('DreamShop Surface');
    expect(SURFACE_NAMES.DREAM_MARKETPLACE_SURFACE).toBe('DreamMarketplace Surface');
    expect(SURFACE_NAMES.DREAM_ADS_SURFACE).toBe('DreamAds Surface');
  });

  it('isValidSurfaceName returns true for canonical surface names', () => {
    for (const name of Object.values(SURFACE_NAMES)) {
      expect(isValidSurfaceName(name)).toBe(true);
    }
  });

  it('isValidSurfaceName returns false for non-canonical names', () => {
    expect(isValidSurfaceName('HomeDream')).toBe(false);
    expect(isValidSurfaceName('dashboard')).toBe(false);
    expect(isValidSurfaceName('Music page')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// OS-Layer: Dream Windows
// ---------------------------------------------------------------------------

describe('Dream Windows (modular runtime containers)', () => {
  it('canonical term for modular runtime containers is Dream Window', () => {
    expect(DREAM_WINDOW).toBe('Dream Window');
  });

  it('four Dream Window states exist', () => {
    expect(Object.keys(DREAM_WINDOW_STATES)).toHaveLength(4);
  });

  it('all Dream Window states are correct', () => {
    expect(DREAM_WINDOW_STATES.UNBOUND).toBe('Unbound Dream Window');
    expect(DREAM_WINDOW_STATES.BOUND).toBe('Bound Dream Window');
    expect(DREAM_WINDOW_STATES.MOUNTED).toBe('Mounted Dream Window');
    expect(DREAM_WINDOW_STATES.COLLAPSED).toBe('Collapsed Dream Window');
  });

  it('isValidDreamWindowState returns true for all canonical states', () => {
    for (const state of Object.values(DREAM_WINDOW_STATES)) {
      expect(isValidDreamWindowState(state)).toBe(true);
    }
  });

  it('isValidDreamWindowState returns false for non-canonical names', () => {
    expect(isValidDreamWindowState('widget')).toBe(false);
    expect(isValidDreamWindowState('card')).toBe(false);
    expect(isValidDreamWindowState('Dream Window')).toBe(false);
  });

  it('Dream Window has 10 required fields', () => {
    expect(DREAM_WINDOW_REQUIRED_FIELDS).toHaveLength(10);
  });

  it('Dream Window required fields include id, type, owner, and activeState', () => {
    expect(DREAM_WINDOW_REQUIRED_FIELDS).toContain('id');
    expect(DREAM_WINDOW_REQUIRED_FIELDS).toContain('type');
    expect(DREAM_WINDOW_REQUIRED_FIELDS).toContain('owner');
    expect(DREAM_WINDOW_REQUIRED_FIELDS).toContain('activeState');
  });

  it('registry includes 4 Dream Window states', () => {
    expect(ALL_CANONICAL_NAMES.dreamWindowStates).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// OS-Layer: connection language
// ---------------------------------------------------------------------------

describe('Connection language', () => {
  it('seven canonical connection verbs exist', () => {
    expect(CONNECTION_VERBS).toHaveLength(7);
  });

  it('bind, mount, and activate are canonical connection verbs', () => {
    expect(CONNECTION_VERBS).toContain('bind');
    expect(CONNECTION_VERBS).toContain('mount');
    expect(CONNECTION_VERBS).toContain('activate');
  });

  it('attach, route into, open into, connect across are canonical verbs', () => {
    expect(CONNECTION_VERBS).toContain('attach');
    expect(CONNECTION_VERBS).toContain('route into');
    expect(CONNECTION_VERBS).toContain('open into');
    expect(CONNECTION_VERBS).toContain('connect across');
  });

  it('isValidConnectionVerb returns true for canonical verbs', () => {
    for (const verb of CONNECTION_VERBS) {
      expect(isValidConnectionVerb(verb)).toBe(true);
    }
  });

  it('four rejected connection verbs exist', () => {
    expect(REJECTED_CONNECTION_VERBS).toHaveLength(4);
  });

  it('link widget, open page, go to tab, launch card are rejected', () => {
    expect(REJECTED_CONNECTION_VERBS).toContain('link widget');
    expect(REJECTED_CONNECTION_VERBS).toContain('open page');
    expect(REJECTED_CONNECTION_VERBS).toContain('go to tab');
    expect(REJECTED_CONNECTION_VERBS).toContain('launch card');
  });

  it('isRejectedConnectionVerb identifies all rejected verbs', () => {
    for (const verb of REJECTED_CONNECTION_VERBS) {
      expect(isRejectedConnectionVerb(verb)).toBe(true);
    }
  });

  it('canonical verbs are not rejected', () => {
    for (const verb of CONNECTION_VERBS) {
      expect(isRejectedConnectionVerb(verb)).toBe(false);
    }
  });

  it('registry includes 7 connection verbs', () => {
    expect(ALL_CANONICAL_NAMES.connectionVerbs).toHaveLength(7);
  });
});

// ---------------------------------------------------------------------------
// OS-Layer: rejected UI terms
// ---------------------------------------------------------------------------

describe('Rejected OS-layer UI terms', () => {
  it('isRejectedOsTerm returns true for all rejected OS terms', () => {
    for (const term of REJECTED_OS_TERMS) {
      expect(isRejectedOsTerm(term)).toBe(true);
    }
  });

  it('"app" is a rejected OS term', () => {
    expect(isRejectedOsTerm('app')).toBe(true);
  });

  it('"page" is a rejected OS term', () => {
    expect(isRejectedOsTerm('page')).toBe(true);
  });

  it('"widget" is a rejected OS term', () => {
    expect(isRejectedOsTerm('widget')).toBe(true);
  });

  it('"dashboard" is a rejected OS term', () => {
    expect(isRejectedOsTerm('dashboard')).toBe(true);
  });

  it('"card" is a rejected OS term', () => {
    expect(isRejectedOsTerm('card')).toBe(true);
  });

  it('"tab navigation" is a rejected OS term', () => {
    expect(isRejectedOsTerm('tab navigation')).toBe(true);
  });

  it('validateName reports a violation for rejected OS terms', () => {
    const violations = validateName('dashboard');
    expect(violations.length).toBeGreaterThan(0);
  });

  it('validateName reports a violation for "widget"', () => {
    const violations = validateName('widget');
    expect(violations.length).toBeGreaterThan(0);
  });

  it('canonical names are not rejected OS terms', () => {
    expect(isRejectedOsTerm('Dream Window')).toBe(false);
    expect(isRejectedOsTerm('Surface Space')).toBe(false);
    expect(isRejectedOsTerm('DreamSpace')).toBe(false);
    expect(isRejectedOsTerm('HomeDream Surface')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// OS-Layer: multi-surface connection network counts
// ---------------------------------------------------------------------------

describe('Multi-surface connection network', () => {
  it('there are 6 Daydream Surfaces in the network', () => {
    expect(NETWORK_COUNTS.DAYDREAM_SURFACES).toBe(6);
  });

  it('there are 6 Engin runtimes in the network', () => {
    expect(NETWORK_COUNTS.ENGIN_RUNTIMES).toBe(6);
  });

  it('there are 11 named connection paths', () => {
    expect(NETWORK_COUNTS.CONNECTION_PATHS).toBe(11);
  });

  it('Daydream surface count matches number of DAYDREAM_DOMAINS', () => {
    expect(Object.keys(DAYDREAM_DOMAINS)).toHaveLength(NETWORK_COUNTS.DAYDREAM_SURFACES);
  });

  it('Engin runtime count matches number of ENGIN_SURFACES', () => {
    expect(Object.keys(ENGIN_SURFACES)).toHaveLength(NETWORK_COUNTS.ENGIN_RUNTIMES);
  });
});
