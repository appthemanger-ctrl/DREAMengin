'use client';

import React from 'react';

interface DreamNavControlsProps {
  onHome: () => void;
  onBothMenus: () => void;
}

export default function DreamNavControls({ onBothMenus }: DreamNavControlsProps) {
  const handleTap = () => {
    onBothMenus();
  };

  return (
    <button
      type="button"
      aria-label="Dream Navigation"
      className="gold-button"
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        handleTap();
      }}
      onPointerCancel={(e) => {
        e.preventDefault();
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1, userSelect: 'none' }}>✦</span>
    </button>
  );
}
