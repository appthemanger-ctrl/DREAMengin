/**
 * DREAMengin Skin Engine
 * User-facing customization layer: background gradient, widget style,
 * typography, and effects. Applied on top of the base theme engine.
 *
 * Skins are per-page (profile | home | dreamspace | feed) with a
 * global fallback. All presets are included and available to every user
 * — no tier gating, no locks, no "coming soon" placeholders.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type SkinPage = 'home' | 'profile' | 'dreamspace' | 'feed' | 'global';

export type SkinShadow = 'none' | 'soft' | 'medium' | 'strong';

export type SkinFont =
  | 'space-grotesk'   // default UI sans
  | 'cormorant'       // editorial serif
  | 'system'          // native system font
  | 'mono';           // monospace

export type SkinLayout = 'card' | 'minimal' | 'compact';

export interface SkinData {
  /** Background gradient stops */
  bgFrom:   string;
  bgMid:    string;
  bgTo:     string;
  bgAngle:  number;   // degrees

  /** Widget appearance */
  widgetOpacity: number;  // 0.1 – 1.0
  widgetRadius:  number;  // px (4 – 32)
  widgetShadow:  SkinShadow;

  /** Typography */
  fontFamily: SkinFont;

  /** Visual effects */
  glassBlur:   number;  // px (4 – 48)
  brightness:  number;  // 0.6 – 1.4
  saturation:  number;  // 0.0 – 2.0

  /** Accent colour */
  accentColor: string;

  /** Layout density */
  layout: SkinLayout;
}

// ── Default skin (matches Dream Ice) ──────────────────────────────────────────

export const DEFAULT_SKIN: SkinData = {
  bgFrom:        '#e9ecf1',
  bgMid:         '#f0f2f6',
  bgTo:          '#f7f3ec',
  bgAngle:       148,
  widgetOpacity: 0.72,
  widgetRadius:  18,
  widgetShadow:  'soft',
  fontFamily:    'space-grotesk',
  glassBlur:     24,
  brightness:    1,
  saturation:    1,
  accentColor:   '#c8981a',
  layout:        'card',
};

// ── Free preset skins ─────────────────────────────────────────────────────────

export interface SkinPreset {
  id:       string;
  label:    string;
  emoji:    string;
  /** All skins are 'free' — no tier gating in production. Field retained for type compat. */
  tier:     'free' | 'premium';
  skin:     SkinData;
}

export const SKIN_PRESETS: SkinPreset[] = [
  {
    id: 'dream-ice',
    label: 'Dream Ice',
    emoji: '❄️',
    tier: 'free',
    skin: {
      ...DEFAULT_SKIN,
      bgFrom: '#dce8f8', bgMid: '#c8d8f0', bgTo: '#b8ceec', bgAngle: 148,
    },
  },
  {
    id: 'sky-gold',
    label: 'Sky & Gold',
    emoji: '🌤️',
    tier: 'free',
    skin: {
      ...DEFAULT_SKIN,
      bgFrom: '#c8dff5', bgMid: '#d8eaf8', bgTo: '#f5e8c4', bgAngle: 148,
      accentColor: '#c8981a',
    },
  },
  {
    id: 'dream-dark',
    label: 'Dream Dark',
    emoji: '🌙',
    tier: 'free',
    skin: {
      ...DEFAULT_SKIN,
      bgFrom:       '#0a1b4d', bgMid: '#071236', bgTo: '#020818', bgAngle: 160,
      widgetOpacity: 0.55,
      accentColor:  '#d4a843',
      glassBlur:    28,
      brightness:   0.92,
    },
  },
  {
    id: 'dream-midnight',
    label: 'Dream Midnight',
    emoji: '🔮',
    tier: 'free',
    skin: {
      ...DEFAULT_SKIN,
      bgFrom:       '#0a0a1a', bgMid: '#060614', bgTo: '#020208', bgAngle: 160,
      widgetOpacity: 0.60,
      accentColor:  '#6366f1',
      glassBlur:    28,
      brightness:   0.90,
    },
  },
  {
    id: 'dream-sunset',
    label: 'Dream Sunset',
    emoji: '🌅',
    tier: 'free',
    skin: {
      ...DEFAULT_SKIN,
      bgFrom: '#fde8d0', bgMid: '#f0c8a8', bgTo: '#e8b898', bgAngle: 145,
      accentColor: '#e87040',
    },
  },
  {
    id: 'aurora',
    label: 'Aurora',
    emoji: '🌌',
    tier: 'free',
    skin: {
      ...DEFAULT_SKIN,
      bgFrom: '#c5d8f8', bgMid: '#d8e4f8', bgTo: '#e8d4f8', bgAngle: 145,
      accentColor: '#a855d8',
    },
  },
  {
    id: 'mint-sky',
    label: 'Mint & Sky',
    emoji: '🌿',
    tier: 'free',
    skin: {
      ...DEFAULT_SKIN,
      bgFrom: '#c8f0e8', bgMid: '#d8f0ef', bgTo: '#c8dff5', bgAngle: 150,
      accentColor: '#0aa880',
    },
  },
  // ── All skins available — no tier gating in production ───────────────────
  {
    id: 'neon-grid',
    label: 'Neon Grid',
    emoji: '⚡',
    tier: 'free',
    skin: {
      ...DEFAULT_SKIN,
      bgFrom:       '#0d0d2b', bgMid: '#0a0a20', bgTo: '#050515', bgAngle: 160,
      widgetOpacity: 0.65,
      accentColor:  '#00ffe7',
      glassBlur:    32,
      brightness:   0.88,
      saturation:   1.3,
    },
  },
  {
    id: 'marble',
    label: 'Marble',
    emoji: '🪨',
    tier: 'free',
    skin: {
      ...DEFAULT_SKIN,
      bgFrom:       '#f5f5f5', bgMid: '#eeeeee', bgTo: '#e0e0e0', bgAngle: 135,
      widgetOpacity: 0.85,
      widgetRadius:  24,
      widgetShadow:  'medium',
      accentColor:  '#444444',
      glassBlur:    12,
    },
  },
  {
    id: 'forest',
    label: 'Forest',
    emoji: '🌲',
    tier: 'free',
    skin: {
      ...DEFAULT_SKIN,
      bgFrom:      '#1a3a1a', bgMid: '#243824', bgTo: '#1a2e1a', bgAngle: 150,
      widgetOpacity: 0.60,
      accentColor: '#4ade80',
      glassBlur:   20,
      brightness:  0.90,
      saturation:  1.2,
    },
  },
];

export function getSkinPreset(id: string): SkinPreset {
  return SKIN_PRESETS.find((p) => p.id === id) ?? SKIN_PRESETS[0];
}

// ── CSS variable map ──────────────────────────────────────────────────────────

const SHADOW_MAP: Record<SkinShadow, string> = {
  none:   'none',
  soft:   '0 4px 16px rgba(0,0,0,0.07)',
  medium: '0 6px 24px rgba(0,0,0,0.13)',
  strong: '0 8px 32px rgba(0,0,0,0.22)',
};

const FONT_MAP: Record<SkinFont, string> = {
  'space-grotesk': 'var(--font-space-grotesk, "Space Grotesk", system-ui, sans-serif)',
  'cormorant':     'var(--font-cormorant, "Cormorant Garamond", Georgia, serif)',
  'system':        'system-ui, -apple-system, sans-serif',
  'mono':          '"JetBrains Mono", "Fira Mono", monospace',
};

export function applySkin(skin: SkinData): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;

  // Background gradient (reuse ThemeApplicator slots)
  el.style.setProperty('--de-theme-from',  skin.bgFrom);
  el.style.setProperty('--de-theme-mid',   skin.bgMid);
  el.style.setProperty('--de-theme-to',    skin.bgTo);
  el.style.setProperty('--de-theme-angle', `${skin.bgAngle}deg`);

  // Widget style
  el.style.setProperty('--skin-widget-opacity', String(skin.widgetOpacity));
  el.style.setProperty('--skin-widget-radius',  `${skin.widgetRadius}px`);
  el.style.setProperty('--skin-widget-shadow',  SHADOW_MAP[skin.widgetShadow]);

  // Typography
  el.style.setProperty('--skin-font', FONT_MAP[skin.fontFamily]);

  // Effects (reuse existing theme-engine override slots)
  el.style.setProperty('--user-blur',        `${skin.glassBlur}px`);
  el.style.setProperty('--user-brightness',  String(skin.brightness));
  el.style.setProperty('--user-saturation',  String(skin.saturation));

  // Accent
  el.style.setProperty('--skin-accent-color', skin.accentColor);
  el.style.setProperty('--de-gold', skin.accentColor);
  el.style.setProperty('--de-theme-btn-from', skin.accentColor);

  // Layout density class
  el.setAttribute('data-skin-layout', skin.layout);

  // Notify listeners
  window.dispatchEvent(new Event('de-skin-changed'));
}

// ── Per-page skin storage ─────────────────────────────────────────────────────

const STORAGE_KEY = 'dreamengin-skins-v1';

export interface AllPageSkins {
  global:     SkinData;
  home:       SkinData | null;
  profile:    SkinData | null;
  dreamspace: SkinData | null;
  feed:       SkinData | null;
}

export function loadAllSkins(): AllPageSkins {
  if (typeof window === 'undefined') {
    return { global: DEFAULT_SKIN, home: null, profile: null, dreamspace: null, feed: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AllPageSkins;
  } catch { /* ignore */ }
  return { global: DEFAULT_SKIN, home: null, profile: null, dreamspace: null, feed: null };
}

export function saveAllSkins(skins: AllPageSkins): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(skins));
}

/** Resolve the effective skin for a page: page-specific → global → default */
export function resolveSkin(skins: AllPageSkins, page: SkinPage): SkinData {
  if (page !== 'global' && skins[page]) return skins[page]!;
  return skins.global ?? DEFAULT_SKIN;
}
