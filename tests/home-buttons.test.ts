import { describe, expect, it } from 'vitest';

import {
  applyAction,
  closeAllMenus,
  openMenu,
  resolveHomeTap,
  type MenuState,
} from '@/lib/home-buttons/home-buttons-state';

describe('resolveHomeTap – LOCKED HOME MODE', () => {
  it('single tap → go-home', () => {
    expect(resolveHomeTap('locked', 'single', 'dreams')).toEqual({ type: 'go-home' });
    expect(resolveHomeTap('locked', 'single', 'system')).toEqual({ type: 'go-home' });
  });

  it('double tap → enter-nav-mode', () => {
    expect(resolveHomeTap('locked', 'double', 'dreams')).toEqual({ type: 'enter-nav-mode' });
    expect(resolveHomeTap('locked', 'double', 'system')).toEqual({ type: 'enter-nav-mode' });
  });
});

describe('resolveHomeTap – NAV MODE', () => {
  it('single tap dreams → open-dreams-menu', () => {
    expect(resolveHomeTap('nav', 'single', 'dreams')).toEqual({ type: 'open-dreams-menu' });
  });

  it('single tap system → open-system-menu', () => {
    expect(resolveHomeTap('nav', 'single', 'system')).toEqual({ type: 'open-system-menu' });
  });

  it('double tap either button → exit-nav-mode', () => {
    expect(resolveHomeTap('nav', 'double', 'dreams')).toEqual({ type: 'exit-nav-mode' });
    expect(resolveHomeTap('nav', 'double', 'system')).toEqual({ type: 'exit-nav-mode' });
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
    expect(applyAction('locked', { type: 'go-home' })).toBe('locked');
  });

  it('open-dreams-menu does not change mode', () => {
    expect(applyAction('nav', { type: 'open-dreams-menu' })).toBe('nav');
  });

  it('open-system-menu does not change mode', () => {
    expect(applyAction('nav', { type: 'open-system-menu' })).toBe('nav');
  });
});

describe('menu exclusivity', () => {
  it('opening dreams closes system', () => {
    const prev: MenuState = { dreamsOpen: false, systemOpen: true };
    const next = openMenu(prev, 'dreams');
    expect(next).toEqual({ dreamsOpen: true, systemOpen: false });
  });

  it('opening system closes dreams', () => {
    const prev: MenuState = { dreamsOpen: true, systemOpen: false };
    const next = openMenu(prev, 'system');
    expect(next).toEqual({ dreamsOpen: false, systemOpen: true });
  });

  it('closeAllMenus closes both', () => {
    expect(closeAllMenus()).toEqual({ dreamsOpen: false, systemOpen: false });
  });
});

describe('integration: lock → open system menu → open daydream menu → unlock', () => {
  it('follows the expected state sequence', () => {
    // Start locked
    let mode = 'locked' as const;
    let menus: MenuState = { dreamsOpen: false, systemOpen: false };

    // Double tap → enter NAV MODE
    const action1 = resolveHomeTap(mode, 'double', 'dreams');
    expect(action1).toEqual({ type: 'enter-nav-mode' });
    mode = applyAction(mode, action1) as typeof mode;
    expect(mode).toBe('nav');

    // Single tap system → open system menu
    const action2 = resolveHomeTap(mode, 'single', 'system');
    expect(action2).toEqual({ type: 'open-system-menu' });
    menus = openMenu(menus, 'system');
    expect(menus).toEqual({ dreamsOpen: false, systemOpen: true });

    // Single tap dreams → open dreams menu (system closes automatically)
    const action3 = resolveHomeTap(mode, 'single', 'dreams');
    expect(action3).toEqual({ type: 'open-dreams-menu' });
    menus = openMenu(menus, 'dreams');
    expect(menus).toEqual({ dreamsOpen: true, systemOpen: false });

    // Double tap → exit NAV MODE (menus close)
    const action4 = resolveHomeTap(mode, 'double', 'system');
    expect(action4).toEqual({ type: 'exit-nav-mode' });
    mode = applyAction(mode, action4) as typeof mode;
    menus = closeAllMenus();
    expect(mode).toBe('locked');
    expect(menus).toEqual({ dreamsOpen: false, systemOpen: false });
  });
});
