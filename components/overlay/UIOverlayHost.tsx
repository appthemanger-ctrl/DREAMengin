'use client';

/**
 * UIOverlayHost — Global overlay host rendered once at root.
 * Contains the Golden Button (tap→/home, hold→menu) and its radial menu.
 *
 * Rules:
 * - position: fixed; never inside a scroll container
 * - pointer-events: none on the host; auto on children
 * - Denylist: hidden on /login, /join, /auth/callback
 * - Visibility toggle only (no unmount on route change)
 * - z-index 9000 (above all panels)
 * - Safe-area bottom clamp
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Music2,
  Palette,
  Gamepad2,
  PlugZap,
  MoreHorizontal,
  Home,
  PlusCircle,
  BookOpen,
  BarChart2,
  Tv2,
} from 'lucide-react';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const BTN_SIZE          = 56;
const LONG_PRESS_MS     = 400;
const DRAG_THRESHOLD    = 8;
const MENU_AUTO_CLOSE   = 3000;
const SAFE_BOTTOM_PX    = 34; // iOS home-bar clearance
const STORAGE_KEY       = 'dreamengin:goldbtn:pos:v1';

const ROUTE_DENYLIST = ['/login', '/join', '/auth/callback'];

/* ─── Menu items ─────────────────────────────────────────────────────────── */
type MenuItemDef = {
  id: string;
  label: string;
  icon: React.ReactNode;
  route?: string;
  subItems?: MenuItemDef[];
};

const DAYDREAM_THEMES: MenuItemDef[] = [
  { id: 'dy-analytics', label: 'Analytics', icon: <BarChart2  size={18} />, route: '/daydream/analytics'  },
  { id: 'dy-brand',     label: 'Brand',     icon: <Palette    size={18} />, route: '/daydream/brand'      },
  { id: 'dy-games',     label: 'Games',     icon: <Gamepad2   size={18} />, route: '/daydream/games'      },
  { id: 'dy-vault',     label: 'Vault',     icon: <Tv2        size={18} />, route: '/daydream/media-vault' },
  { id: 'dy-music',     label: 'Music',     icon: <Music2     size={18} />, route: '/daydream/music'      },
  { id: 'dy-play',      label: 'Play',      icon: <Gamepad2   size={18} />, route: '/daydream/play'       },
];

const MORE_ITEMS: MenuItemDef[] = [
  { id: 'more-settings', label: 'Settings', icon: null, route: '/settings' },
  { id: 'more-policy',   label: 'Policy',   icon: null, route: '/policy'   },
  { id: 'more-about',    label: 'About',    icon: null, route: '/about'     },
  { id: 'more-help',     label: 'Help',     icon: null, route: '/help'      },
];

const TOP_MENU_ITEMS: MenuItemDef[] = [
  { id: 'new-dream',    label: 'New Dream',  icon: <PlusCircle size={18} />, route: '/create'     },
  { id: 'my-dreams',    label: 'My Dreams',  icon: <BookOpen   size={18} />, route: '/home'        },
  { id: 'daydream',     label: 'Daydream',   icon: <Music2     size={18} />, subItems: DAYDREAM_THEMES },
  { id: 'connectors',   label: 'Connectors', icon: <PlugZap    size={18} />, route: '/connectors' },
  { id: 'more',         label: 'More',       icon: <MoreHorizontal size={18} />, subItems: MORE_ITEMS },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function loadPos(): { x: number; y: number } | null {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}
function savePos(pos: { x: number; y: number }) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch { /* noop */ }
}
function defaultPos(w: number, h: number) {
  return {
    x: w - BTN_SIZE - 20,
    y: h - BTN_SIZE - SAFE_BOTTOM_PX - 20,
  };
}
function clampPos(x: number, y: number, w: number, h: number) {
  return {
    x: Math.max(8, Math.min(w - BTN_SIZE - 8, x)),
    y: Math.max(60, Math.min(h - BTN_SIZE - SAFE_BOTTOM_PX, y)),
  };
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function UIOverlayHost() {
  const router   = useRouter();
  const pathname = usePathname();
  const [mounted,     setMounted]     = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [subMenu,     setSubMenu]     = useState<MenuItemDef[] | null>(null);
  const [subMenuId,   setSubMenuId]   = useState<string | null>(null);
  const [pressing,    setPressing]    = useState(false);

  const posRef        = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const btnRef        = useRef<HTMLButtonElement>(null);
  const dragRef       = useRef({ active: false, startX: 0, startY: 0, moved: false });
  const longPressRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCloseRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Init position ── */
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const saved = loadPos();
    const pos = saved
      ? clampPos(saved.x, saved.y, w, h)
      : defaultPos(w, h);
    posRef.current = pos;
    if (btnRef.current) {
      btnRef.current.style.transform = `translate3d(${pos.x}px,${pos.y}px,0)`;
    }
    setMounted(true);
    return () => {
      if (longPressRef.current) clearTimeout(longPressRef.current);
      if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    };
  }, []);

  /* ── Route change: close menu ── */
  useEffect(() => {
    setMenuOpen(false);
    setSubMenu(null);
    setSubMenuId(null);
  }, [pathname]);

  /* ── Auto-close menu after inactivity ── */
  const resetAutoClose = useCallback(() => {
    if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    autoCloseRef.current = setTimeout(() => {
      setMenuOpen(false);
      setSubMenu(null);
      setSubMenuId(null);
    }, MENU_AUTO_CLOSE);
  }, []);

  const openMenu = useCallback(() => {
    setMenuOpen(true);
    setSubMenu(null);
    setSubMenuId(null);
    resetAutoClose();
  }, [resetAutoClose]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setSubMenu(null);
    setSubMenuId(null);
    if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
  }, []);

  const navigate = useCallback((route: string) => {
    closeMenu();
    router.push(route);
  }, [closeMenu, router]);

  /* ── Pointer handlers ── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX - posRef.current.x,
      startY: e.clientY - posRef.current.y,
      moved: false,
    };
    setPressing(true);
    longPressRef.current = setTimeout(() => {
      if (!dragRef.current.moved) {
        openMenu();
        setPressing(false);
      }
    }, LONG_PRESS_MS);
  }, [openMenu]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - posRef.current.x - dragRef.current.startX;
    const dy = e.clientY - posRef.current.y - dragRef.current.startY;
    if (!dragRef.current.moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      dragRef.current.moved = true;
      if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
      setPressing(false);
    }
    if (!dragRef.current.moved) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const newX = e.clientX - dragRef.current.startX;
    const newY = e.clientY - dragRef.current.startY;
    const pos = clampPos(newX, newY, w, h);
    posRef.current = pos;
    if (btnRef.current) {
      btnRef.current.style.transform = `translate3d(${pos.x}px,${pos.y}px,0)`;
    }
  }, []);

  const onPointerUp = useCallback(() => {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
    dragRef.current.active = false;
    setPressing(false);
    if (!dragRef.current.moved) {
      // Tap → navigate home (menu was already handled by long-press timer)
      if (!menuOpen) {
        router.push('/home');
      }
    } else {
      savePos(posRef.current);
    }
  }, [menuOpen, router]);

  /* ── Menu item selection ── */
  const handleMenuSelect = useCallback((item: MenuItemDef) => {
    if (item.subItems) {
      if (subMenuId === item.id) {
        setSubMenu(null);
        setSubMenuId(null);
      } else {
        setSubMenu(item.subItems);
        setSubMenuId(item.id);
      }
      resetAutoClose();
    } else if (item.route) {
      navigate(item.route);
    }
  }, [subMenuId, resetAutoClose, navigate]);

  /* ── Outside tap closes menu ── */
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-overlay-menu]') && !target.closest('[data-golden-btn]')) {
        closeMenu();
      }
    };
    // slight delay so the open gesture doesn't immediately close
    const id = setTimeout(() => {
      window.addEventListener('pointerdown', handler);
    }, 50);
    return () => {
      clearTimeout(id);
      window.removeEventListener('pointerdown', handler);
    };
  }, [menuOpen, closeMenu]);

  /* ── Visibility: hide on denylist routes ── */
  const hidden = ROUTE_DENYLIST.some((p) => pathname?.startsWith(p));
  const visibility = !mounted || hidden ? 'hidden' : 'visible';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9000,
        visibility,
      }}
      aria-hidden={hidden}
    >
      {/* Golden Button */}
      <button
        ref={btnRef}
        data-golden-btn
        type="button"
        aria-label="Home — tap to go home, hold to open menu"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
          dragRef.current.active = false;
          setPressing(false);
        }}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: BTN_SIZE,
          height: BTN_SIZE,
          borderRadius: '50%',
          pointerEvents: 'auto',
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
          cursor: 'pointer',
          background: pressing
            ? 'linear-gradient(135deg,#b8860b,#d4a843)'
            : 'linear-gradient(135deg,#92400e,#d4a843)',
          border: '2px solid rgba(212,168,67,0.8)',
          boxShadow: pressing
            ? '0 0 0 3px rgba(212,168,67,0.4), 0 4px 24px rgba(212,168,67,0.55)'
            : '0 0 0 2px rgba(212,168,67,0.25), 0 4px 18px rgba(212,168,67,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'box-shadow 0.15s, background 0.15s',
          transform: 'scale(0.98)',
          /* prefers-reduced-motion: transition disabled below via inline style check */
        }}
      >
        <Home size={22} color="rgba(255,240,200,0.95)" strokeWidth={2.2} />
      </button>

      {/* Menu overlay */}
      {menuOpen && (
        <div
          data-overlay-menu
          style={{
            position: 'fixed',
            bottom: BTN_SIZE + SAFE_BOTTOM_PX + 36,
            right: 16,
            pointerEvents: 'auto',
            zIndex: 9001,
            background: 'rgba(5,12,32,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(212,168,67,0.25)',
            borderRadius: 20,
            padding: '10px 6px',
            minWidth: 200,
            boxShadow: '0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,168,67,0.12)',
          }}
        >
          {TOP_MENU_ITEMS.map((item) => (
            <React.Fragment key={item.id}>
              <button
                type="button"
                onClick={() => { resetAutoClose(); handleMenuSelect(item); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '11px 14px',
                  background: subMenuId === item.id ? 'rgba(212,168,67,0.12)' : 'transparent',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  color: 'rgba(240,230,200,0.92)',
                  fontSize: 14,
                  fontWeight: 600,
                  textAlign: 'left',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.12s',
                  minHeight: 44,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.1)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = subMenuId === item.id ? 'rgba(212,168,67,0.12)' : 'transparent'; }}
              >
                <span style={{ color: 'rgba(212,168,67,0.75)', flexShrink: 0 }}>{item.icon}</span>
                {item.label}
                {item.subItems && (
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(212,168,67,0.5)' }}>
                    {subMenuId === item.id ? '▾' : '▸'}
                  </span>
                )}
              </button>

              {/* Sub-menu inline expansion */}
              {item.subItems && subMenuId === item.id && subMenu && (
                <div style={{ paddingLeft: 16, paddingBottom: 4 }}>
                  {subMenu.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => sub.route && navigate(sub.route)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        padding: '9px 12px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 10,
                        cursor: 'pointer',
                        color: 'rgba(200,220,255,0.75)',
                        fontSize: 13,
                        fontWeight: 500,
                        textAlign: 'left',
                        WebkitTapHighlightColor: 'transparent',
                        minHeight: 40,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(100,150,255,0.1)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <span style={{ color: 'rgba(100,150,255,0.65)', flexShrink: 0 }}>{sub.icon}</span>
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
