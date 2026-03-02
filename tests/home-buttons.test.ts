import { describe, expect, it } from 'vitest';

import {
  applyAction,
  closeAllMenus,
  openBothMenus,
  openMenu,
  resolveHomeTap,
  type MenuState,
} from '@/lib/home-buttons/home-buttons-state';

// SPEC.md §3.1 (v2.0) governs this behavior.

describe('resolveHomeTap – LOCKED MODE', () => {
  it('single tap → open-both-menus (Daydreams + System side-by-side)', () => {
    expect(resolveHomeTap('locked', 'single', 'dreams')).toEqual({ type: 'open-both-menus' });
    expect(resolveHomeTap('locked', 'single', 'system')).toEqual({ type: 'open-both-menus' });
  });

  it('double tap → enter-nav-mode (unlock to saved corners)', () => {
    expect(resolveHomeTap('locked', 'double', 'dreams')).toEqual({ type: 'enter-nav-mode' });
    expect(resolveHomeTap('locked', 'double', 'system')).toEqual({ type: 'enter-nav-mode' });
  });
});

describe('resolveHomeTap – NAV MODE', () => {
  it('single tap → go-home (reset anchor)', () => {
    expect(resolveHomeTap('nav', 'single', 'dreams')).toEqual({ type: 'go-home' });
    expect(resolveHomeTap('nav', 'single', 'system')).toEqual({ type: 'go-home' });
  });

  it('double tap dreams → open-dreams-menu', () => {
    expect(resolveHomeTap('nav', 'double', 'dreams')).toEqual({ type: 'open-dreams-menu' });
  });

  it('double tap system → open-system-menu', () => {
    expect(resolveHomeTap('nav', 'double', 'system')).toEqual({ type: 'open-system-menu' });
  });
});

describe('applyAction – mode transitions', () => {
  it('enter-nav-mode sets mode to nav', () => {
    expect(applyAction('locked', { type: 'enter-nav-mode' })).toBe('nav');
  });

  it('exit-nav-mode sets mode to locked', () => {
    expect(applyAction('nav', { type: 'exit-nav-mode' })).toBe('locked');
  });

  it('go-home does not change mode', () => {
    expect(applyAction('nav', { type: 'go-home' })).toBe('nav');
  });

  it('open-both-menus does not change mode', () => {
    expect(applyAction('locked', { type: 'open-both-menus' })).toBe('locked');
  });

  it('open-dreams-menu does not change mode', () => {
    expect(applyAction('nav', { type: 'open-dreams-menu' })).toBe('nav');
  });

  it('open-system-menu does not change mode', () => {
    expect(applyAction('nav', { type: 'open-system-menu' })).toBe('nav');
  });
});

describe('menu helpers', () => {
  it('openBothMenus opens both simultaneously', () => {
    expect(openBothMenus()).toEqual({ dreamsOpen: true, systemOpen: true });
  });

  it('openMenu dreams is exclusive', () => {
    const prev: MenuState = { dreamsOpen: false, systemOpen: true };
    expect(openMenu(prev, 'dreams')).toEqual({ dreamsOpen: true, systemOpen: false });
  });

  it('openMenu system is exclusive', () => {
    const prev: MenuState = { dreamsOpen: true, systemOpen: false };
    expect(openMenu(prev, 'system')).toEqual({ dreamsOpen: false, systemOpen: true });
  });

  it('closeAllMenus closes both', () => {
    expect(closeAllMenus()).toEqual({ dreamsOpen: false, systemOpen: false });
  });
});

describe('integration: locked → open both → unlock → go home → open specific', () => {
  it('follows the SPEC §3.1 interaction sequence', () => {
    let mode = 'locked' as const;
    let menus: MenuState = { dreamsOpen: false, systemOpen: false };

    // Locked: single tap → both menus open
    const a1 = resolveHomeTap(mode, 'single', 'dreams');
    expect(a1).toEqual({ type: 'open-both-menus' });
    menus = openBothMenus();
    expect(menus).toEqual({ dreamsOpen: true, systemOpen: true });

    // Locked: double tap → enter nav mode
    const a2 = resolveHomeTap(mode, 'double', 'dreams');
    expect(a2).toEqual({ type: 'enter-nav-mode' });
    mode = applyAction(mode, a2) as typeof mode;
    menus = closeAllMenus();
    expect(mode).toBe('nav');

    // Nav mode: single tap → go home
    const a3 = resolveHomeTap(mode, 'single', 'system');
    expect(a3).toEqual({ type: 'go-home' });

    // Nav mode: double tap dreams → open dreams menu only
    const a4 = resolveHomeTap(mode, 'double', 'dreams');
    expect(a4).toEqual({ type: 'open-dreams-menu' });
    menus = openMenu(menus, 'dreams');
    expect(menus).toEqual({ dreamsOpen: true, systemOpen: false });

    // Nav mode: double tap system → open system menu only
    const a5 = resolveHomeTap(mode, 'double', 'system');
    expect(a5).toEqual({ type: 'open-system-menu' });
    menus = openMenu(menus, 'system');
    expect(menus).toEqual({ dreamsOpen: false, systemOpen: true });
  });
});
