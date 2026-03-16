'use client';

import React from 'react';
import { useCustomizeMode } from '@/lib/ui/CustomizeModeContext';
import { type SkinLayout, type SkinShadow } from '@/lib/ui/skin-engine';
import { SlidePanel } from './ColorPanel';

const LAYOUTS: { id: SkinLayout; label: string; icon: string; desc: string }[] = [
  {
    id: 'card',
    label: 'Card',
    icon: '⊞',
    desc: 'Rounded cards with glass surfaces',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    icon: '▭',
    desc: 'Clean lines, flat backgrounds',
  },
  {
    id: 'compact',
    label: 'Compact',
    icon: '≡',
    desc: 'Dense layout, more content per view',
  },
];

const SHADOWS: { id: SkinShadow; label: string; desc: string }[] = [
  { id: 'none',   label: 'None',   desc: 'No shadow' },
  { id: 'soft',   label: 'Soft',   desc: 'Subtle diffuse glow' },
  { id: 'medium', label: 'Medium', desc: 'Balanced depth' },
  { id: 'strong', label: 'Strong', desc: 'Deep shadow' },
];

/**
 * LayoutPanel — choose the widget layout density and shadow depth.
 */
export default function LayoutPanel() {
  const { activePanel, closePanel, draftSkin, updateDraft } = useCustomizeMode();

  if (activePanel !== 'layout') return null;

  return (
    <SlidePanel title="Layout" onClose={closePanel}>
      {/* Layout density */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-text-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Layout Style
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {LAYOUTS.map(({ id, label, icon, desc }) => {
            const isActive = draftSkin.layout === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => updateDraft({ layout: id })}
                aria-pressed={isActive}
                style={{
                  padding: '12px 8px',
                  borderRadius: 14,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(58,111,216,0.08)' : 'rgba(255,255,255,0.6)',
                  outline: isActive ? '2px solid #3a6fd8' : '1.5px solid rgba(180,185,200,0.28)',
                  display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
                  transition: 'all 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{label}</span>
                <span style={{ fontSize: 9, color: 'var(--de-text-dim)', textAlign: 'center' }}>{desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Widget border radius */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Border Radius
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>
            {draftSkin.widgetRadius}px
          </span>
        </div>
        <input
          type="range" min={4} max={32} step={2}
          value={draftSkin.widgetRadius}
          onChange={(e) => updateDraft({ widgetRadius: Number(e.target.value) })}
          style={{ width: '100%' }}
          aria-label="Widget border radius"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--de-text-dim)', marginTop: 4 }}>
          <span>Sharp</span>
          <span>Rounded</span>
        </div>
      </div>

      {/* Shadow */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-text-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Shadow
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {SHADOWS.map(({ id, label }) => {
            const isActive = draftSkin.widgetShadow === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => updateDraft({ widgetShadow: id })}
                aria-pressed={isActive}
                style={{
                  padding: '10px 4px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(58,111,216,0.08)' : 'rgba(255,255,255,0.6)',
                  outline: isActive ? '2px solid #3a6fd8' : '1.5px solid rgba(180,185,200,0.28)',
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#3a6fd8' : 'var(--de-heading)',
                  transition: 'all 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </SlidePanel>
  );
}
