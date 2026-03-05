import { describe, expect, it } from 'vitest';

import {
  closeMenu,
  openBothMenus,
  openMenu,
  resolveHomeTap,
  type MenuState,
} from '@/lib/home-buttons/home-buttons-state';

// SPEC.md §3.1 (v3.0 — single home button) governs this behavior.

describe('resolveHomeTap – single home button', () => {
  it('single tap → go-home', () => {
    expect(resolveHomeTap('single')).toEqual({ type: 'go-home' });
  });

  it('double tap → open-menu', () => {
    expect(resolveHomeTap('double')).toEqual({ type: 'open-menu' });
  });
});

describe('menu helpers', () => {
  it('openMenu returns open:true', () => {
    expect(openMenu()).toEqual({ open: true });
  });

  it('closeMenu returns open:false', () => {
    expect(closeMenu()).toEqual({ open: false });
  });

  it('openBothMenus (legacy alias) returns open:true', () => {
    expect(openBothMenus()).toEqual({ open: true });
  });
});

describe('integration: tap to go home, double-tap to open menu', () => {
  it('follows the SPEC §3.1 single-button interaction sequence', () => {
    let menu: MenuState = { open: false };

    // Single tap → go home (menu unchanged)
    const a1 = resolveHomeTap('single');
    expect(a1).toEqual({ type: 'go-home' });
    expect(menu).toEqual({ open: false });

    // Double tap → open menu
    const a2 = resolveHomeTap('double');
    expect(a2).toEqual({ type: 'open-menu' });
    menu = openMenu();
    expect(menu).toEqual({ open: true });

    // Single tap → go home, close menu
    const a3 = resolveHomeTap('single');
    expect(a3).toEqual({ type: 'go-home' });
    menu = closeMenu();
    expect(menu).toEqual({ open: false });
  });
});
