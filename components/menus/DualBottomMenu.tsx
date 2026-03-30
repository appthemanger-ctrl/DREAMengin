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
  { id: 'dr-eams',       icon: '∞',  label: 'Dr. Eams'     },
  { id: 'go-home',       icon: '⌂',  label: 'Home'         },
  { id: 'profiles',      icon: '👤', label: 'Profiles'      },
  { id: 'settings',      icon: '⚙️', label: 'Settings'      },
  { id: 'marketplace',   icon: '🏪', label: 'Marketplace'   },
  { id: 'feed-settings', icon: '📡', label: 'Feed Sources'  },
  { id: 'appearance',    icon: '🎨', label: 'Appearance'    },
];

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function PanelItem({
  icon,
  label,
  onClick,
  accent,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '12px 16px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        borderRadius: 14,
        WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.12s, transform 0.08s',
        minHeight: 52,
        touchAction: 'manipulation',
      }}
      onPointerDown={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(42,138,184,0.07)'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.975)'; }}
      onPointerUp={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      onPointerLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
    >
      <span style={{ fontSize: 18, width: 26, textAlign: 'center', flexShrink: 0, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))' }}>{icon}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: accent ?? 'var(--de-heading)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>{label}</span>
    </button>
  );
}

function Panel({
  title,
  accent,
  children,
}: {
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(36px) saturate(180%)',
        WebkitBackdropFilter: 'blur(36px) saturate(180%)',
        borderRadius: 24,
        border: '1px solid rgba(200,215,240,0.45)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.7) inset',
        overflow: 'hidden',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Panel title */}
      <div style={{
        padding: '14px 18px 10px',
        borderBottom: `1px solid rgba(${accent ? accent + ',0.15' : '160,195,240,0.22'})`,
        background: accent ? `rgba(${accent},0.04)` : 'transparent',
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 800,
          color: accent ? `rgba(${accent},0.85)` : 'var(--de-text-dim)',
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
        }}>
          {title}
        </span>
      </div>

      {/* Items */}
      <div style={{ padding: '6px 6px 10px' }}>
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
        zIndex: 200,
        background: 'rgba(8,16,40,0.42)',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 12px 96px',          /* 96px leaves room for the gold ball */
        animation: 'de-menu-overlay-in 0.18s ease-out',
      }}
      onPointerDown={onClose}
    >
      {/* Two-panel row */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          width: '100%',
          maxWidth: 600,
          animation: 'de-dual-menu-up 0.30s cubic-bezier(0.34,1.22,0.64,1)',
        }}
      >
        {/* Daydreams panel — LEFT (spec §17.2 / §4.2) */}
        <Panel title="Daydreams" accent="42,138,184">
          {DAYDREAM_ITEMS.map((item) => (
            <PanelItem
              key={item.route}
              icon={item.icon}
              label={item.label}
              onClick={() => { onClose(); router.push(item.route); }}
            />
          ))}
        </Panel>

        {/* System panel — RIGHT with Dr. Eams at top (spec §17.3 / §4.2) */}
        <Panel title="DreamMenu" accent="200,152,26">
          {SYSTEM_ITEMS.map((item) => (
            <PanelItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              accent={item.id === 'dr-eams' ? 'var(--de-gold)' : undefined}
              onClick={() => { onClose(); onSystemAction(item.id); }}
            />
          ))}
        </Panel>
      </div>
    </div>
  );
}
