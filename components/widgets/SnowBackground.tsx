'use client';

import React from 'react';

// Static snow background using CSS animation - battery-friendly
export default function SnowBackground() {
  return (
    <div
      className="de-snow-canvas"
      aria-hidden="true"
      style={{ background: 'linear-gradient(180deg, var(--de-bg-start) 0%, var(--de-bg-mid) 60%, var(--de-bg-end) 100%)' }}
    />
  );
}
