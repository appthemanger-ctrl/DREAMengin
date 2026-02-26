'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'dreamengin:showNavIndicator';

export default function PositionIndicatorToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) setEnabled(saved !== 'false');
    } catch { /* noop */ }
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* noop */ }
  };

  return (
    <div className="de-row">
      <div style={{ flex: 1 }}>
        <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>
          Show position indicator
        </div>
        <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>
          Display the current navigation node at the top of the screen while navigating.
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Show position indicator"
        onClick={toggle}
        style={{
          width: 44, height: 26, borderRadius: 13, flexShrink: 0,
          background: enabled ? 'var(--de-accent)' : 'rgba(160,195,240,0.3)',
          position: 'relative', cursor: 'pointer', border: 'none', padding: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: enabled ? 21 : 3,
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  );
}
