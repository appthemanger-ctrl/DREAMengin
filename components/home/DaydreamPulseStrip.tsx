'use client';

/**
 * DaydreamPulseStrip
 *
 * Clean navigation grid for all Daydream surfaces.
 * No squiggly lines, no pulse rings — just a polished glass nav strip
 * with real links that go to real surfaces.
 *
 * Architecture justification:
 *   - docs/ARCHITECTURE.md §8  — Gold / light-blue / white premium palette.
 *   - docs/AXIOMS.md Axiom 4   — "Stylized — premium, intentional, designed."
 *   - docs/LAW.md Product law 3 — Every visible action does something real.
 */

import { useRouter } from 'next/navigation';

// ── Canonical Daydream surface definitions (docs/ARCHITECTURE.md §1) ──────────

const DAYDREAMS = [
  { id: 'music',     emoji: '🎵', label: 'Music',     href: '/daydream/music',     accent: '#8b5cf6' },
  { id: 'games',     emoji: '🎮', label: 'Games',     href: '/daydream/games',     accent: '#22c55e' },
  { id: 'lab',       emoji: '⚗️', label: 'Lab',       href: '/daydream/lab',       accent: '#06b6d4' },
  { id: 'code',      emoji: '💻', label: 'Code',      href: '/daydream/code',      accent: '#3b82f6' },
  { id: 'brand',     emoji: '🎨', label: 'Brand',     href: '/daydream/brand',     accent: '#f97316' },
  { id: 'create',    emoji: '✍️', label: 'Create',    href: '/daydream/create',    accent: '#ec4899' },
  { id: 'analytics', emoji: '📊', label: 'Analytics', href: '/daydream/analytics', accent: '#6366f1' },
  { id: 'forge',     emoji: '🔥', label: 'Forge',     href: '/daydream/forge',     accent: '#ef4444' },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

interface DaydreamPulseStripProps {
  onOpenDaydream?: (href: string, label: string) => void;
}

export default function DaydreamPulseStrip({ onOpenDaydream }: DaydreamPulseStripProps) {
  const router = useRouter();

  const openDaydream = (href: string, label: string) => {
    if (onOpenDaydream) {
      onOpenDaydream(href, label);
      return;
    }
    router.push(href);
  };

  return (
    <div
      style={{
        borderRadius: 20,
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        border: '1.5px solid rgba(200,152,26,0.22)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px 10px',
          borderBottom: '1px solid rgba(200,152,26,0.10)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            aria-hidden="true"
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #c8981a, #e8b830)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(200,152,26,0.30)',
              color: '#fff',
            }}
          >
            ✦
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              Daydreams
            </div>
            <div style={{ fontSize: 10, color: 'var(--de-text-dim)', fontWeight: 500, marginTop: 1 }}>
              6 daydreams + analytics + forge
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          padding: '14px 14px 16px',
        }}
      >
        {DAYDREAMS.map(d => (
          <button
            key={d.id}
            type="button"
            onClick={() => openDaydream(d.href, d.label)}
            aria-label={`Open ${d.label} Daydream Surface`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: '14px 6px 12px',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.85)',
              background: `linear-gradient(160deg, rgba(255,255,255,0.90) 0%, ${d.accent}08 100%)`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 26, lineHeight: 1 }}>{d.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)', letterSpacing: '-0.01em', textAlign: 'center' }}>
              {d.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
