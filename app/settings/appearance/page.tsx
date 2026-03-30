'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, Check } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { THEME_PRESETS } from '@/lib/ui/theme-engine';
import { THEME_PRESETS as GRADIENT_PRESETS, applyTheme, applyVoidTheme, isVoidThemeActive, type DeTheme } from '@/components/ThemeApplicator';
import { useCustomizeMode } from '@/lib/ui/CustomizeModeContext';

/* ── VOID / OLED Dark Theme Toggle ── */
function VoidThemeSection() {
  const [isVoid, setIsVoid] = useState(false);

  useEffect(() => {
    setIsVoid(isVoidThemeActive());
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ void: boolean }>;
      setIsVoid(ce.detail.void);
    };
    window.addEventListener('de-theme-mode-changed', handler);
    return () => window.removeEventListener('de-theme-mode-changed', handler);
  }, []);

  const toggle = () => {
    const next = !isVoid;
    setIsVoid(next);
    applyVoidTheme(next);
  };

  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 4 }}>
        VOID Mode
      </div>
      <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 12 }}>
        Deep OLED dark theme — electric neon, aurora backgrounds, maximum depth. Premium dark.
      </div>
      <button
        type="button"
        onClick={toggle}
        style={{
          width: '100%', padding: '16px 18px', borderRadius: 18, cursor: 'pointer', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          background: isVoid
            ? 'linear-gradient(135deg, rgba(4,8,20,0.95) 0%, rgba(8,18,40,0.90) 100%)'
            : 'rgba(8,18,40,0.06)',
          outline: isVoid ? '2px solid rgba(56,189,248,0.55)' : '1.5px solid rgba(160,195,240,0.30)',
          boxShadow: isVoid
            ? '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(56,189,248,0.12), inset 0 1px 0 rgba(56,189,248,0.10)'
            : '0 2px 8px rgba(0,0,0,0.04)',
          transition: 'all 0.22s cubic-bezier(0.34,1.2,0.64,1)',
        }}
        aria-pressed={isVoid}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            background: isVoid ? 'rgba(56,189,248,0.12)' : 'rgba(8,18,40,0.08)',
            border: isVoid ? '1px solid rgba(56,189,248,0.25)' : '1px solid rgba(160,195,240,0.22)',
            flexShrink: 0,
          }}>
            🌌
          </span>
          <span style={{ textAlign: 'left' }}>
            <span style={{
              display: 'block', fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em',
              color: isVoid ? 'rgba(226,240,255,0.95)' : 'var(--de-heading)',
              marginBottom: 2,
            }}>
              VOID — OLED Dark {isVoid && <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '1px 7px', borderRadius: 99, border: '1px solid rgba(56,189,248,0.25)' }}>ON</span>}
            </span>
            <span style={{ fontSize: 11, color: isVoid ? 'rgba(148,180,220,0.60)' : 'var(--de-text-dim)' }}>
              Neon glow · Deep glass · Aurora backgrounds
            </span>
          </span>
        </div>

        {/* Toggle pill */}
        <div style={{
          width: 48, height: 28, borderRadius: 99, padding: 3, flexShrink: 0,
          background: isVoid ? '#0ea5e9' : 'rgba(160,195,240,0.30)',
          transition: 'background 0.22s',
          display: 'flex', alignItems: 'center',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            transform: isVoid ? 'translateX(20px)' : 'translateX(0)',
            transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          }} />
        </div>
      </button>
    </section>
  );
}

/* ── Gradient Preset Picker ── */
function GradientThemePicker() {
  const [active, setActive] = useState(() => {
    if (typeof window === 'undefined') return 'default';
    try {
      const raw = localStorage.getItem('de-theme');
      if (raw) {
        const saved = JSON.parse(raw) as DeTheme & { id?: string };
        if (saved.id) return saved.id;
      }
    } catch { /* ignore */ }
    return 'default';
  });

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
  const [bgImage, setBgImage] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('dreamengin:bgImage');
    if (stored) {
      document.documentElement.style.setProperty('--de-bg-image', `url("${stored}")`);
      return stored;
    }
    return null;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const { enterCustomizeMode } = useCustomizeMode();

  // ── DB sync: load appearance settings on mount (Phase 8 §I Point 83) ──
  useEffect(() => {
    fetch('/api/settings/appearance')
      .then(r => r.json())
      .then((data: { ok: boolean; appearance: { presetId?: string; overrides?: Record<string, number> } | null }) => {
        if (data.ok && data.appearance) {
          if (data.appearance.presetId) setPreset(data.appearance.presetId);
          if (data.appearance.overrides) setOverrides(data.appearance.overrides);
        }
      })
      .catch(() => { /* localStorage values remain */ });
   
  }, []);

  // ── DB sync: save on presetId or overrides change (Phase 8 §I Point 83) ──
  // Debounce to avoid rapid writes during slider drags
  const debounceSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceSaveTimerRef.current) clearTimeout(debounceSaveTimerRef.current);
    debounceSaveTimerRef.current = setTimeout(() => {
      fetch('/api/settings/appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId, overrides }),
      }).catch(() => { /* localStorage cache remains */ });
    }, 800);
    return () => { if (debounceSaveTimerRef.current) clearTimeout(debounceSaveTimerRef.current); };
   
  }, [presetId, overrides]);

  const handleBrightness = useCallback((v: number) => setOverrides({ brightness: v }), [setOverrides]);
  const handleSaturation = useCallback((v: number) => setOverrides({ saturation: v }), [setOverrides]);
  const handleBlur = useCallback((v: number) => setOverrides({ blur: v }), [setOverrides]);

  return (
    <div className="min-h-screen dream-bg">
      {/* Header */}
      <header
        className="sticky top-0 z-30 de-glass"
        style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
      >
        <div className="flex items-center gap-3" style={{ padding: '14px 16px' }}>
          <Link
            href="/homedream"
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

        {/* ── Customize Mode entry points ── */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 4 }}>
            Customize Your Space
          </div>
          <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 12 }}>
            Personalize each page with your own colors, fonts, layouts, and effects.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {([
              { page: 'home'       as const, label: 'Home',       emoji: '🏠' },
              { page: 'profile'    as const, label: 'Profile',    emoji: '👤' },
              { page: 'dreamspace' as const, label: 'DreamSpace', emoji: '✦' },
              { page: 'feed'       as const, label: 'Feed',       emoji: '📡' },
            ]).map(({ page, label, emoji }) => (
              <button
                key={page}
                type="button"
                onClick={() => enterCustomizeMode(page)}
                style={{
                  padding: '14px 12px',
                  borderRadius: 16,
                  border: '1.5px solid rgba(58,111,216,0.22)',
                  background: 'rgba(58,111,216,0.06)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
                  color: 'var(--de-heading)',
                  transition: 'all 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ fontSize: 24 }}>{emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── VOID / OLED Dark Mode ── */}
        <VoidThemeSection />

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
