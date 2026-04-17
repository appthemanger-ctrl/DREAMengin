/**
 * DREAMengin Theme Engine
 * Manages theme presets + user customization (brightness, saturation, blur, accent, gradient).
 * All values are applied via CSS custom properties on <html>.
 */

// ── Preset definitions ──────────────────────────────────────────────────────

export interface ThemePreset {
  id: string;
  label: string;
  tokens: ThemeTokens;
}

export interface ThemeTokens {
  /** Background gradient stops */
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  /** Glassmorphism */
  glass: string;
  glass2: string;
  glassBorder: string;
  glassBorderGold: string;
  /** Core colors */
  text: string;
  textDim: string;
  heading: string;
  gold: string;
  goldBright: string;
  goldDim: string;
  accent: string;
  accentGlow: string;
  navy: string;
  deep: string;
  mist: string;
  red: string;
  /** Widget surfaces */
  widgetBg: string;
  widgetBorder: string;
  outerShellBg: string;
  outerShellBorder: string;
  /** Shadcn HSL overrides */
  hslBackground: string;
  hslForeground: string;
  hslCard: string;
  hslCardForeground: string;
  hslPrimary: string;
  hslPrimaryForeground: string;
  hslMuted: string;
  hslMutedForeground: string;
  hslBorder: string;
  hslAccent: string;
  hslAccentForeground: string;
  /** Starfield style */
  starfieldStyle: 'dark' | 'light';
}

export interface UserOverrides {
  brightness: number;    // 0.5 – 1.5, default 1
  saturation: number;    // 0.0 – 2.0, default 1
  blur: number;          // 8 – 40, default 24
  glassOpacity: number;  // 0.1 – 0.9, default varies
  accentHue: number;     // 0 – 360, -1 = use preset default
}

export const DEFAULT_OVERRIDES: UserOverrides = {
  brightness: 1,
  saturation: 1,
  blur: 24,
  glassOpacity: -1, // use preset default
  accentHue: -1,    // use preset default
};

// ── Dream Ice (default -- matches mockups) ──────────────────────────────────

const DREAM_ICE: ThemeTokens = {
  bgStart: '#dce8f8',
  bgMid: '#c5d8f0',
  bgEnd: '#b8ceec',
  glass: 'rgba(255,255,255,0.52)',
  glass2: 'rgba(235,245,255,0.68)',
  glassBorder: 'rgba(160,195,240,0.45)',
  glassBorderGold: 'rgba(190,210,245,0.55)',
  text: '#1a3a6a',
  textDim: 'rgba(60,100,160,0.55)',
  heading: '#0f2a5c',
  gold: '#c8981a',
  goldBright: '#e8b830',
  goldDim: '#a08020',
  accent: '#2a8ab8',
  accentGlow: '#3ba0d0',
  navy: '#dce8f8',
  deep: '#e8f0fa',
  mist: 'rgba(180,210,250,0.22)',
  red: '#dc4444',
  widgetBg: 'rgba(255,255,255,0.55)',
  widgetBorder: 'rgba(160,195,240,0.40)',
  outerShellBg: 'rgba(255,255,255,0.48)',
  outerShellBorder: 'rgba(160,195,240,0.50)',
  hslBackground: '215 45% 95%',
  hslForeground: '215 55% 20%',
  hslCard: '210 40% 98%',
  hslCardForeground: '215 55% 20%',
  hslPrimary: '210 80% 52%',
  hslPrimaryForeground: '0 0% 100%',
  hslMuted: '215 30% 90%',
  hslMutedForeground: '215 20% 45%',
  hslBorder: '215 35% 85%',
  hslAccent: '43 70% 48%',
  hslAccentForeground: '215 55% 15%',
  starfieldStyle: 'light',
};

// ── Dream Dark (current) ────────────────────────────────────────────────────

const DREAM_DARK: ThemeTokens = {
  bgStart: '#0a1b4d',
  bgMid: '#071236',
  bgEnd: '#020818',
  glass: 'rgba(8,22,72,0.55)',
  glass2: 'rgba(5,15,45,0.72)',
  glassBorder: 'rgba(100,150,255,0.15)',
  glassBorderGold: 'rgba(212,168,67,0.28)',
  text: '#c8d8ff',
  textDim: 'rgba(160,185,255,0.50)',
  heading: '#f0f4ff',
  gold: '#d4a843',
  goldBright: '#f0c040',
  goldDim: '#8a6820',
  accent: '#1a4ed8',
  accentGlow: '#2563eb',
  navy: '#020818',
  deep: '#050f2a',
  mist: 'rgba(160,185,255,0.10)',
  red: '#ef4444',
  widgetBg: 'rgba(8,22,72,0.55)',
  widgetBorder: 'rgba(100,150,255,0.15)',
  outerShellBg: 'linear-gradient(135deg, rgba(8,22,65,0.82), rgba(4,12,40,0.92))',
  outerShellBorder: 'rgba(212,168,67,0.28)',
  hslBackground: '220 60% 4%',
  hslForeground: '210 40% 96%',
  hslCard: '220 50% 7%',
  hslCardForeground: '210 40% 96%',
  hslPrimary: '217 100% 57%',
  hslPrimaryForeground: '220 60% 4%',
  hslMuted: '220 30% 14%',
  hslMutedForeground: '215 20% 50%',
  hslBorder: '220 30% 16%',
  hslAccent: '43 70% 55%',
  hslAccentForeground: '220 60% 4%',
  starfieldStyle: 'dark',
};

// ── Dream Midnight ──────────────────────────────────────────────────────────

const DREAM_MIDNIGHT: ThemeTokens = {
  ...DREAM_DARK,
  bgStart: '#0a0a1a',
  bgMid: '#060614',
  bgEnd: '#020208',
  glass: 'rgba(10,10,30,0.65)',
  glass2: 'rgba(5,5,20,0.80)',
  accent: '#6366f1',
  accentGlow: '#818cf8',
  hslPrimary: '239 84% 67%',
};

// ── Dream Sunset ────────────────────────────────────────────────────────────

const DREAM_SUNSET: ThemeTokens = {
  ...DREAM_ICE,
  bgStart: '#fde8d0',
  bgMid: '#f0c8a8',
  bgEnd: '#e8b898',
  glass: 'rgba(255,245,235,0.55)',
  glass2: 'rgba(255,238,225,0.68)',
  glassBorder: 'rgba(220,170,120,0.40)',
  glassBorderGold: 'rgba(230,180,100,0.50)',
  text: '#5a2a0a',
  textDim: 'rgba(120,70,30,0.55)',
  heading: '#3a1a00',
  gold: '#d48a20',
  accent: '#e87040',
  accentGlow: '#f08050',
  navy: '#fde8d0',
  deep: '#f5e0c8',
  mist: 'rgba(230,180,120,0.18)',
  hslBackground: '30 60% 93%',
  hslForeground: '20 60% 18%',
  hslCard: '30 50% 97%',
  hslCardForeground: '20 60% 18%',
  hslPrimary: '20 80% 55%',
  hslPrimaryForeground: '0 0% 100%',
  hslMuted: '30 30% 88%',
  hslMutedForeground: '20 25% 42%',
  hslBorder: '30 35% 82%',
  hslAccent: '20 80% 50%',
  hslAccentForeground: '30 60% 95%',
};

// ── All presets ─────────────────────────────────────────────────────────────

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'dream-ice',      label: 'Dream Ice',      tokens: DREAM_ICE },
  { id: 'dream-dark',     label: 'Dream Dark',     tokens: DREAM_DARK },
  { id: 'dream-midnight', label: 'Dream Midnight', tokens: DREAM_MIDNIGHT },
  { id: 'dream-sunset',   label: 'Dream Sunset',   tokens: DREAM_SUNSET },
];

export function getPreset(id: string): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

// ── Apply theme to DOM ──────────────────────────────────────────────────────

export function applyTheme(presetId: string, overrides: UserOverrides = DEFAULT_OVERRIDES): void {
  if (typeof document === 'undefined') return;
  const preset = getPreset(presetId);
  const t = preset.tokens;
  const el = document.documentElement;

  el.setAttribute('data-theme', presetId);

  // DREAMengin tokens
  el.style.setProperty('--de-navy', t.navy);
  el.style.setProperty('--de-deep', t.deep);
  el.style.setProperty('--de-accent', t.accent);
  el.style.setProperty('--de-glow', t.accentGlow);
  el.style.setProperty('--de-gold', t.gold);
  el.style.setProperty('--de-gold-bright', t.goldBright);
  el.style.setProperty('--de-gold-dim', t.goldDim);
  el.style.setProperty('--de-white', t.heading);
  el.style.setProperty('--de-mist', t.mist);
  el.style.setProperty('--de-glass', t.glass);
  el.style.setProperty('--de-glass2', t.glass2);
  el.style.setProperty('--de-border', t.glassBorder);
  el.style.setProperty('--de-border-gold', t.glassBorderGold);
  el.style.setProperty('--de-text', t.text);
  el.style.setProperty('--de-text-dim', t.textDim);
  el.style.setProperty('--de-red', t.red);
  el.style.setProperty('--de-bg-start', t.bgStart);
  el.style.setProperty('--de-bg-mid', t.bgMid);
  el.style.setProperty('--de-bg-end', t.bgEnd);
  el.style.setProperty('--de-widget-bg', t.widgetBg);
  el.style.setProperty('--de-widget-border', t.widgetBorder);
  el.style.setProperty('--de-heading', t.heading);

  // Shadcn HSL
  el.style.setProperty('--background', t.hslBackground);
  el.style.setProperty('--foreground', t.hslForeground);
  el.style.setProperty('--card', t.hslCard);
  el.style.setProperty('--card-foreground', t.hslCardForeground);
  el.style.setProperty('--primary', t.hslPrimary);
  el.style.setProperty('--primary-foreground', t.hslPrimaryForeground);
  el.style.setProperty('--muted', t.hslMuted);
  el.style.setProperty('--muted-foreground', t.hslMutedForeground);
  el.style.setProperty('--border', t.hslBorder);
  el.style.setProperty('--accent', t.hslAccent);
  el.style.setProperty('--accent-foreground', t.hslAccentForeground);

  // User overrides
  const blur = overrides.blur > 0 ? overrides.blur : 24;
  el.style.setProperty('--user-brightness', String(overrides.brightness));
  el.style.setProperty('--user-saturation', String(overrides.saturation));
  el.style.setProperty('--user-blur', `${blur}px`);
  el.style.setProperty('--starfield-style', t.starfieldStyle);
}

// ── Persistence ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'dreamengin-theme';

export interface StoredTheme {
  presetId: string;
  overrides: UserOverrides;
}

export function loadStoredTheme(): StoredTheme {
  if (typeof window === 'undefined') return { presetId: 'dream-ice', overrides: DEFAULT_OVERRIDES };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredTheme;
      return parsed;
    }
  } catch { /* ignore */ }
  return { presetId: 'dream-ice', overrides: DEFAULT_OVERRIDES };
}

export function saveTheme(presetId: string, overrides: UserOverrides): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ presetId, overrides }));
}
