'use client';

import React from 'react';
import { useCustomizeMode } from '@/lib/ui/CustomizeModeContext';

/**
 * CustomizeToolbar — fixed bottom toolbar shown in customize mode.
 * Tabs: Color | Font | Layout | Effects | Save
 */
export default function CustomizeToolbar() {
  const { isCustomizeMode, activePanel, openPanel, saveSkin } = useCustomizeMode();

  if (!isCustomizeMode) return null;

  const TABS = [
    { id: 'color'   as const, icon: '🎨', label: 'Color'   },
    { id: 'font'    as const, icon: '𝗔',  label: 'Font'    },
    { id: 'layout'  as const, icon: '⊞',  label: 'Layout'  },
    { id: 'effects' as const, icon: '✦',  label: 'Effects' },
  ] as const;

  return (
    <div
      role="toolbar"
      aria-label="Customization options"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(180,185,200,0.28)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        height: 68,
        gap: 4,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(({ id, icon, label }) => {
        const isActive = activePanel === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => openPanel(id)}
            aria-pressed={isActive}
            aria-label={`${label} customization`}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '8px 4px',
              background: isActive ? 'rgba(58,111,216,0.10)' : 'none',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              color: isActive ? '#3a6fd8' : 'rgba(30,40,60,0.65)',
              transition: 'all 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{label}</span>
          </button>
        );
      })}

      {/* Save button — always visible */}
      <button
        type="button"
        onClick={saveSkin}
        aria-label="Save skin"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          padding: '8px 4px',
          background: 'none',
          border: 'none',
          borderRadius: 12,
          cursor: 'pointer',
          color: '#c8981a',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span style={{ fontSize: 20, lineHeight: 1 }}>💾</span>
        <span style={{ fontSize: 10, fontWeight: 700 }}>Save</span>
      </button>
    </div>
  );
}
