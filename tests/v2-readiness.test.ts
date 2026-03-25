// tests/v2-readiness.test.ts
// v2.0.0 Readiness validation tests
//
// Validates that all v2.0.0 structural requirements are met:
// - Version constants are declared and correct
// - v1-ui CSS classes are no longer used by active surfaces (canonical classes used instead)
// - Canonical naming authority is in place

import { describe, it, expect } from 'vitest';
import {
  PLATFORM_NAME,
  PRODUCT_VERSION,
  CORE_SURFACE_ROUTES,
  LEGACY_ROUTES,
} from '@/lib/identity/canonical-names';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ---------------------------------------------------------------------------
// Version
// ---------------------------------------------------------------------------

describe('DREAMengin v2.0.0 — version declaration', () => {
  it('canonical-names exports PRODUCT_VERSION as 2.0.0', () => {
    expect(PRODUCT_VERSION).toBe('2.0.0');
  });

  it('package.json version is 2.0.0', () => {
    const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'));
    expect(pkg.version).toBe('2.0.0');
  });

  it('PLATFORM_NAME is DREAMengin', () => {
    expect(PLATFORM_NAME).toBe('DREAMengin');
  });
});

// ---------------------------------------------------------------------------
// v1-ui subordination
// ---------------------------------------------------------------------------

describe('DREAMengin v2.0.0 — v1-ui layer subordinated', () => {
  it('global layout.tsx does not import v1-ui CSS', () => {
    const layout = readFileSync(resolve(__dirname, '../app/layout.tsx'), 'utf8');
    expect(layout).not.toContain('v1-ui/widget-feed-screen');
  });

  it('HomeDream.tsx does not import v1-ui CSS', () => {
    const homedream = readFileSync(
      resolve(__dirname, '../components/home/HomeDream.tsx'),
      'utf8',
    );
    expect(homedream).not.toContain('v1-ui/widget-feed-screen');
  });

  it('HomeDream.tsx uses dream-rail class (not widget-rail)', () => {
    const homedream = readFileSync(
      resolve(__dirname, '../components/home/HomeDream.tsx'),
      'utf8',
    );
    expect(homedream).toContain('dream-rail');
    expect(homedream).not.toContain('"widget-rail');
    expect(homedream).not.toContain("'widget-rail");
  });

  it('HomeDream.tsx uses dream-rail-icon class (not widget-icon)', () => {
    const homedream = readFileSync(
      resolve(__dirname, '../components/home/HomeDream.tsx'),
      'utf8',
    );
    expect(homedream).toContain('dream-rail-icon');
    expect(homedream).not.toContain('"widget-icon');
    expect(homedream).not.toContain("'widget-icon");
  });

  it('home-dream.css defines dream-rail class', () => {
    const css = readFileSync(resolve(__dirname, '../styles/home-dream.css'), 'utf8');
    expect(css).toContain('.dream-rail');
    expect(css).toContain('.dream-rail-icon');
    expect(css).toContain('.dream-feed-transition');
  });
});

// ---------------------------------------------------------------------------
// Canonical routing
// ---------------------------------------------------------------------------

describe('DREAMengin v2.0.0 — canonical routes', () => {
  it('HomeDream canonical route is /homedream', () => {
    expect(CORE_SURFACE_ROUTES.HOME_DREAM).toBe('/homedream');
  });

  it('EditProfileDream canonical route is /edit-profiledream', () => {
    expect(CORE_SURFACE_ROUTES.EDIT_PROFILE_DREAM).toBe('/edit-profiledream');
  });

  it('ViewProfile canonical route is /view-profile', () => {
    expect(CORE_SURFACE_ROUTES.VIEW_PROFILE).toBe('/view-profile');
  });

  it('legacy /edit-profile route redirects to canonical (support route exists as stub)', () => {
    const editProfilePage = readFileSync(
      resolve(__dirname, '../app/edit-profile/page.tsx'),
      'utf8',
    );
    expect(editProfilePage).toContain('/edit-profiledream');
    expect(editProfilePage).toContain('redirect');
  });

  it('legacy /home route is registered as a support route in canonical-names', () => {
    expect(LEGACY_ROUTES.HOME).toBe('/home');
  });
});

// ---------------------------------------------------------------------------
// CHANGELOG presence
// ---------------------------------------------------------------------------

describe('DREAMengin v2.0.0 — release documentation', () => {
  it('CHANGELOG.md exists and documents 2.0.0', () => {
    const changelog = readFileSync(resolve(__dirname, '../CHANGELOG.md'), 'utf8');
    expect(changelog).toContain('[2.0.0]');
    expect(changelog).toContain('One Product');
  });
});
