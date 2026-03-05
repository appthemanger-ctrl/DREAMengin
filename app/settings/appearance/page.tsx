'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, Check } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { THEME_PRESETS, DEFAULT_OVERRIDES } from '@/lib/ui/theme-engine';
import { THEME_PRESETS as GRADIENT_PRESETS, applyTheme, type DeTheme } from '@/components/ThemeApplicator';

/* ── Gradient Preset Picker ── */
function GradientThemePicker() {
  const [active, setActive] = useState('default');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('de-theme');
      if (raw) {
        const saved = JSON.parse(raw) as DeTheme & { id?: string };
        if (saved.id) setActive(saved.id);
      }
    } catch { /* ignore */ }
  }, []);

  const select = (id: string) => {
    const preset = GRADIENT_PRESETS[id];
    if (!preset) return;
    setActive(id);
    const value = { ...preset.theme, id };
    localStorage.setItem('de-theme', JSON.stringify(value));
    applyTheme(preset.theme);
    window.dispatchEvent(new Event('de-theme-changed'));
  };

  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 4 }}>
        Gradient Theme
      </div>
      <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 12 }}>
        Sky-blue + gold gradients, everywhere. Pick your vibe.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {Object.entries(GRADIENT_PRESETS).map(([id, { label, emoji, theme }]) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => select(id)}
              style={{
                borderRadius: 16, padding: '14px 12px', cursor: 'pointer', border: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                background: isActive ? 'rgba(200,152,26,0.08)' : 'rgba(255,255,255,0.5)',
                outline: isActive ? '2px solid var(--de-gold)' : '1.5px solid rgba(160,195,240,0.35)',
                boxShadow: isActive ? '0 0 0 3px rgba(200,152,26,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.18s',
              }}
              aria-pressed={isActive}
            >
              {/* Gradient swatch */}
              <div style={{
                width: '100%', height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${theme.from}, ${theme.mid}, ${theme.to})`,
                border: '1px solid rgba(255,255,255,0.4)',
              }} />
              <div style={{ fontSize: 18 }}>{emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{label}</div>
              {isActive && (
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--de-gold)', background: 'rgba(200,152,26,0.12)', padding: '2px 8px', borderRadius: 999 }}>
                  ✦ ACTIVE
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}


/* ── Slider component (styled with Dream tokens) ── */
function Slider({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--de-text-dim)', fontWeight: 500, minWidth: 44, textAlign: 'right' }}>
          {value.toFixed(step < 1 ? 2 : 0)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          appearance: 'none',
          background: `linear-gradient(to right, var(--de-accent) 0%, var(--de-accent) ${((value - min) / (max - min)) * 100}%, var(--de-border) ${((value - min) / (max - min)) * 100}%, var(--de-border) 100%)`,
          outline: 'none',
          cursor: 'pointer',
        }}
        aria-label={label}
      />
    </div>
  );
}

/* ── Preset cards ── */
function PresetCard({
  preset,
  isActive,
  onSelect,
}: {
  preset: (typeof THEME_PRESETS)[number];
  isActive: boolean;
  onSelect: () => void;
}) {
  const { tokens } = preset;
  return (
    <button
      type="button"
      onClick={onSelect}
      className="de-widget-tile"
      style={{
        padding: 14,
        textAlign: 'center',
        cursor: 'pointer',
        borderColor: isActive ? 'var(--de-gold)' : undefined,
        borderWidth: isActive ? 2 : 1,
        transition: 'border-color 0.2s, transform 0.15s',
        minHeight: 90,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      {/* Mini gradient swatch */}
      <div
        style={{
          width: 48, height: 24, borderRadius: 8,
          background: `linear-gradient(135deg, ${tokens.bgStart}, ${tokens.bgMid}, ${tokens.bgEnd})`,
          border: `1px solid ${tokens.glassBorder}`,
        }}
      />
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>
        {preset.label}
      </div>
      {isActive && (
        <div style={{
          fontSize: 9, fontWeight: 700, color: 'var(--de-gold)',
          background: 'rgba(200,152,26,0.12)', padding: '2px 8px', borderRadius: 100,
        }}>
          ACTIVE
        </div>
      )}
    </button>
  );
}

/* ── Background Image Section ── */
function BgImageSection() {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('dreamengin:bgImage');
    if (stored) {
      setBgImage(stored);
      document.documentElement.style.setProperty('--de-bg-image', `url("${stored}")`);
    }
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setBgImage(dataUrl);
      localStorage.setItem('dreamengin:bgImage', dataUrl);
      document.documentElement.style.setProperty('--de-bg-image', `url("${dataUrl}")`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setBgImage(null);
    localStorage.removeItem('dreamengin:bgImage');
    document.documentElement.style.removeProperty('--de-bg-image');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 12 }}>
        Background Image
      </div>
      <div className="de-widget-tile" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {bgImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bgImage}
            alt="Background preview"
            style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--de-border)' }}
          />
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '8px 16px', borderRadius: 10,
              background: 'var(--de-mist)', border: '1px solid var(--de-border)',
              color: 'var(--de-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Upload Image
          </button>
          {bgImage && (
            <button
              type="button"
              onClick={handleRemove}
              style={{
                padding: '8px 16px', borderRadius: 10,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Remove
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>
    </section>
  );
}

const ACCENT_SWATCHES = [
  { label: 'Gold',   hue: 43,  color: '#c8981a', darkText: true },
  { label: 'Blue',   hue: 210, color: '#3b82f6', darkText: false },
  { label: 'Purple', hue: 265, color: '#8b5cf6', darkText: false },
  { label: 'Green',  hue: 142, color: '#22c55e', darkText: false },
  { label: 'Red',    hue: 0,   color: '#ef4444', darkText: false },
  { label: 'Orange', hue: 25,  color: '#f97316', darkText: true },
  { label: 'Pink',   hue: 330, color: '#ec4899', darkText: false },
  { label: 'Teal',   hue: 174, color: '#14b8a6', darkText: false },
];

const BG_STYLES = [
  {
    presetId: 'dream-ice',
    label: 'Cosmic',
    preview: 'linear-gradient(135deg, #dce8f8 0%, #c5d8f0 50%, #b8ceec 100%)',
  },
  {
    presetId: 'dream-dark',
    label: 'Night',
    preview: 'linear-gradient(135deg, #0a1628 0%, #071236 50%, #020818 100%)',
  },
  {
    presetId: 'dream-midnight',
    label: 'Neon',
    preview: 'linear-gradient(135deg, #0a0a1a 0%, #060614 50%, #020208 100%)',
  },
  {
    presetId: 'dream-sunset',
    label: 'Minimal',
    preview: 'linear-gradient(135deg, #fde8d8 0%, #f0c8a8 50%, #e8b898 100%)',
  },
];

export default function AppearanceSettingsPage() {
  const { presetId, overrides, setPreset, setOverrides, resetOverrides } = useTheme();

  const handleBrightness = useCallback((v: number) => setOverrides({ brightness: v }), [setOverrides]);
  const handleSaturation = useCallback((v: number) => setOverrides({ saturation: v }), [setOverrides]);
  const handleBlur = useCallback((v: number) => setOverrides({ blur: v }), [setOverrides]);
  const handleOpacity = useCallback((v: number) => setOverrides({ glassOpacity: v }), [setOverrides]);

  return (
    <div className="min-h-screen dream-bg">
      {/* Header */}
      <header
        className="sticky top-0 z-30 de-glass"
        style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
      >
        <div className="flex items-center gap-3" style={{ padding: '14px 16px' }}>
          <Link
            href="/home"
            className="flex items-center justify-center"
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--de-mist)', border: '1px solid var(--de-border)',
            }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--de-heading)' }} />
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--de-heading)' }}>Appearance</h1>
        </div>
      </header>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── Gradient Theme — user-editable sky+gold ── */}
        <GradientThemePicker />

        {/* Theme Presets */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 12 }}>
            Theme Presets
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {THEME_PRESETS.map((p) => (
              <PresetCard
                key={p.id}
                preset={p}
                isActive={presetId === p.id}
                onSelect={() => setPreset(p.id)}
              />
            ))}
          </div>
        </section>

        {/* Custom Adjustments */}
        <section style={{ marginBottom: 24 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--de-heading)' }}>
              Custom Adjustments
            </div>
            <button
              type="button"
              onClick={resetOverrides}
              className="flex items-center gap-1"
              style={{
                padding: '5px 12px', borderRadius: 8,
                background: 'var(--de-mist)', border: '1px solid var(--de-border)',
                color: 'var(--de-text-dim)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>

          <div className="de-widget-tile" style={{ padding: 18 }}>
            <Slider
              label="Brightness"
              value={overrides.brightness}
              min={0.5}
              max={1.5}
              step={0.01}
              onChange={handleBrightness}
            />
            <Slider
              label="Saturation"
              value={overrides.saturation}
              min={0}
              max={2}
              step={0.01}
              onChange={handleSaturation}
            />
            <Slider
              label="Glass Blur"
              value={overrides.blur}
              min={4}
              max={48}
              step={1}
              unit="px"
              onChange={handleBlur}
            />
          </div>
        </section>

        {/* Accent Color */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 12 }}>
            Accent Color
          </div>
          <div className="de-widget-tile" style={{ padding: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {ACCENT_SWATCHES.map((swatch) => {
                const isActive = overrides.accentHue === swatch.hue;
                return (
                  <button
                    key={swatch.hue}
                    type="button"
                    onClick={() => setOverrides({ accentHue: swatch.hue })}
                    title={swatch.label}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: swatch.color,
                      border: isActive ? '3px solid var(--de-heading)' : '3px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isActive ? `0 0 0 2px var(--de-gold)` : '0 2px 8px rgba(0,0,0,0.15)',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      flexShrink: 0,
                    }}
                    aria-label={`Set accent to ${swatch.label}`}
                    aria-pressed={isActive}
                  >
                    {isActive && (
                      <Check
                        size={16}
                        color={swatch.darkText ? '#333' : 'white'}
                        strokeWidth={3}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {overrides.accentHue !== -1 && (
              <button
                type="button"
                onClick={() => setOverrides({ accentHue: -1 })}
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  color: 'var(--de-text-dim)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Reset to preset default
              </button>
            )}
          </div>
        </section>

        {/* Background Style */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 12 }}>
            Background Style
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {BG_STYLES.map((bg) => {
              const isActive = presetId === bg.presetId;
              return (
                <button
                  key={bg.presetId}
                  type="button"
                  onClick={() => setPreset(bg.presetId)}
                  className="de-widget-tile"
                  style={{
                    padding: 14,
                    cursor: 'pointer',
                    borderColor: isActive ? 'var(--de-gold)' : undefined,
                    borderWidth: isActive ? 2 : 1,
                    transition: 'border-color 0.2s, transform 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  aria-pressed={isActive}
                >
                  <div
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 10,
                      background: bg.preview,
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  />
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>
                    {bg.label}
                  </div>
                  {isActive && (
                    <div style={{
                      fontSize: 9, fontWeight: 700, color: 'var(--de-gold)',
                      background: 'rgba(200,152,26,0.12)', padding: '2px 8px', borderRadius: 100,
                    }}>
                      ACTIVE
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Live Preview */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 12 }}>
            Live Preview
          </div>
          <div className="de-glass" style={{ borderRadius: 20, padding: 18 }}>
            <div className="flex gap-3 items-center" style={{ marginBottom: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, var(--de-gold), var(--de-accent))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: 'white', fontWeight: 700,
              }}>
                D
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--de-heading)' }}>Dream Card</div>
                <div style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>Preview of your current theme</div>
              </div>
            </div>
            <div className="de-widget-tile" style={{ padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)', marginBottom: 6 }}>Widget Tile</div>
              <div style={{ fontSize: 12, color: 'var(--de-text)', lineHeight: 1.5 }}>
                This is how your Dream surfaces will look with the current settings. Adjust the sliders above to customize.
              </div>
            </div>
            <div className="flex gap-2" style={{ marginTop: 10 }}>
              <div style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                background: 'var(--de-gold)', color: 'white', textAlign: 'center',
                fontSize: 12, fontWeight: 700,
              }}>
                Gold Button
              </div>
              <div style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                background: 'var(--de-accent)', color: 'white', textAlign: 'center',
                fontSize: 12, fontWeight: 700,
              }}>
                Accent Button
              </div>
            </div>
          </div>
        </section>

        {/* Background Image */}
        <BgImageSection />

        {/* Current Values Debug */}
        <section style={{ marginBottom: 24 }}>
          <div className="de-widget-tile" style={{ padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              Current Values
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-heading)' }}>
                  {(overrides.brightness * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>Brightness</div>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-gold)' }}>
                  {(overrides.saturation * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>Saturation</div>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-accent)' }}>
                  {overrides.blur}px
                </div>
                <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>Blur</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
