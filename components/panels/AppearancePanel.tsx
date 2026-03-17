'use client';

/**
 * AppearancePanel — Theme & Appearance settings rendered in Surface Space.
 * Real functionality: gradient themes, preset cards, custom adjustments.
 * Back button calls openInSurface('settings') — no routing.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Check } from 'lucide-react';
import { useTheme }          from '@/components/providers/ThemeProvider';
import { THEME_PRESETS, DEFAULT_OVERRIDES } from '@/lib/ui/theme-engine';
import { THEME_PRESETS as GRADIENT_PRESETS, applyTheme, type DeTheme } from '@/components/ThemeApplicator';
import { useCustomizeMode }  from '@/lib/ui/CustomizeModeContext';
import { useDreamSystem }    from '@/lib/dreamdm/DreamSystemContext';

// ── Gradient theme picker (same logic as appearance page) ────────────────────

function GradientThemePicker() {
  const [active, setActive] = useState('default');
  useEffect(() => {
    try {
      const raw = localStorage.getItem('de-theme');
      if (raw) { const s = JSON.parse(raw) as DeTheme & { id?: string }; if (s.id) setActive(s.id); }
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
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 4 }}>Gradient Theme</div>
      <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 12 }}>Sky-blue + gold gradients. Pick your vibe.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {Object.entries(GRADIENT_PRESETS).map(([id, { label, emoji, theme }]) => {
          const isActive = active === id;
          return (
            <button key={id} type="button" onClick={() => select(id)} style={{
              padding: '12px 10px', borderRadius: 14,
              border: isActive ? '2px solid var(--de-accent)' : '1.5px solid rgba(42,138,184,0.2)',
              background: isActive ? 'rgba(42,138,184,0.1)' : 'rgba(42,138,184,0.04)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              <span style={{ fontSize: 22 }}>{emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{label}</span>
              {isActive && <Check size={12} style={{ color: 'var(--de-accent)' }} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ── Slider control ────────────────────────────────────────────────────────────

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>{value.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--de-accent)' }} />
    </div>
  );
}

// ── Preset card ───────────────────────────────────────────────────────────────

function PresetCard({ preset, isActive, onSelect }: { preset: (typeof THEME_PRESETS)[number]; isActive: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} style={{
      padding: '12px 10px', borderRadius: 14, cursor: 'pointer',
      border: isActive ? '2px solid var(--de-accent)' : '1.5px solid var(--de-border)',
      background: isActive ? 'var(--de-mist)' : 'transparent',
      display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{preset.label}</span>
      {isActive && <Check size={12} style={{ color: 'var(--de-accent)' }} />}
    </button>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function AppearancePanel() {
  const { openInSurface }                               = useDreamSystem();
  const { presetId, overrides, setPreset, setOverrides, resetOverrides } = useTheme();
  const { enterCustomizeMode }                          = useCustomizeMode();

  const handleBrightness = useCallback((v: number) => setOverrides({ brightness: v }), [setOverrides]);
  const handleSaturation = useCallback((v: number) => setOverrides({ saturation: v }), [setOverrides]);
  const handleBlur       = useCallback((v: number) => setOverrides({ blur: v }),        [setOverrides]);
  const handleOpacity    = useCallback((v: number) => setOverrides({ glassOpacity: v }), [setOverrides]);

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(244,248,253,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(160,195,240,0.2)', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 52 }}>
          <button type="button" onClick={() => openInSurface('settings')} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(160,195,240,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={16} style={{ color: 'var(--de-heading)' }} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-heading)' }}>Theme & Appearance</span>
        </div>
      </header>

      <div style={{ padding: '20px 16px', maxWidth: 520, margin: '0 auto' }}>

        {/* Customize mode entry */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 4 }}>Customize Your Space</div>
          <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 12 }}>Personalize each region with your own colors, fonts, and effects.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {([
              { page: 'home'        as const, label: 'Home',       emoji: '🏠' },
              { page: 'profile'     as const, label: 'Profile',    emoji: '👤' },
              { page: 'dreamspace'  as const, label: 'DreamSpace', emoji: '✦' },
              { page: 'feed'        as const, label: 'Feed',       emoji: '📡' },
            ]).map(({ page, label, emoji }) => (
              <button key={page} type="button" onClick={() => enterCustomizeMode(page)} style={{
                padding: '14px 12px', borderRadius: 16,
                border: '1.5px solid rgba(58,111,216,0.22)', background: 'rgba(58,111,216,0.06)',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
                color: 'var(--de-heading)', transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 24 }}>{emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
              </button>
            ))}
          </div>
        </section>

        <GradientThemePicker />

        {/* Theme presets */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 12 }}>Theme Presets</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {THEME_PRESETS.map((p) => (
              <PresetCard key={p.id} preset={p} isActive={presetId === p.id} onSelect={() => setPreset(p.id)} />
            ))}
          </div>
        </section>

        {/* Custom adjustments */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--de-heading)' }}>Custom Adjustments</div>
            <button type="button" onClick={resetOverrides} style={{ padding: '5px 12px', borderRadius: 8, background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text-dim)', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <RotateCcw size={12} /> Reset
            </button>
          </div>
          <div className="de-widget-tile" style={{ padding: 18 }}>
            <Slider label="Brightness" value={overrides.brightness ?? DEFAULT_OVERRIDES.brightness} min={0.5} max={1.5} step={0.01} onChange={handleBrightness} />
            <Slider label="Saturation" value={overrides.saturation ?? DEFAULT_OVERRIDES.saturation} min={0} max={2} step={0.01} onChange={handleSaturation} />
            <Slider label="Blur Intensity" value={overrides.blur ?? DEFAULT_OVERRIDES.blur} min={0} max={40} step={1} onChange={handleBlur} />
            <Slider label="Glass Opacity" value={overrides.glassOpacity ?? DEFAULT_OVERRIDES.glassOpacity} min={0.05} max={0.5} step={0.01} onChange={handleOpacity} />
          </div>
        </section>
      </div>
    </div>
  );
}
