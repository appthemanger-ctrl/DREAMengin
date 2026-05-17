'use client';

import React, { useState, useEffect } from 'react';

const TIP_KEY = 'dreamengin:onboarding:nav-tip-seen';

export default function OnboardingTip() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(TIP_KEY)) {
        const t = setTimeout(() => setShow(true), 4000);
        return () => clearTimeout(t);
      }
    } catch { /* noop */ }
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(TIP_KEY, '1'); } catch { /* noop */ }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 90,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 55,
        width: 'min(300px, 84vw)',
        background: 'var(--de-glass, rgba(255,255,255,0.60))',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        border: '1px solid rgba(200,152,26,0.25)',
        borderRadius: 18,
        padding: '14px 16px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.82)',
        pointerEvents: 'auto',
        animation: 'de-page-enter 0.35s cubic-bezier(0, 0, 0.2, 1) both',
        overflow: 'hidden',
      }}
    >
      {/* Gold accent top */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(200,152,26,0.5) 40%, rgba(42,138,184,0.3) 70%, transparent)',
        }}
        aria-hidden="true"
      />

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(200,152,26,0.12), rgba(42,138,184,0.08))',
            border: '1px solid rgba(200,152,26,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 16,
          }}
          aria-hidden="true"
        >
          💡
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 3, letterSpacing: '-0.01em' }}>
            Access system menus
          </div>
          <div style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.6 }}>
            Double-tap the home control to unlock NAV mode and access the System &amp; Daydreams menus.
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: 'rgba(0,0,0,0.04)',
            border: '1px solid var(--de-border, rgba(180,185,200,0.35))',
            cursor: 'pointer',
            color: 'var(--de-text-dim)',
            fontSize: 12,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.12s',
          }}
          aria-label="Dismiss tip"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
