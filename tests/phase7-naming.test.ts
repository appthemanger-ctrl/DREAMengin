// tests/phase7-naming.test.ts
// Phase 7 — Naming Authority validation tests
//
// These tests verify that the canonical-names library correctly identifies
// valid names, rejects invalid names, and enforces the rules defined in
// docs/NAMING_AUTHORITY.md.

import { describe, it, expect } from 'vitest';
import {
  PLATFORM_NAME,
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
