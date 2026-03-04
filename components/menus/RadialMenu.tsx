'use client';

import React, { useEffect, useRef } from 'react';

type Item = {
  id: string;
  label: string;
  icon?: string;
  onSelect: () => void;
};

type Props = {
  open: boolean;
  anchor: DOMRect | null;
  items: Item[];
  onClose: () => void;
  variant?: 'blue' | 'red';
};

const ICONS: Record<string, string> = {
  music: '🎵', lab: '🔬', games: '🎮', code: '💻', brand: '✦', create: '⬡',
  search: '🔍', 'dr-eams': '◈', settings: '⚙', account: '👤',
  'view-all-dreams': '⬡', 'edit-layout': '⊞',
};

export default function RadialMenu({ open, anchor, items, onClose, variant = 'blue' }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !anchor) return null;

  const RADIUS = 108;
  const centerX = anchor.left + anchor.width / 2;
  const centerY = anchor.top + anchor.height / 2;

  const hubStyle: React.CSSProperties = variant === 'blue'
    ? { background: 'linear-gradient(135deg,#1e40af,#2563eb)', boxShadow: '0 0 32px rgba(37,99,235,0.65)' }
    : { background: 'linear-gradient(135deg,#991b1b,#dc2626)', boxShadow: '0 0 32px rgba(220,38,38,0.65)' };

  return (
    <div
      ref={overlayRef}
      className="de-radial-overlay open"
      onPointerDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`${variant === 'blue' ? 'Dreams' : 'System'} menu`}
    >
      {/* Close button */}
      <button
        type="button"
        className="de-radial-close"
        onClick={onClose}
        aria-label="Close menu"
        style={{ position: 'fixed', top: '20px', right: '20px' }}
      >
        ✕
      </button>

      {/* Radial container positioned at anchor */}
      <div
        style={{ position: 'fixed', left: centerX, top: centerY, width: 0, height: 0 }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Centre hub */}
        <div
          style={{
            position: 'absolute',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            transform: 'translate(-50%,-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            border: '2px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(12px)',
            zIndex: 2,
            ...hubStyle,
          }}
        >
          {variant === 'blue' ? '🌌' : '⚙️'}
        </div>

        {/* Radial items */}
        {items.map((item, index) => {
          const angle = ((Math.PI * 2) / Math.max(items.length, 1)) * index - Math.PI / 2;
          const x = Math.cos(angle) * RADIUS;
          const y = Math.sin(angle) * RADIUS;
          const delay = `${0.04 + index * 0.05}s`;
          const icon = item.icon ?? ICONS[item.id] ?? '·';

          return (
            <button
              key={item.id}
              type="button"
              className="de-radial-item"
              style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: 'translate(-50%,-50%)',
                animationDelay: delay,
              } as React.CSSProperties}
              onClick={() => { item.onSelect(); onClose(); }}
            >
              <span className="de-radial-icon">{icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
