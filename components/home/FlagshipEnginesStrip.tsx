'use client';

/**
 * FlagshipEnginesStrip — Two flagship engins on the HomeDream Surface.
 *
 * The HomeDream is the front door of the platform. The two finished products
 * the user wants to ship as flagship are:
 *   - GameEngin   — playable engine + cartridge runtime  (/daydream/games)
 *   - ForgeEngin  — meta-creation command center         (/daydream/forge)
 *
 * Each card carries a shiny gold/blue decal, a one-line tagline and a single
 * launch action that opens the engin in-region (no full-page navigation when
 * the dual runtime is active).
 *
 * A compact DREAMfield-style momentum read-out is rendered underneath so the
 * user always sees a live pulse of their creative state from the home scroll
 * — without needing to navigate to /daydream/field. The full DREAMfield is
 * one tap away via the "Open DREAMfield" link.
 *
 * Architecture justification:
 *   - docs/AXIOMS.md §3 — every visible action does something real.
 *   - docs/ARCHITECTURE.md §8 — gold / blue / white premium palette.
 *   - docs/PRODUCT_DEFINITION.md — flagship engins surface on HomeDream.
 */

import { useEffect, useState } from 'react';
import { Flame, Gamepad2, Activity, ChevronRight } from 'lucide-react';
import {
  computeMomentum,
  getLevelColor,
  getLevelEmoji,
  type MomentumSnapshot,
} from '@/lib/forge/forgeMomentum';

interface FlagshipEnginesStripProps {
  /** Open a path inside the active runtime region (preferred over routing). */
  onOpenUrl?: (url: string, title?: string) => void;
  /** Compact viewport flag (mobile / narrow). */
  isCompactViewport?: boolean;
}

/** Polished gold/blue gradient used for the decal trim on flagship cards. */
const SHINY_GOLD =
  'linear-gradient(135deg, #f6d27a 0%, #c8981a 38%, #e8b830 65%, #87CEEB 100%)';

const FLAGSHIPS = [
  {
    id: 'gameengin',
    label: 'GameEngin',
    tagline: 'Play, prototype, ship cartridges',
    href: '/daydream/games',
    Icon: Gamepad2,
    accent: '#22c55e',
  },
  {
    id: 'forgeengin',
    label: 'EngineForge',
    tagline: 'The meta-creation command center',
    href: '/daydream/forge',
    Icon: Flame,
    accent: '#ef4444',
  },
] as const;

export default function FlagshipEnginesStrip({
  onOpenUrl,
  isCompactViewport = false,
}: FlagshipEnginesStripProps) {
  const [snap, setSnap] = useState<MomentumSnapshot | null>(null);

  useEffect(() => {
    const refresh = () => setSnap(computeMomentum());
    refresh();
    const timer = setInterval(refresh, 15_000);
    return () => clearInterval(timer);
  }, []);

  const open = (href: string, label: string) => {
    if (onOpenUrl) {
      onOpenUrl(href, label);
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  };

  const composite = snap?.composite ?? 0;
  const level = snap?.level ?? 'DORMANT';
  const levelColor = snap ? getLevelColor(snap.level) : '#c8981a';
  const levelEmoji = snap ? getLevelEmoji(snap.level) : '✨';

  return (
    <section
      aria-label="Flagship engines"
      style={{
        marginBottom: 16,
        borderRadius: isCompactViewport ? 20 : 24,
        // Subtle premium glass surface — the shiny decals do the heavy lift
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(245,250,255,0.82) 100%)',
        border: '1.5px solid rgba(200,152,26,0.28)',
        boxShadow:
          '0 12px 40px rgba(15,30,52,0.10), 0 2px 12px rgba(200,152,26,0.10), inset 0 1px 0 rgba(255,255,255,0.95)',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 18px 10px',
          borderBottom: '1px solid rgba(200,152,26,0.12)',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 28,
            height: 28,
            borderRadius: 9,
            background: SHINY_GOLD,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 13,
            flexShrink: 0,
            boxShadow: '0 2px 10px rgba(200,152,26,0.35)',
          }}
        >
          ✦
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: 'var(--de-heading)',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            Flagship Engines
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--de-text-dim)',
              fontWeight: 500,
              marginTop: 2,
            }}
          >
            The two finished products of DREAMengin
          </div>
        </div>
        <button
          type="button"
          onClick={() => open('/daydream/field', 'DREAMfield')}
          aria-label="Open DREAMfield analytics"
          style={{
            border: '1px solid rgba(200,152,26,0.32)',
            background: 'rgba(200,152,26,0.10)',
            color: '#8a6720',
            borderRadius: 999,
            padding: '5px 10px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          DREAMfield <ChevronRight size={12} />
        </button>
      </div>

      {/* ── Flagship cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isCompactViewport ? '1fr' : '1fr 1fr',
          gap: 12,
          padding: '14px',
        }}
      >
        {FLAGSHIPS.map(({ id, label, tagline, href, Icon, accent }) => (
          <button
            key={id}
            type="button"
            onClick={() => open(href, label)}
            aria-label={`Open ${label}`}
            className="de-pressable"
            style={{
              position: 'relative',
              textAlign: 'left',
              padding: '14px 14px 12px',
              borderRadius: 18,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              border: '1px solid rgba(255,255,255,0.95)',
              background: `linear-gradient(160deg, rgba(255,255,255,0.92) 0%, ${accent}10 100%)`,
              boxShadow:
                '0 6px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.96)',
              overflow: 'hidden',
              transition:
                'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
            }}
          >
            {/* Shiny gold decal stripe along the top edge */}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: SHINY_GOLD,
                boxShadow: '0 2px 12px rgba(200,152,26,0.45)',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: SHINY_GOLD,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(200,152,26,0.40)',
                }}
              >
                <Icon size={20} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: 'var(--de-heading)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.15,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--de-text-dim)',
                    marginTop: 2,
                    lineHeight: 1.35,
                  }}
                >
                  {tagline}
                </div>
              </div>
              <ChevronRight
                size={16}
                color="var(--de-text-dim)"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              />
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 999,
                background: `${accent}14`,
                border: `1px solid ${accent}30`,
                color: accent,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Flagship
            </div>
          </button>
        ))}
      </div>

      {/* ── DREAMfield-mini momentum read-out ── */}
      <div
        style={{
          margin: '0 14px 14px',
          padding: '12px 14px',
          borderRadius: 16,
          background: `${levelColor}08`,
          border: `1px solid ${levelColor}22`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'relative',
            width: 44,
            height: 44,
            flexShrink: 0,
          }}
        >
          <svg
            viewBox="0 0 44 44"
            style={{ width: 44, height: 44, transform: 'rotate(-90deg)' }}
          >
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke="rgba(0,0,0,0.06)"
              strokeWidth="4"
            />
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke={levelColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 18}`}
              strokeDashoffset={2 * Math.PI * 18 * (1 - composite / 100)}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 900,
              color: levelColor,
            }}
          >
            {composite}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              color: levelColor,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <Activity size={12} />
            <span>{levelEmoji} {level}</span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--de-text-dim)',
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            {snap
              ? `${snap.actionsToday} action${snap.actionsToday === 1 ? '' : 's'} today · ${snap.streakDays}d streak · ${snap.enginesUsedToday.length} engine${snap.enginesUsedToday.length === 1 ? '' : 's'} active`
              : 'Start using engines to build creative momentum.'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => open('/daydream/field', 'DREAMfield')}
          aria-label="Open DREAMfield analytics"
          style={{
            border: 'none',
            background: 'none',
            color: levelColor,
            fontSize: 11,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            cursor: 'pointer',
            padding: 4,
            WebkitTapHighlightColor: 'transparent',
            whiteSpace: 'nowrap',
          }}
        >
          Open <ChevronRight size={12} />
        </button>
      </div>
    </section>
  );
}
