'use client';

/**
 * DualBottomMenu — slides up from the bottom as two side-by-side panels.
 *
 * Left panel:  6 Daydream navigation (per spec §17.2 / §4.2)
 * Right panel: System menu + Dr. Eams Chat (per spec §17.3 / §4.2)
 *
 * Double-tap the gold ball → this opens.
 * Tap the dim backdrop or any item → closes.
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/* ── Types ─────────────────────────────────────────────────────────────────── */

export type SystemMenuAction =
  | 'profiles'
  | 'settings'
  | 'marketplace'
  | 'feed-settings'
  | 'appearance'
  | 'ai-triad'
  | 'dr-eams'
  | 'connectors'
  | 'account'
  | 'go-home';

type Props = {
  open: boolean;
  onClose: () => void;
  onSystemAction: (action: SystemMenuAction) => void;
};

/* ── Data ───────────────────────────────────────────────────────────────────── */

/** Left panel: the 6 Daydreams (spec §7.2 domain list) */
const DAYDREAM_ITEMS: Array<{ icon: string; label: string; route: string }> = [
  { icon: '🎵', label: 'Music',  route: '/daydream/music'  },
  { icon: '🎮', label: 'Games',  route: '/daydream/games'  },
  { icon: '🔬', label: 'Lab',    route: '/daydream/lab'    },
  { icon: '💻', label: 'Code',   route: '/daydream/code'   },
  { icon: '🎨', label: 'Brand',  route: '/daydream/brand'  },
  { icon: '✨', label: 'Create', route: '/daydream/create' },
];

/** Right panel: standard app menu functions + Dr. Eams (spec §17.3) */
const SYSTEM_ITEMS: Array<{ id: SystemMenuAction; icon: string; label: string }> = [
  { id: 'dr-eams',       icon: '∞',  label: 'Dr. Eams'            },
  { id: 'profiles',      icon: '👤', label: 'ViewProfile'          },
  { id: 'settings',      icon: '⚙️', label: 'Settings'             },
  { id: 'marketplace',   icon: '🏪', label: 'DreamMarketplace'     },
  { id: 'feed-settings', icon: '📡', label: 'Feed Sources'         },
  { id: 'appearance',    icon: '🎨', label: 'Appearance'           },
];

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function PanelItem({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '11px 16px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        borderRadius: 10,
        WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.12s',
        minHeight: 44,
      }}
      onPointerEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.04)'; }}
      onPointerLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
    >
      <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--de-heading)', lineHeight: 1.2 }}>{label}</span>
    </button>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderRadius: 20,
        border: '1px solid rgba(200,215,240,0.5)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
        overflow: 'hidden',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Panel title */}
      <div style={{
        padding: '14px 16px 8px',
        borderBottom: '1px solid rgba(160,195,240,0.2)',
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--de-text-dim)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {title}
        </span>
      </div>

      {/* Items */}
      <div style={{ padding: '6px 4px 10px' }}>
        {children}
      </div>
    </div>
  );
}

/* ── Main export ────────────────────────────────────────────────────────────── */

export default function DualBottomMenu({ open, onClose, onSystemAction }: Props) {
  const router = useRouter();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Main menu"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 68,
        background: 'rgba(10,20,50,0.28)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 12px 88px',          /* 88px leaves room for the gold ball */
        animation: 'de-menu-overlay-in 0.18s ease-out',
      }}
      onPointerDown={onClose}
    >
      {/* Two-panel row */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          width: '100%',
          maxWidth: 600,
          animation: 'de-dual-menu-up 0.26s cubic-bezier(0.34,1.22,0.64,1)',
        }}
      >
        {/* Daydreams panel — LEFT (spec §17.2 / §4.2) */}
        <Panel title="Daydreams">
          {DAYDREAM_ITEMS.map((item) => (
            <PanelItem
              key={item.route}
              icon={item.icon}
              label={item.label}
              onClick={() => { onClose(); router.push(item.route); }}
            />
          ))}
        </Panel>

        {/* DreamMenu panel — RIGHT with Dr. Eams at top (spec §17.3 / §4.2) */}
        <Panel title="DreamMenu">
          {SYSTEM_ITEMS.map((item) => (
            <PanelItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              onClick={() => { onClose(); onSystemAction(item.id); }}
            />
          ))}
        </Panel>
      </div>
    </div>
  );
}
