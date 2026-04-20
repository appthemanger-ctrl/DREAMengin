'use client';

import React from 'react';

// Static snow background using a single fixed-position div - battery-friendly.
// (The previous `.de-snow-canvas` CSS class was removed alongside the legacy
// StarfieldCanvas; positioning is inlined here so this widget stays self-
// contained.)
export default function SnowBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        background:
          'linear-gradient(180deg, var(--de-bg-start) 0%, var(--de-bg-mid) 60%, var(--de-bg-end) 100%)',
      }}
    />
  );
}
