import { describe, expect, it } from 'vitest';

import {
  applyAction,
  closeAllMenus,
  openMenu,
  resolveHomeTap,
  type MenuState,
} from '@/lib/home-buttons/home-buttons-state';

// SPEC.md §3.1 (v2.1) governs this behavior — single blue Dreams button.

describe('resolveHomeTap – LOCKED MODE', () => {
  it('single tap → open-dreams-menu', () => {
    expect(resolveHomeTap('locked', 'single')).toEqual({ type: 'open-dreams-menu' });
  });

  it('double tap → enter-nav-mode (unlock to saved corner)', () => {
    expect(resolveHomeTap('locked', 'double')).toEqual({ type: 'enter-nav-mode' });
  });
});

describe('resolveHomeTap – NAV MODE', () => {
  it('single tap → go-home (reset anchor)', () => {
    expect(resolveHomeTap('nav', 'single')).toEqual({ type: 'go-home' });
  });

  it('double tap → open-system-menu', () => {
    expect(resolveHomeTap('nav', 'double')).toEqual({ type: 'open-system-menu' });
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

  it('open-dreams-menu does not change mode', () => {
    expect(applyAction('locked', { type: 'open-dreams-menu' })).toBe('locked');
  });

  it('open-system-menu does not change mode', () => {
    expect(applyAction('nav', { type: 'open-system-menu' })).toBe('nav');
  });
});

describe('menu helpers', () => {
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

describe('integration: locked → open dreams → unlock → go home → open system', () => {
  it('follows the SPEC §3.1 interaction sequence', () => {
    let mode = 'locked' as const;
    let menus: MenuState = { dreamsOpen: false, systemOpen: false };

    // Locked: single tap → open dreams menu
    const a1 = resolveHomeTap(mode, 'single');
    expect(a1).toEqual({ type: 'open-dreams-menu' });
    menus = openMenu(menus, 'dreams');
    expect(menus).toEqual({ dreamsOpen: true, systemOpen: false });

    // Locked: double tap → enter nav mode
    const a2 = resolveHomeTap(mode, 'double');
    expect(a2).toEqual({ type: 'enter-nav-mode' });
    mode = applyAction(mode, a2) as typeof mode;
    menus = closeAllMenus();
    expect(mode).toBe('nav');

    // Nav mode: single tap → go home
    const a3 = resolveHomeTap(mode, 'single');
    expect(a3).toEqual({ type: 'go-home' });

    // Nav mode: double tap → open system menu
    const a4 = resolveHomeTap(mode, 'double');
    expect(a4).toEqual({ type: 'open-system-menu' });
    menus = openMenu(menus, 'system');
    expect(menus).toEqual({ dreamsOpen: false, systemOpen: true });
  });
});
