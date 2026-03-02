'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ColorPicker from '@/components/ui/ColorPicker';

// ── Widget style types ────────────────────────────────────────────────────────
export type WidgetBg    = 'glass' | 'solid' | 'transparent' | 'gradient' | 'frosted';
export type WidgetBorder = 'none' | 'subtle' | 'glow' | 'hard' | 'dashed';

export type WidgetStyle = {
  bg: WidgetBg;
  color: string;
  color2: string;       // gradient second color
  opacity: number;
  border: WidgetBorder;
  borderColor: string;
  radius: number;
  glowIntensity: number;
  fontSize: number;     // scale factor 0.8-1.4
};

export const DEFAULT_WIDGET_STYLE: WidgetStyle = {
  bg: 'glass', color: '#0a1a3a', color2: '#040d2c',
  opacity: 1, border: 'subtle', borderColor: 'rgba(100,150,255,0.15)',
  radius: 16, glowIntensity: 0, fontSize: 1,
};

const STYLE_KEY = (id: string) => `dreamengin:widget-style:${id}`;

export function loadWidgetStyle(id: string): WidgetStyle {
  try {
    const raw = localStorage.getItem(STYLE_KEY(id));
    return raw ? { ...DEFAULT_WIDGET_STYLE, ...JSON.parse(raw) as Partial<WidgetStyle> } : { ...DEFAULT_WIDGET_STYLE };
  } catch { return { ...DEFAULT_WIDGET_STYLE }; }
}

export function saveWidgetStyle(id: string, s: WidgetStyle) {
  try { localStorage.setItem(STYLE_KEY(id), JSON.stringify(s)); } catch { /* noop */ }
}

// ── CSS from WidgetStyle ──────────────────────────────────────────────────────
export function widgetStyleToCSS(s: WidgetStyle, accent: string): React.CSSProperties {
  const base: React.CSSProperties = { opacity: s.opacity, borderRadius: s.radius };

  switch (s.bg) {
    case 'glass':
      Object.assign(base, { background: 'rgba(5,15,45,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' });
      break;
    case 'frosted':
      Object.assign(base, { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' });
      break;
    case 'solid':
      Object.assign(base, { background: s.color });
      break;
    case 'gradient':
      Object.assign(base, { background: `linear-gradient(145deg, ${s.color}, ${s.color2})` });
      break;
    case 'transparent':
      Object.assign(base, { background: 'transparent' });
      break;
  }

  switch (s.border) {
    case 'subtle':  Object.assign(base, { border: `1px solid ${s.borderColor}` }); break;
    case 'hard':    Object.assign(base, { border: `2px solid ${s.borderColor}` }); break;
    case 'glow':    Object.assign(base, { border: `1px solid ${accent}66`, boxShadow: `0 0 ${8 + s.glowIntensity * 20}px ${accent}${Math.round(s.glowIntensity * 160).toString(16).padStart(2,'0')}` }); break;
    case 'dashed':  Object.assign(base, { border: `1px dashed ${s.borderColor}` }); break;
    case 'none':    Object.assign(base, { border: 'none' }); break;
  }

  return base;
}

// ── Component ─────────────────────────────────────────────────────────────────
type Props = {
  tileId: string;
  tileLabel: string;
  accent: string;
  onClose: () => void;
  onStyleChange: (id: string, style: WidgetStyle) => void;
};

export default function WidgetDesignPanel({ tileId, tileLabel, accent, onClose, onStyleChange }: Props) {
  const [style, setStyle] = useState<WidgetStyle>(DEFAULT_WIDGET_STYLE);

  useEffect(() => { setStyle(loadWidgetStyle(tileId)); }, [tileId]);

  const update = useCallback((partial: Partial<WidgetStyle>) => {
    setStyle((prev) => {
      const next = { ...prev, ...partial };
      saveWidgetStyle(tileId, next);
      onStyleChange(tileId, next);
      return next;
    });
  }, [tileId, onStyleChange]);

  const BG_OPTIONS: Array<{ id: WidgetBg; label: string; emoji: string }> = [
    { id: 'glass',       label: 'Glass',       emoji: '🔷' },
    { id: 'frosted',     label: 'Frosted',     emoji: '❄️' },
    { id: 'solid',       label: 'Solid',       emoji: '⬛' },
    { id: 'gradient',    label: 'Gradient',    emoji: '◐'  },
    { id: 'transparent', label: 'Clear',       emoji: '○'  },
  ];

  const BORDER_OPTIONS: Array<{ id: WidgetBorder; label: string }> = [
    { id: 'none',   label: 'None'   },
    { id: 'subtle', label: 'Subtle' },
    { id: 'hard',   label: 'Hard'   },
    { id: 'glow',   label: 'Glow'   },
    { id: 'dashed', label: 'Dashed' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
      onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />

      <div onClick={(e) => e.stopPropagation()} style={{
        position: 'relative', zIndex: 1,
        background: 'rgba(4,10,30,0.98)',
        borderTop: '1px solid rgba(100,150,255,0.15)',
        borderRadius: '24px 24px 0 0',
        maxHeight: '75dvh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.7)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(160,185,255,0.2)' }} />
        </div>

        <div style={{ padding: '0 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'rgba(240,244,255,0.95)' }}>{tileLabel}</div>
            <div style={{ fontSize: 10, color: 'rgba(160,185,255,0.4)', marginTop: 1 }}>Widget Style</div>
          </div>
          <button type="button" onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'rgba(160,185,255,0.4)', padding: 4 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Background style */}
          <Section label="Background">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {BG_OPTIONS.map((o) => (
                <button key={o.id} type="button" onClick={() => update({ bg: o.id })}
                  style={{
                    padding: '7px 12px', borderRadius: 12, cursor: 'pointer', fontSize: 11, fontWeight: 700, gap: 4, display: 'flex', alignItems: 'center',
                    background: style.bg === o.id ? 'rgba(100,150,255,0.2)' : 'rgba(100,150,255,0.06)',
                    border: style.bg === o.id ? '1px solid rgba(100,150,255,0.45)' : '1px solid rgba(100,150,255,0.1)',
                    color: style.bg === o.id ? 'rgba(200,220,255,0.95)' : 'rgba(160,185,255,0.5)',
                  }}>
                  {o.emoji} {o.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Color pickers */}
          {(style.bg === 'solid' || style.bg === 'gradient') && (
            <Section label={style.bg === 'gradient' ? 'Color A' : 'Color'}>
              <ColorPicker value={style.color} onChange={(v) => update({ color: v })} />
            </Section>
          )}
          {style.bg === 'gradient' && (
            <Section label="Color B">
              <ColorPicker value={style.color2} onChange={(v) => update({ color2: v })} />
            </Section>
          )}

          {/* Opacity */}
          <Section label={`Opacity — ${Math.round(style.opacity * 100)}%`}>
            <input type="range" min={0.1} max={1} step={0.01} value={style.opacity}
              onChange={(e) => update({ opacity: Number(e.target.value) })}
              style={{ width: '100%', cursor: 'pointer' }} />
          </Section>

          {/* Border */}
          <Section label="Border">
            <div style={{ display: 'flex', gap: 6 }}>
              {BORDER_OPTIONS.map((o) => (
                <button key={o.id} type="button" onClick={() => update({ border: o.id })}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 10, cursor: 'pointer', fontSize: 10, fontWeight: 700,
                    background: style.border === o.id ? 'rgba(100,150,255,0.2)' : 'rgba(100,150,255,0.06)',
                    border: style.border === o.id ? '1px solid rgba(100,150,255,0.45)' : '1px solid rgba(100,150,255,0.1)',
                    color: style.border === o.id ? 'rgba(200,220,255,0.95)' : 'rgba(160,185,255,0.5)',
                  }}>
                  {o.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Border color + glow intensity */}
          {style.border !== 'none' && (
            <Section label="Border Color">
              <ColorPicker value={style.borderColor.startsWith('#') ? style.borderColor : accent}
                onChange={(v) => update({ borderColor: v })} />
            </Section>
          )}
          {style.border === 'glow' && (
            <Section label={`Glow Intensity — ${Math.round(style.glowIntensity * 100)}%`}>
              <input type="range" min={0} max={1} step={0.01} value={style.glowIntensity}
                onChange={(e) => update({ glowIntensity: Number(e.target.value) })}
                style={{ width: '100%', cursor: 'pointer' }} />
            </Section>
          )}

          {/* Corner radius */}
          <Section label={`Corner Radius — ${style.radius}px`}>
            <input type="range" min={0} max={32} step={1} value={style.radius}
              onChange={(e) => update({ radius: Number(e.target.value) })}
              style={{ width: '100%', cursor: 'pointer' }} />
          </Section>

          {/* Font scale */}
          <Section label={`Text Scale — ${style.fontSize.toFixed(1)}×`}>
            <input type="range" min={0.7} max={1.5} step={0.05} value={style.fontSize}
              onChange={(e) => update({ fontSize: Number(e.target.value) })}
              style={{ width: '100%', cursor: 'pointer' }} />
          </Section>

          {/* Reset */}
          <button type="button"
            onClick={() => { saveWidgetStyle(tileId, DEFAULT_WIDGET_STYLE); setStyle(DEFAULT_WIDGET_STYLE); onStyleChange(tileId, DEFAULT_WIDGET_STYLE); }}
            style={{ padding: '9px', borderRadius: 12, cursor: 'pointer', fontSize: 11, background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: 'rgba(255,150,150,0.6)' }}>
            ↺ Reset Widget
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(160,185,255,0.45)', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}
