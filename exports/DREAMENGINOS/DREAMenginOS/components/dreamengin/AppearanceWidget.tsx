'use client';

import React, { useCallback } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { THEME_PRESETS, DEFAULT_OVERRIDES } from '@/lib/ui/theme-engine';

/* ── Slider ── */
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
    <div style={{ marginBottom: 14 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
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

/* ── Preset card ── */
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
        padding: 12,
        textAlign: 'center',
        cursor: 'pointer',
        borderColor: isActive ? 'var(--de-gold)' : undefined,
        borderWidth: isActive ? 2 : 1,
        transition: 'border-color 0.2s',
        minHeight: 72,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <div
        style={{
          width: 40, height: 20, borderRadius: 6,
          background: `linear-gradient(135deg, ${tokens.bgStart}, ${tokens.bgMid}, ${tokens.bgEnd})`,
          border: `1px solid ${tokens.glassBorder}`,
        }}
      />
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)' }}>
        {preset.label}
      </div>
      {isActive && (
        <div style={{
          fontSize: 8, fontWeight: 700, color: 'var(--de-gold)',
          background: 'rgba(200,152,26,0.12)', padding: '1px 6px', borderRadius: 100,
        }}>
          ACTIVE
        </div>
      )}
    </button>
  );
}

/* ── Main overlay widget ── */
export default function AppearanceWidget({ onClose }: { onClose: () => void }) {
  const { presetId, overrides, setPreset, setOverrides, resetOverrides } = useTheme();

  const handleBrightness = useCallback((v: number) => setOverrides({ brightness: v }), [setOverrides]);
  const handleSaturation = useCallback((v: number) => setOverrides({ saturation: v }), [setOverrides]);
  const handleBlur = useCallback((v: number) => setOverrides({ blur: v }), [setOverrides]);

  return (
    <div
      className="fixed inset-0 z-40"
      style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)' }}
      onPointerDown={onClose}
    >
      <div
        className="de-glass"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(24rem, 94vw)',
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: '22px 20px',
          borderRadius: '24px',
        }}
        onPointerDown={(e) => e.stopPropagation()}
        data-scrollable="y"
      >
        {/* Header */}
        <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--de-text-dim)' }}>
              System
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--de-heading)' }}>Appearance</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--de-mist)', border: '1px solid var(--de-border)',
              color: 'var(--de-text)', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Close Appearance"
          >
            x
          </button>
        </div>

        {/* Theme Presets */}
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 10 }}>
          Theme Presets
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 18 }}>
          {THEME_PRESETS.map((p) => (
            <PresetCard
              key={p.id}
              preset={p}
              isActive={presetId === p.id}
              onSelect={() => setPreset(p.id)}
            />
          ))}
        </div>

        {/* Custom Adjustments */}
        <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)' }}>
            Custom Adjustments
          </div>
          <button
            type="button"
            onClick={resetOverrides}
            style={{
              padding: '4px 10px', borderRadius: 8,
              background: 'var(--de-mist)', border: '1px solid var(--de-border)',
              color: 'var(--de-text-dim)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>

        <div className="de-widget-tile" style={{ padding: 16, marginBottom: 16 }}>
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

        {/* Live Preview */}
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 10 }}>
          Live Preview
        </div>
        <div className="de-glass" style={{ borderRadius: 16, padding: 16 }}>
          <div className="flex gap-3 items-center" style={{ marginBottom: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--de-gold), var(--de-accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: 'white', fontWeight: 700,
            }}>
              D
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)' }}>Dream Card</div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Preview of your current theme</div>
            </div>
          </div>
          <div className="flex gap-2">
            <div style={{
              flex: 1, padding: '8px 12px', borderRadius: 10,
              background: 'var(--de-gold)', color: 'white', textAlign: 'center',
              fontSize: 12, fontWeight: 700,
            }}>
              Gold
            </div>
            <div style={{
              flex: 1, padding: '8px 12px', borderRadius: 10,
              background: 'var(--de-accent)', color: 'white', textAlign: 'center',
              fontSize: 12, fontWeight: 700,
            }}>
              Accent
            </div>
          </div>
        </div>

        {/* Current Values */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14, textAlign: 'center' }}>
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
    </div>
  );
}
