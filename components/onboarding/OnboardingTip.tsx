'use client';

import React, { useState, useEffect } from 'react';

const TIP_KEY = 'dreamengin:onboarding:button-tip-seen';

export default function OnboardingTip() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(TIP_KEY)) {
        // Show after 2 seconds
        const t = setTimeout(() => setShow(true), 2000);
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
      style={{
        position: 'fixed',
        bottom: 90,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 55,
        width: 'min(280px, 80vw)',
        background: 'rgba(245,250,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(160,195,240,0.5)',
        borderRadius: 16,
        padding: '12px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 2 }}>
            Tip: Lock your controls
          </div>
          <div style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>
            Drag the 🔵 and 🟡 buttons together to lock and access system menus.
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--de-text-dim)', fontSize: 14, lineHeight: 1, padding: 2, flexShrink: 0 }}
          aria-label="Dismiss tip"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
