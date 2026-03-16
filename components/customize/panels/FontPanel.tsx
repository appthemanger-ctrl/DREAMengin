'use client';

import React from 'react';
import { useCustomizeMode } from '@/lib/ui/CustomizeModeContext';
import { type SkinFont } from '@/lib/ui/skin-engine';
import { SlidePanel } from './ColorPanel';

const FONTS: { id: SkinFont; label: string; preview: string; desc: string }[] = [
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    preview: 'DREAMengin',
    desc: 'Clean modern sans-serif — default',
  },
  {
    id: 'cormorant',
    label: 'Cormorant',
    preview: 'DREAMengin',
    desc: 'Elegant editorial serif',
  },
  {
    id: 'system',
    label: 'System',
    preview: 'DREAMengin',
    desc: 'Native device font',
  },
  {
    id: 'mono',
    label: 'Monospace',
    preview: 'DREAMengin',
    desc: 'Code-style monospace',
  },
];

const FONT_CSS: Record<SkinFont, string> = {
  'space-grotesk': '"Space Grotesk", system-ui, sans-serif',
  'cormorant':     '"Cormorant Garamond", Georgia, serif',
  'system':        'system-ui, -apple-system, sans-serif',
  'mono':          '"JetBrains Mono", "Fira Mono", monospace',
};

/**
 * FontPanel — choose the UI typeface for the current page skin.
 */
export default function FontPanel() {
  const { activePanel, closePanel, draftSkin, updateDraft } = useCustomizeMode();

  if (activePanel !== 'font') return null;

  return (
    <SlidePanel title="Font" onClose={closePanel}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {FONTS.map(({ id, label, preview, desc }) => {
          const isActive = draftSkin.fontFamily === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => updateDraft({ fontFamily: id })}
              aria-pressed={isActive}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                borderRadius: 14,
                border: 'none',
                cursor: 'pointer',
                background: isActive ? 'rgba(58,111,216,0.08)' : 'rgba(255,255,255,0.6)',
                outline: isActive ? '2px solid #3a6fd8' : '1.5px solid rgba(180,185,200,0.28)',
                textAlign: 'left',
                transition: 'all 0.15s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Preview */}
              <div style={{
                fontSize: 22,
                fontWeight: 700,
                fontFamily: FONT_CSS[id],
                color: isActive ? '#3a6fd8' : 'var(--de-heading)',
                minWidth: 120,
                flexShrink: 0,
              }}>
                {preview}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 2 }}>{desc}</div>
              </div>
              {/* Selected indicator */}
              {isActive && (
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#3a6fd8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </SlidePanel>
  );
}
