'use client';

import React, { useCallback } from 'react';

// ── Color conversion helpers ──────────────────────────────────────────────────
export function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToHex(h: number, s: number, l: number): string {
  const hn = h / 360, sn = s / 100, ln = l / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  if (sn === 0) { const v = Math.round(ln * 255); return `#${v.toString(16).padStart(2,'0').repeat(3)}`; }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const r = Math.round(hue2rgb(p, q, hn + 1/3) * 255);
  const g = Math.round(hue2rgb(p, q, hn) * 255);
  const b = Math.round(hue2rgb(p, q, hn - 1/3) * 255);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// ── Slider with gradient track ────────────────────────────────────────────────
function Track({ min, max, value, trackStyle, onChange }: {
  min: number; max: number; value: number;
  trackStyle: string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ position: 'relative', height: 22, display: 'flex', alignItems: 'center' }}>
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 10,
        borderRadius: 10, background: trackStyle, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
      }} />
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ position: 'relative', width: '100%', WebkitAppearance: 'none',
          appearance: 'none', background: 'transparent', zIndex: 1, cursor: 'pointer', margin: 0 }}
      />
    </div>
  );
}

// ── Main ColorPicker ──────────────────────────────────────────────────────────
type Props = {
  value: string;             // hex color
  onChange: (hex: string) => void;
  label?: string;
};

export default function ColorPicker({ value, onChange, label }: Props) {
  const safe = /^#[0-9a-f]{6}$/i.test(value) ? value : '#6366f1';
  const [h, s, l] = hexToHsl(safe);

  const set = useCallback((nh: number, ns: number, nl: number) => {
    onChange(hslToHex(nh, ns, nl));
  }, [onChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(160,185,255,0.5)', marginBottom: 2 }}>{label}</div>}

      {/* Preview swatch + hex input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: safe, flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.15)', boxShadow: `0 0 12px ${safe}66` }} />
        <input
          type="text" value={safe}
          onChange={(e) => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value); }}
          maxLength={7}
          style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '6px 10px', color: 'rgba(240,244,255,0.9)',
            fontSize: 13, fontFamily: 'monospace', outline: 'none', letterSpacing: '0.05em' }}
        />
      </div>

      {/* Hue */}
      <div>
        <div style={{ fontSize: 9, color: 'rgba(160,185,255,0.4)', marginBottom: 4 }}>Hue</div>
        <Track min={0} max={360} value={h}
          trackStyle="linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)"
          onChange={(v) => set(v, s, l)} />
      </div>

      {/* Saturation */}
      <div>
        <div style={{ fontSize: 9, color: 'rgba(160,185,255,0.4)', marginBottom: 4 }}>Saturation</div>
        <Track min={0} max={100} value={s}
          trackStyle={`linear-gradient(to right,hsl(${h},0%,${l}%),hsl(${h},100%,${l}%))`}
          onChange={(v) => set(h, v, l)} />
      </div>

      {/* Lightness */}
      <div>
        <div style={{ fontSize: 9, color: 'rgba(160,185,255,0.4)', marginBottom: 4 }}>Lightness</div>
        <Track min={0} max={100} value={l}
          trackStyle={`linear-gradient(to right,#000,hsl(${h},${s}%,50%),#fff)`}
          onChange={(v) => set(h, s, v)} />
      </div>
    </div>
  );
}
