'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { THEME_PRESETS, DEFAULT_OVERRIDES } from '@/lib/ui/theme-engine';

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
