'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ColorPicker from '@/components/ui/ColorPicker';
import {
  DEFAULT_BG, PRESET_BACKGROUNDS, loadBackground, saveBackground, buildBackgroundCSS,
  type BackgroundConfig, type GradientStop, type TextureKind,
} from '@/lib/themes/background';

type Tab = 'presets' | 'color' | 'gradient' | 'image' | 'texture';

type Props = {
  onClose: () => void;
  onBgChange: (cfg: BackgroundConfig) => void;
};

export default function BackgroundEditor({ onClose, onBgChange }: Props) {
  const [cfg, setCfg] = useState<BackgroundConfig>(DEFAULT_BG);
  const [tab, setTab] = useState<Tab>('presets');

  useEffect(() => { setCfg(loadBackground()); }, []);

  const update = useCallback((partial: Partial<BackgroundConfig>) => {
    setCfg((prev) => {
      const next = { ...prev, ...partial };
      saveBackground(next);
      onBgChange(next);
      return next;
    });
  }, [onBgChange]);

  const updateGradient = useCallback((partial: Partial<BackgroundConfig['gradient']>) => {
    setCfg((prev) => {
      const next = { ...prev, gradient: { ...prev.gradient, ...partial } };
      saveBackground(next);
      onBgChange(next);
      return next;
    });
  }, [onBgChange]);

  const updateImage = useCallback((partial: Partial<BackgroundConfig['image']>) => {
    setCfg((prev) => {
      const next = { ...prev, image: { ...prev.image, ...partial } };
      saveBackground(next);
      onBgChange(next);
      return next;
    });
  }, [onBgChange]);

  const applyPreset = useCallback((p: typeof PRESET_BACKGROUNDS[0]) => {
    setCfg((prev) => {
      const next = { ...prev, ...p.cfg } as BackgroundConfig;
      saveBackground(next);
      onBgChange(next);
      return next;
    });
  }, [onBgChange]);

  const previewStyle = buildBackgroundCSS(cfg);

  const TABS: Array<{ id: Tab; label: string }> = [
    { id: 'presets',  label: '✦ Presets'  },
    { id: 'color',    label: '⬤ Color'    },
    { id: 'gradient', label: '◐ Gradient' },
    { id: 'image',    label: '🖼 Image'   },
    { id: 'texture',  label: '⊞ Texture'  },
  ];

  return (
    /* ── Bottom sheet ── */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      {/* Scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

      {/* Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', zIndex: 1,
          background: 'rgba(4,10,30,0.97)',
          borderTop: '1px solid rgba(100,150,255,0.15)',
          borderRadius: '24px 24px 0 0',
          maxHeight: '80dvh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(160,185,255,0.2)' }} />
        </div>

        {/* Header + live preview */}
        <div style={{ padding: '0 18px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'rgba(240,244,255,0.95)' }}>Design Your Space</div>
            <div style={{ fontSize: 11, color: 'rgba(160,185,255,0.45)', marginTop: 2 }}>Changes apply instantly</div>
          </div>
          {/* Mini live preview */}
          <div style={{ width: 56, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, overflow: 'hidden', ...previewStyle }} />
          <button type="button" onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'rgba(160,185,255,0.5)', padding: 4, lineHeight: 1 }}>
            ✕
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, padding: '0 16px 12px', overflowX: 'auto' }}>
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                background: tab === t.id ? 'rgba(100,150,255,0.2)' : 'rgba(100,150,255,0.06)',
                border: tab === t.id ? '1px solid rgba(100,150,255,0.4)' : '1px solid rgba(100,150,255,0.1)',
                color: tab === t.id ? 'rgba(200,220,255,0.95)' : 'rgba(160,185,255,0.5)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 32px' }}>

          {/* PRESETS */}
          {tab === 'presets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {PRESET_BACKGROUNDS.map((p) => (
                  <button key={p.id} type="button" onClick={() => applyPreset(p)}
                    style={{
                      padding: 0, border: 'none', cursor: 'pointer', borderRadius: 14,
                      overflow: 'hidden', aspectRatio: '1',
                      outline: cfg.accent === (p.cfg.accent ?? '') ? '2px solid rgba(255,255,255,0.6)' : 'none',
                      outlineOffset: 2, background: 'none',
                    }}>
                    <div style={{
                      height: '100%', width: '100%', borderRadius: 14, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 4,
                      ...buildBackgroundCSS({ ...DEFAULT_BG, ...p.cfg } as BackgroundConfig),
                    }}>
                      <span style={{ fontSize: 22 }}>{p.emoji}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em' }}>{p.label.toUpperCase()}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Accent color */}
              <div style={{ marginTop: 8 }}>
                <ColorPicker label="Accent Color" value={cfg.accent}
                  onChange={(v) => update({ accent: v })} />
              </div>

              {/* Reset */}
              <button type="button" onClick={() => { saveBackground(DEFAULT_BG); onBgChange(DEFAULT_BG); setCfg(DEFAULT_BG); }}
                style={{ marginTop: 4, padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 11,
                  background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)',
                  color: 'rgba(255,150,150,0.7)' }}>
                ↺ Reset to Default
              </button>
            </div>
          )}

          {/* SOLID COLOR */}
          {tab === 'color' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {(['solid', 'gradient'] as const).map((t) => (
                  <button key={t} type="button" onClick={() => update({ type: t })}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 12, cursor: 'pointer', fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                      background: cfg.type === t ? 'rgba(100,150,255,0.2)' : 'rgba(100,150,255,0.06)',
                      border: cfg.type === t ? '1px solid rgba(100,150,255,0.4)' : '1px solid rgba(100,150,255,0.1)',
                      color: cfg.type === t ? 'rgba(200,220,255,0.95)' : 'rgba(160,185,255,0.5)',
                    }}>
                    {t}
                  </button>
                ))}
              </div>
              <ColorPicker label="Background Color" value={cfg.solid}
                onChange={(v) => update({ solid: v, type: 'solid' })} />
              <ColorPicker label="Accent Color" value={cfg.accent}
                onChange={(v) => update({ accent: v })} />
              <OverlaySlider value={cfg.overlay} onChange={(v) => update({ overlay: v })} />
            </div>
          )}

          {/* GRADIENT */}
          {tab === 'gradient' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Type */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(160,185,255,0.5)', marginBottom: 8 }}>Type</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['linear','radial','conic'] as const).map((k) => (
                    <button key={k} type="button" onClick={() => updateGradient({ kind: k })}
                      style={{
                        flex: 1, padding: '7px 0', borderRadius: 10, cursor: 'pointer', fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                        background: cfg.gradient.kind === k ? 'rgba(100,150,255,0.2)' : 'rgba(100,150,255,0.06)',
                        border: cfg.gradient.kind === k ? '1px solid rgba(100,150,255,0.4)' : '1px solid rgba(100,150,255,0.1)',
                        color: cfg.gradient.kind === k ? 'rgba(200,220,255,0.95)' : 'rgba(160,185,255,0.5)',
                      }}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* Angle */}
              {cfg.gradient.kind === 'linear' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(160,185,255,0.5)' }}>Angle</span>
                    <span style={{ fontSize: 11, color: 'rgba(200,220,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>{cfg.gradient.angle}°</span>
                  </div>
                  <input type="range" min={0} max={360} value={cfg.gradient.angle}
                    onChange={(e) => updateGradient({ angle: Number(e.target.value) })}
                    style={{ width: '100%', cursor: 'pointer' }} />
                </div>
              )}

              {/* Color stops */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(160,185,255,0.5)', marginBottom: 10 }}>Color Stops</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {cfg.gradient.stops.map((stop, i) => (
                    <StopEditor key={i} stop={stop}
                      onChange={(s) => {
                        const stops = cfg.gradient.stops.map((x, j) => j === i ? s : x);
                        updateGradient({ stops });
                      }}
                      onRemove={cfg.gradient.stops.length > 2 ? () => {
                        updateGradient({ stops: cfg.gradient.stops.filter((_, j) => j !== i) });
                      } : undefined}
                    />
                  ))}
                  {cfg.gradient.stops.length < 6 && (
                    <button type="button"
                      onClick={() => updateGradient({ stops: [...cfg.gradient.stops, { color: '#6366f1', pos: 75 }] })}
                      style={{ padding: '8px', borderRadius: 10, cursor: 'pointer', fontSize: 12,
                        background: 'rgba(100,150,255,0.06)', border: '1px dashed rgba(100,150,255,0.2)',
                        color: 'rgba(160,185,255,0.5)' }}>
                      + Add Stop
                    </button>
                  )}
                </div>
              </div>

              <OverlaySlider value={cfg.overlay} onChange={(v) => update({ overlay: v })} />
              <ColorPicker label="Accent Color" value={cfg.accent} onChange={(v) => update({ accent: v })} />
            </div>
          )}

          {/* IMAGE */}
          {tab === 'image' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(160,185,255,0.5)', marginBottom: 6 }}>Image URL</div>
                <input type="url" value={cfg.image.url} placeholder="https://…"
                  onChange={(e) => updateImage({ url: e.target.value })}
                  style={{ width: '100%', background: 'rgba(100,150,255,0.08)', border: '1px solid rgba(100,150,255,0.2)',
                    borderRadius: 10, padding: '9px 12px', color: 'rgba(240,244,255,0.9)', fontSize: 12, outline: 'none' }} />
              </div>

              {/* Fit */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(160,185,255,0.5)', marginBottom: 8 }}>Fit</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['cover','tile','center'] as const).map((f) => (
                    <button key={f} type="button" onClick={() => updateImage({ fit: f })}
                      style={{
                        flex: 1, padding: '7px 0', borderRadius: 10, cursor: 'pointer', fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                        background: cfg.image.fit === f ? 'rgba(100,150,255,0.2)' : 'rgba(100,150,255,0.06)',
                        border: cfg.image.fit === f ? '1px solid rgba(100,150,255,0.4)' : '1px solid rgba(100,150,255,0.1)',
                        color: cfg.image.fit === f ? 'rgba(200,220,255,0.95)' : 'rgba(160,185,255,0.5)',
                      }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <RangeRow label="Opacity" min={0} max={1} step={0.01} value={cfg.image.opacity}
                display={`${Math.round(cfg.image.opacity * 100)}%`}
                onChange={(v) => updateImage({ opacity: v })} />

              <RangeRow label="Blur" min={0} max={20} step={1} value={cfg.image.blur}
                display={`${cfg.image.blur}px`}
                onChange={(v) => updateImage({ blur: v })} />

              <OverlaySlider value={cfg.overlay} onChange={(v) => update({ overlay: v })} />
            </div>
          )}

          {/* TEXTURE */}
          {tab === 'texture' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {(['none','noise','dots','grid','waves','hex'] as TextureKind[]).map((k) => (
                  <button key={k} type="button" onClick={() => update({ texture: k })}
                    style={{
                      padding: '12px 0', borderRadius: 12, cursor: 'pointer', fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                      background: cfg.texture === k ? 'rgba(100,150,255,0.2)' : 'rgba(100,150,255,0.06)',
                      border: cfg.texture === k ? '1px solid rgba(100,150,255,0.4)' : '1px solid rgba(100,150,255,0.1)',
                      color: cfg.texture === k ? 'rgba(200,220,255,0.95)' : 'rgba(160,185,255,0.5)',
                    }}>
                    {k === 'none' ? '✗ None' : k}
                  </button>
                ))}
              </div>
              {cfg.texture !== 'none' && (
                <RangeRow label="Intensity" min={0} max={0.3} step={0.005} value={cfg.textureOpacity}
                  display={`${Math.round(cfg.textureOpacity * 100)}%`}
                  onChange={(v) => update({ textureOpacity: v })} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StopEditor({ stop, onChange, onRemove }: {
  stop: GradientStop;
  onChange: (s: GradientStop) => void;
  onRemove?: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8,
      padding: 10, background: 'rgba(100,150,255,0.05)', borderRadius: 10,
      border: '1px solid rgba(100,150,255,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: stop.color, flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.15)' }} />
        <span style={{ fontSize: 11, color: 'rgba(200,220,255,0.6)', flex: 1 }}>Stop at {stop.pos}%</span>
        {onRemove && (
          <button type="button" onClick={onRemove}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(255,100,100,0.5)', padding: 2 }}>
            ✕
          </button>
        )}
      </div>
      <ColorPicker value={stop.color} onChange={(c) => onChange({ ...stop, color: c })} />
      <RangeRow label="Position" min={0} max={100} step={1} value={stop.pos}
        display={`${stop.pos}%`} onChange={(v) => onChange({ ...stop, pos: v })} />
    </div>
  );
}

function RangeRow({ label, min, max, step, value, display, onChange }: {
  label: string; min: number; max: number; step: number; value: number;
  display: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(160,185,255,0.5)' }}>{label}</span>
        <span style={{ fontSize: 11, color: 'rgba(200,220,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', cursor: 'pointer' }} />
    </div>
  );
}

function OverlaySlider({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Parse opacity from rgba string
  const match = value.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
  const opacity = match ? parseFloat(match[4]) : 0.45;
  const rgb = match ? `${match[1]},${match[2]},${match[3]}` : '2,8,24';
  return (
    <RangeRow label="Dark Overlay" min={0} max={0.9} step={0.01} value={opacity}
      display={`${Math.round(opacity * 100)}%`}
      onChange={(v) => onChange(`rgba(${rgb},${v.toFixed(2)})`)} />
  );
}
