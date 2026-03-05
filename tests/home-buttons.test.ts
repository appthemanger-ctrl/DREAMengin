import { describe, expect, it } from 'vitest';

import {
  closeAllMenus,
  openBothMenus,
  resolveHomeTap,
  type MenuState,
} from '@/lib/home-buttons/home-buttons-state';

// ARCHITECTURE.md §6.1 governs this behavior.
// Single gold button on right rail — no locked/nav mode.

describe('resolveHomeTap', () => {
  it('single tap → go-home', () => {
    expect(resolveHomeTap('single')).toEqual({ type: 'go-home' });
  });

  it('double tap → open-both-menus', () => {
    expect(resolveHomeTap('double')).toEqual({ type: 'open-both-menus' });
  });
});

describe('menu helpers', () => {
  it('openBothMenus opens dreams and system simultaneously', () => {
    expect(openBothMenus()).toEqual({ dreamsOpen: true, systemOpen: true });
  });

  it('closeAllMenus closes both', () => {
    expect(closeAllMenus()).toEqual({ dreamsOpen: false, systemOpen: false });
  });
});

describe('integration: tap sequence', () => {
  it('double tap opens both menus, single tap goes home', () => {
    let menus: MenuState = { dreamsOpen: false, systemOpen: false };

    // Double tap → open both menus
    const a1 = resolveHomeTap('double');
    expect(a1).toEqual({ type: 'open-both-menus' });
    menus = openBothMenus();
    expect(menus).toEqual({ dreamsOpen: true, systemOpen: true });

    // Single tap → go home (close all menus)
    const a2 = resolveHomeTap('single');
    expect(a2).toEqual({ type: 'go-home' });
    menus = closeAllMenus();
    expect(menus).toEqual({ dreamsOpen: false, systemOpen: false });
  });
});
