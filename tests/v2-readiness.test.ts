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

// ---------------------------------------------------------------------------
// Legacy route subordination — competing shells removed
// ---------------------------------------------------------------------------

describe('DREAMengin v2.0.0 — legacy route subordination', () => {
  it('/dreamengin page redirects to /homedream (orbit shell removed as active route)', () => {
    const page = readFileSync(resolve(__dirname, '../app/dreamengin/page.tsx'), 'utf8');
    expect(page).toContain("redirect('/homedream')");
    // Must not import or render the old Babylon orbit shell
    expect(page).not.toContain("import DreamenginClient");
    expect(page).not.toContain("import DreamenginApp");
    expect(page).not.toContain('<DreamenginClient');
    expect(page).not.toContain('<DreamenginApp');
  });

  it('/codespace page redirects to /daydream/code (canonical Code Daydream)', () => {
    const page = readFileSync(resolve(__dirname, '../app/codespace/page.tsx'), 'utf8');
    expect(page).toContain("redirect('/daydream/code')");
    expect(page).not.toContain('import CodeSpaceClient');
    expect(page).not.toContain('<CodeSpaceClient');
  });

  it('/physics-lab page redirects to /daydream/lab (canonical Lab Daydream)', () => {
    const page = readFileSync(resolve(__dirname, '../app/physics-lab/page.tsx'), 'utf8');
    expect(page).toContain("redirect('/daydream/lab')");
    expect(page).not.toContain('import PhysicsLab');
    expect(page).not.toContain('<PhysicsLab');
  });
});

// ---------------------------------------------------------------------------
// DreamDMBar — canonical routing (no legacy shell refs)
// ---------------------------------------------------------------------------

describe('DREAMengin v2.0.0 — DreamDMBar routing clean', () => {
  const bar = readFileSync(
    resolve(__dirname, '../components/messaging/DreamDMBar.tsx'),
    'utf8',
  );

  it('DreamDMBar does not route to /dreamengin', () => {
    expect(bar).not.toContain('/dreamengin?q=');
    expect(bar).not.toContain("href = `/dreamengin");
  });

  it('DreamDMBar does not route to /codespace', () => {
    expect(bar).not.toContain('/codespace?snippet=');
    expect(bar).not.toContain("href = `/codespace");
  });

  it('DreamDMBar does not route to legacy /music route', () => {
    expect(bar).not.toContain('/music?prompt=');
  });
});

// ---------------------------------------------------------------------------
// Onboarding flow — new users see onboarding
// ---------------------------------------------------------------------------

describe('DREAMengin v2.0.0 — onboarding flow', () => {
  it('/join redirects new email signups to /onboarding (not /homedream)', () => {
    const join = readFileSync(resolve(__dirname, '../app/join/page.tsx'), 'utf8');
    expect(join).toContain('/onboarding');
    // The router.replace after signup must go to onboarding
    expect(join).toContain('router.replace("/onboarding")');
  });

  it('/join OAuth redirects new users to /auth/callback?next=/onboarding', () => {
    const join = readFileSync(resolve(__dirname, '../app/join/page.tsx'), 'utf8');
    expect(join).toContain('next=/onboarding');
  });

  it('/login only starts OAuth when the provider probe returns true', () => {
    const login = readFileSync(resolve(__dirname, '../app/login/page.tsx'), 'utf8');
    expect(login).toContain('oauthProviders?.[provider] !== true');
    expect(login).toContain('disabled={busy || oauthProviders?.google !== true}');
  });

  it('/join only starts OAuth when the provider probe returns true', () => {
    const join = readFileSync(resolve(__dirname, '../app/join/page.tsx'), 'utf8');
    expect(join).toContain('oauthProviders?.[provider] !== true');
    expect(join).toContain('disabled={busy || oauthProviders?.google !== true}');
  });
});

// ---------------------------------------------------------------------------
// Build enforcement — adari.ts canonical REQUIRED_PATHS
// ---------------------------------------------------------------------------

describe('DREAMengin v2.0.0 — build enforcement updated', () => {
  it('lib/adari.ts does not require legacy WheelLayout', () => {
    const adari = readFileSync(resolve(__dirname, '../lib/adari.ts'), 'utf8');
    expect(adari).not.toContain('WheelLayout.tsx');
  });

  it('lib/adari.ts does not require legacy WidgetEngine', () => {
    const adari = readFileSync(resolve(__dirname, '../lib/adari.ts'), 'utf8');
    expect(adari).not.toContain('WidgetEngine.tsx');
  });

  it('lib/adari.ts requires v2 canonical types/dream-window.ts', () => {
    const adari = readFileSync(resolve(__dirname, '../lib/adari.ts'), 'utf8');
    expect(adari).toContain('types/dream-window.ts');
  });

  it('lib/adari.ts requires v2 lib/identity/canonical-names.ts', () => {
    const adari = readFileSync(resolve(__dirname, '../lib/adari.ts'), 'utf8');
    expect(adari).toContain('lib/identity/canonical-names.ts');
  });

  it('scripts/postbuild.js does not require legacy WheelLayout', () => {
    const postbuild = readFileSync(resolve(__dirname, '../scripts/postbuild.js'), 'utf8');
    expect(postbuild).not.toContain('WheelLayout.tsx');
  });

  it('scripts/postbuild.js requires v2 canonical files', () => {
    const postbuild = readFileSync(resolve(__dirname, '../scripts/postbuild.js'), 'utf8');
    expect(postbuild).toContain('types/dream-window.ts');
    expect(postbuild).toContain('lib/identity/canonical-names.ts');
  });
});

// ---------------------------------------------------------------------------
// WorkspaceDashboard — canonical surface names in UI
// ---------------------------------------------------------------------------

describe('DREAMengin v2.0.0 — WorkspaceDashboard surface labels', () => {
  const dashboard = readFileSync(
    resolve(__dirname, '../components/home/WorkspaceDashboard.tsx'),
    'utf8',
  );

  it('WorkspaceDashboard does not use confusing "Your Dreams" label for view-profile', () => {
    // "Your Dreams" was misleading — should be "View Profile" per LAW.md
    expect(dashboard).not.toContain("label: 'Your Dreams'");
    expect(dashboard).not.toContain('label: "Your Dreams"');
  });

  it('WorkspaceDashboard uses canonical "View Profile" label', () => {
    expect(dashboard).toContain('View Profile');
  });

  it('WorkspaceDashboard uses canonical "Edit ProfileDream" label', () => {
    expect(dashboard).toContain('Edit ProfileDream');
  });
});
