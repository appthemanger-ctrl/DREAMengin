'use client';

import React, { useState } from 'react';
import { useCustomizeMode } from '@/lib/ui/CustomizeModeContext';
import { SKIN_PRESETS } from '@/lib/ui/skin-engine';

const GRADIENT_PRESETS = [
  { id: 'sky-gold',  label: 'Sky & Gold',  from: '#c8dff5', mid: '#d8eaf8', to: '#f5e8c4' },
  { id: 'ice',       label: 'Ice',         from: '#dce8f8', mid: '#c8d8f0', to: '#b8ceec' },
  { id: 'sunset',    label: 'Sunset',      from: '#fde8d0', mid: '#f0c8a8', to: '#e8b898' },
  { id: 'aurora',    label: 'Aurora',      from: '#c5d8f8', mid: '#d8e4f8', to: '#e8d4f8' },
  { id: 'mint',      label: 'Mint',        from: '#c8f0e8', mid: '#d8f0ef', to: '#c8dff5' },
  { id: 'dark',      label: 'Dark',        from: '#0a1b4d', mid: '#071236', to: '#020818' },
  { id: 'midnight',  label: 'Midnight',    from: '#0a0a1a', mid: '#060614', to: '#020208' },
  { id: 'neon-dark', label: 'Neon',        from: '#0d0d2b', mid: '#0a0a20', to: '#050515' },
];

const ACCENT_COLORS = [
  { color: '#c8981a', label: 'Gold'   },
  { color: '#4A9ED6', label: 'Blue'   },
  { color: '#6366f1', label: 'Indigo' },
  { color: '#22c55e', label: 'Green'  },
  { color: '#ec4899', label: 'Pink'   },
  { color: '#f97316', label: 'Orange' },
  { color: '#e87040', label: 'Coral'  },
  { color: '#a855d8', label: 'Purple' },
  { color: '#00ffe7', label: 'Cyan'   },
  { color: '#ef4444', label: 'Red'    },
];

/**
 * ColorPanel — slide-up sheet for background gradient + accent colour.
 */
export default function ColorPanel() {
  const { activePanel, closePanel, draftSkin, updateDraft } = useCustomizeMode();
  const [tab, setTab] = useState<'gradient' | 'accent' | 'presets'>('gradient');

  if (activePanel !== 'color') return null;

  return (
    <SlidePanel title="Color" onClose={closePanel}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['gradient', 'accent', 'presets'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 10, border: 'none',
              background: tab === t ? '#3a6fd8' : 'rgba(180,185,200,0.18)',
              color: tab === t ? '#fff' : 'var(--de-heading)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'gradient' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {GRADIENT_PRESETS.map(({ id, label, from, mid, to }) => {
            const isActive = draftSkin.bgFrom === from && draftSkin.bgTo === to;
            return (
              <button
                key={id}
                type="button"
                onClick={() => updateDraft({ bgFrom: from, bgMid: mid, bgTo: to })}
                aria-pressed={isActive}
                style={{
                  borderRadius: 14, padding: 10, border: 'none', cursor: 'pointer',
                  background: isActive ? 'rgba(58,111,216,0.08)' : 'rgba(255,255,255,0.5)',
                  outline: isActive ? '2px solid #3a6fd8' : '1.5px solid rgba(180,185,200,0.28)',
                  display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: '100%', height: 32, borderRadius: 8,
                  background: `linear-gradient(135deg, ${from}, ${mid}, ${to})`,
                }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)' }}>{label}</span>
              </button>
            );
          })}
          {/* Custom gradient */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 6, fontWeight: 600 }}>
              Custom gradient angle: {draftSkin.bgAngle}°
            </div>
            <input
              type="range" min={0} max={360} step={5}
              value={draftSkin.bgAngle}
              onChange={(e) => updateDraft({ bgAngle: Number(e.target.value) })}
              style={{ width: '100%' }}
              aria-label="Gradient angle"
            />
          </div>
        </div>
      )}

      {tab === 'accent' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
            {ACCENT_COLORS.map(({ color, label }) => {
              const isActive = draftSkin.accentColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateDraft({ accentColor: color })}
                  aria-label={label}
                  aria-pressed={isActive}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: 12, border: 'none',
                    background: color, cursor: 'pointer',
                    outline: isActive ? '3px solid rgba(0,0,0,0.5)' : '2px solid transparent',
                    transition: 'transform 0.12s',
                    transform: isActive ? 'scale(1.12)' : 'scale(1)',
                  }}
                />
              );
            })}
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 6, fontWeight: 600 }}>
              Custom color
            </div>
            <input
              type="color"
              value={draftSkin.accentColor}
              onChange={(e) => updateDraft({ accentColor: e.target.value })}
              style={{ width: '100%', height: 44, borderRadius: 10, border: 'none', cursor: 'pointer' }}
              aria-label="Custom accent color"
            />
          </div>
        </div>
      )}

      {tab === 'presets' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {SKIN_PRESETS.map((preset) => {
            const isActive =
              draftSkin.bgFrom === preset.skin.bgFrom &&
              draftSkin.bgTo   === preset.skin.bgTo;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => updateDraft({
                  bgFrom: preset.skin.bgFrom, bgMid: preset.skin.bgMid, bgTo: preset.skin.bgTo,
                  accentColor: preset.skin.accentColor,
                })}
                aria-pressed={isActive}
                style={{
                  borderRadius: 14, padding: 10, border: 'none', cursor: 'pointer',
                  background: isActive ? 'rgba(58,111,216,0.08)' : 'rgba(255,255,255,0.5)',
                  outline: isActive ? '2px solid #3a6fd8' : '1.5px solid rgba(180,185,200,0.28)',
                  display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'stretch',
                  transition: 'all 0.15s',
                  opacity: preset.tier === 'premium' ? 0.7 : 1,
                }}
              >
                <div style={{
                  width: '100%', height: 28, borderRadius: 8,
                  background: `linear-gradient(135deg, ${preset.skin.bgFrom}, ${preset.skin.bgMid}, ${preset.skin.bgTo})`,
                }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)' }}>
                    {preset.emoji} {preset.label}
                  </span>
                  {preset.tier === 'premium' && (
                    <span style={{
                      fontSize: 8, fontWeight: 800, color: '#c8981a',
                      background: 'rgba(200,152,26,0.12)',
                      padding: '2px 5px', borderRadius: 4,
                    }}>PRO</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </SlidePanel>
  );
}

// ── Reusable slide-up panel shell ─────────────────────────────────────────────

export function SlidePanel({
  title, children, onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          zIndex: 9990,
          background: 'rgba(0,0,0,0.18)',
        }}
      />
      {/* Sheet */}
      <div
        role="dialog"
        aria-label={`${title} customization`}
        style={{
          position: 'fixed',
          left: 0, right: 0,
          bottom: 68,   // sit above the toolbar
          zIndex: 9991,
          background: 'rgba(248,250,254,0.97)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderRadius: '20px 20px 0 0',
          border: '1px solid rgba(180,185,200,0.28)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.14)',
          maxHeight: '56vh',
          overflow: 'auto',
          padding: '20px 18px 24px',
        }}
      >
        {/* Drag handle */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ display: 'inline-block', width: 36, height: 4, borderRadius: 2, background: 'rgba(180,185,200,0.55)' }} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 14 }}>
          {title}
        </div>
        {children}
      </div>
    </>
  );
}
