// ─── Types ────────────────────────────────────────────────────────────────────

export type GradientStop = { color: string; pos: number /* 0-100 */ };
export type GradientType = 'linear' | 'radial' | 'conic';
export type TextureKind  = 'none' | 'noise' | 'dots' | 'grid' | 'waves' | 'hex';

export type BackgroundConfig = {
  /** Base fill */
  type: 'solid' | 'gradient';
  solid: string;                     // css color
  gradient: {
    stops: GradientStop[];
    angle: number;
    kind: GradientType;
  };
  /** Optional image layer */
  image: {
    url: string;
    fit: 'cover' | 'tile' | 'center';
    opacity: number;                 // 0-1
    blur: number;                    // px
  };
  /** Texture overlay */
  texture: TextureKind;
  textureOpacity: number;            // 0-1
  /** Readability overlay */
  overlay: string;                   // rgba
  /** Accent + text colours for widgets */
  accent: string;
  textPrimary: string;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_BG: BackgroundConfig = {
  type: 'gradient',
  solid: '#020818',
  gradient: {
    stops: [
      { color: '#020818', pos: 0 },
      { color: '#040d2c', pos: 55 },
      { color: '#0a0525', pos: 100 },
    ],
    angle: 160,
    kind: 'linear',
  },
  image:   { url: '', fit: 'cover', opacity: 0.35, blur: 0 },
  texture: 'none',
  textureOpacity: 0.06,
  overlay: 'rgba(2,8,24,0.45)',
  accent: '#6366f1',
  textPrimary: '#f0f4ff',
};

export const PRESET_BACKGROUNDS: Array<{ id: string; label: string; emoji: string; cfg: Partial<BackgroundConfig> }> = [
  { id: 'space',   emoji: '🌌', label: 'Space',   cfg: { type:'gradient', gradient:{ stops:[{color:'#020818',pos:0},{color:'#040d2c',pos:55},{color:'#0a0525',pos:100}], angle:160, kind:'linear' }, accent:'#6366f1', overlay:'rgba(2,8,24,0.45)' } },
  { id: 'gold',    emoji: '✦',  label: 'Gold',    cfg: { type:'gradient', gradient:{ stops:[{color:'#1a0f00',pos:0},{color:'#2d1a00',pos:55},{color:'#140b00',pos:100}], angle:145, kind:'linear' }, accent:'#d4a843', overlay:'rgba(10,5,0,0.5)'  } },
  { id: 'neon',    emoji: '⚡', label: 'Neon',    cfg: { type:'gradient', gradient:{ stops:[{color:'#000d1a',pos:0},{color:'#001a0d',pos:50},{color:'#0d0026',pos:100}], angle:135, kind:'linear' }, accent:'#00ff88', overlay:'rgba(0,5,10,0.5)'  } },
  { id: 'rose',    emoji: '🌸', label: 'Rose',    cfg: { type:'gradient', gradient:{ stops:[{color:'#1a0010',pos:0},{color:'#26001a',pos:55},{color:'#0d0008',pos:100}], angle:150, kind:'linear' }, accent:'#f472b6', overlay:'rgba(15,0,10,0.5)' } },
  { id: 'ocean',   emoji: '🌊', label: 'Ocean',   cfg: { type:'gradient', gradient:{ stops:[{color:'#001a26',pos:0},{color:'#002233',pos:55},{color:'#001018',pos:100}], angle:170, kind:'linear' }, accent:'#22d3ee', overlay:'rgba(0,8,15,0.5)'  } },
  { id: 'forest',  emoji: '🌿', label: 'Forest',  cfg: { type:'gradient', gradient:{ stops:[{color:'#001a0d',pos:0},{color:'#002618',pos:55},{color:'#000d08',pos:100}], angle:160, kind:'linear' }, accent:'#4ade80', overlay:'rgba(0,5,3,0.5)'   } },
  { id: 'sunset',  emoji: '🌅', label: 'Sunset',  cfg: { type:'gradient', gradient:{ stops:[{color:'#1a0526',pos:0},{color:'#3d0c1a',pos:40},{color:'#5c1a00',pos:100}], angle:180, kind:'linear' }, accent:'#fb923c', overlay:'rgba(10,2,0,0.45)' } },
  { id: 'midnight',emoji: '🌃', label: 'Midnight',cfg: { type:'solid', solid:'#000000', accent:'#a78bfa', overlay:'rgba(0,0,0,0.3)' } },
];

// ─── Persistence ──────────────────────────────────────────────────────────────

const BG_KEY = 'dreamengin:background';

export function loadBackground(): BackgroundConfig {
  try {
    const raw = localStorage.getItem(BG_KEY);
    if (raw) return { ...DEFAULT_BG, ...JSON.parse(raw) as Partial<BackgroundConfig> };
  } catch { /* noop */ }
  return { ...DEFAULT_BG };
}

export function saveBackground(cfg: BackgroundConfig) {
  try { localStorage.setItem(BG_KEY, JSON.stringify(cfg)); } catch { /* noop */ }
}

// ─── CSS generation ───────────────────────────────────────────────────────────

export function buildBackgroundCSS(cfg: BackgroundConfig): React.CSSProperties {
  // base layer
  let background = '';
  const layers: string[] = [];

  // overlay
  if (cfg.overlay) layers.push(`linear-gradient(${cfg.overlay},${cfg.overlay})`);

  // image
  if (cfg.image.url) {
    layers.push(`url("${cfg.image.url}")`);
  }

  // texture
  if (cfg.texture !== 'none') {
    layers.push(textureCSS(cfg.texture, cfg.textureOpacity));
  }

  // base gradient / solid
  if (cfg.type === 'gradient') {
    const { stops, angle, kind } = cfg.gradient;
    const stopStr = stops.map((s) => `${s.color} ${s.pos}%`).join(', ');
    if (kind === 'linear')      layers.push(`linear-gradient(${angle}deg, ${stopStr})`);
    else if (kind === 'radial') layers.push(`radial-gradient(ellipse at center, ${stopStr})`);
    else                        layers.push(`conic-gradient(from ${angle}deg, ${stopStr})`);
  } else {
    layers.push(cfg.solid);
  }

  background = layers.join(', ');

  const style: React.CSSProperties = { background };

  if (cfg.image.url) {
    Object.assign(style, {
      backgroundSize: cfg.image.fit === 'tile' ? 'auto' : 'cover, auto, auto, cover',
      backgroundRepeat: cfg.image.fit === 'tile' ? 'repeat' : 'no-repeat, repeat, repeat, no-repeat',
      backgroundPosition: cfg.image.fit === 'center' ? 'center' : 'center',
    });
  }

  return style;
}

function textureCSS(kind: TextureKind, opacity: number): string {
  const c = `rgba(255,255,255,${opacity})`;
  switch (kind) {
    case 'dots':  return `radial-gradient(${c} 1px, transparent 1px)`;
    case 'grid':  return `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`;
    case 'noise': return `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='${opacity}'/%3E%3C/svg%3E")`;
    case 'hex':   return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49'%3E%3Cpath d='M14 0 L28 8.5 L28 25.5 L14 34 L0 25.5 L0 8.5Z' fill='none' stroke='${encodeURIComponent(c)}' stroke-width='0.5'/%3E%3C/svg%3E")`;
    case 'waves': return `repeating-linear-gradient(45deg, ${c} 0, transparent 1px, transparent 10px, ${c} 11px)`;
    default:      return 'none';
  }
}

// React import needed for CSSProperties
import type React from 'react';
