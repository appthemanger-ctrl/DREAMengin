'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GameRemote from '@/components/games/GameRemote';
import { logJourneyDot, hasJourneyDot } from '@/lib/journey/journeyDots';
import { JOURNEY_DOMAIN_COLORS } from '@/types/journey';
import { useDaydreamState } from '@/lib/daydream/useDaydreamState';
import { useGsapFlip } from '@/lib/gsap/useGsapFlip';

export type DaydreamWidget = {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  color: string;
  href?: string;
  onClick?: () => void;
};

type Props = {
  title: string;
  /** The Side B engine name, e.g. "StarMakerEngin", "GameEngin" (spec §7.2) */
  enginName: string;
  accentColor: string;
  widgets: DaydreamWidget[];
  children: React.ReactNode;
  /**
   * Canonical daydream type identifier for Supabase state persistence.
   * One of: 'music' | 'games' | 'lab' | 'code' | 'brand' | 'create'.
   * When provided, visit timestamps are recorded via useDaydreamState.
   */
  daydreamType?: string;
  /**
   * Optional custom Side B component. When provided, renders instead of
   * the built-in sideBVariant logic. Receives an `onBack` callback prop.
   * Use this to inject a domain-specific Engin (e.g. GameEngin, StarMakerEngin).
   * Takes precedence over sideBVariant when provided.
   * (spec §7.2 / Phase 4 / Phase 6, point 35 — docs/dreamengin_phase6.md)
   */
  sideBComponent?: React.ComponentType<{ onBack: () => void }>;
  /**
   * Controls which UI renders on Side B when sideBComponent is not provided.
   *   'widgets'     (default) — the standard marble widget tray
   *   'game-remote' — dual analog-stick game controller (legacy fallback)
   */
  sideBVariant?: 'widgets' | 'game-remote';
};

export default function DaydreamShell({ title, enginName, accentColor, widgets, children, daydreamType, sideBComponent, sideBVariant = 'widgets' }: Props) {
  const [side, setSide] = useState<'A' | 'B'>('A');

  // GSAP-powered A↔B flip transition (replaces CSS keyframe approach)
  const { containerRef, flip: gsapFlip, busy } = useGsapFlip();

  // Persist visit state to Supabase (Phase 6 pt 42 — no creative work silently discarded)
  useDaydreamState({
    daydreamType: daydreamType ?? title.split(' ')[0].toLowerCase(),
    side,
  });

  const flip = useCallback(() => {
    gsapFlip(() => setSide(s => s === 'A' ? 'B' : 'A'));
  }, [gsapFlip]);

  // Alt + F = flip (keyboard shortcut)
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.altKey && e.key === 'f') { e.preventDefault(); flip(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [flip]);

  // ── Journey Trail — surface_first_entry instrumentation ──────────────────
  // Fires once the first time this surface is ever visited by the user.
  // Deduplicated by kind + surface together so each surface produces exactly one dot.
  useEffect(() => {
    const surface = `${title} Daydream Surface`;
    void (async () => {
      if (await hasJourneyDot('surface_first_entry', surface)) return;
      logJourneyDot({
        kind:         'surface_first_entry',
        label:        `You entered the ${title} Daydream Surface for the first time.`,
        surface,
        significance: 1.0,
        domain_color: JOURNEY_DOMAIN_COLORS[surface] ?? accentColor,
        metadata:     { engin: enginName },
      });
    })();
   
  }, [title, enginName, accentColor]);

  const contentStyle: React.CSSProperties = {};

  return (
    <>
      {/* Animated content — swaps between Side A (daydream) and Side B (engin) */}
      <div ref={containerRef} style={contentStyle}>
        {side === 'A'
          ? children
          : (() => {
              if (sideBComponent) {
                const EnginComponent = sideBComponent;
                return <EnginComponent onBack={flip} />;
              }
              if (sideBVariant === 'game-remote') return <GameRemote onBack={flip} />;
              return <EnginSurface enginName={enginName} title={title} accentColor={accentColor} widgets={widgets} onBack={flip} />;
            })()
        }
      </div>

      {/* ── Side A only: corner fold tab → opens Side B (Engin) ── */}
      {side === 'A' && (
        <>
          <motion.button
            type="button"
            onClick={flip}
            aria-label={`Open ${enginName}`}
            title={`${enginName} (Alt+F)`}
            whileHover={{ width: 80, height: 80 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            style={{
              position: 'fixed',
              bottom: 0,
              right: 0,
              width: 64,
              height: 64,
              zIndex: 48,
              clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
              cursor: 'pointer',
              border: 'none',
              background: `linear-gradient(135deg, ${accentColor}cc, rgba(200,152,26,0.85))`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: `-3px -3px 24px rgba(0,0,0,0.3), -1px -1px 0 rgba(255,255,255,0.1) inset, 0 0 20px ${accentColor}40`,
              padding: 0,
            }}
          />
          <div style={{
            position: 'fixed', bottom: 18, right: 72, zIndex: 48,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}>
            ENGIN →
          </div>
        </>
      )}
    </>
  );
}

/* ── Engin Surface — Side B ── */
function EnginSurface({ enginName, title, accentColor, widgets, onBack }: {
  enginName: string;
  title: string;
  accentColor: string;
  widgets: DaydreamWidget[];
  onBack: () => void;
}) {
  return (
    <div className="de-sky-bg min-h-screen">
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <motion.button
            type="button"
            onClick={onBack}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="p-2 -ml-2 rounded-full"
            style={{ background: 'rgba(160,195,240,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label={`Back to ${title}`}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </motion.button>
          <div
            style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              background: `linear-gradient(135deg, ${accentColor}, rgba(200,152,26,0.8))`,
            }}
          />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1 }}>{enginName}</div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{title} · Control Layer</div>
          </div>
          <span
            className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}35` }}
          >
            Side B
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pb-32" style={{ paddingTop: 20 }}>
        {/* Engin intro */}
        <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 16 }}>
          {enginName} — the powered control layer for {title}. Tap any tool to launch.
        </p>

        {/* Engin pill dual-button controls (spec §7.1 / §14.3) */}
        <EnginPillControls enginName={enginName} accentColor={accentColor} onBack={onBack} />

        {/* Marble widget grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 20 }}>
          {widgets.map(w => <MarbleWidget key={w.id} w={w} />)}
        </div>
      </div>
    </div>
  );
}

/* ── Engin Pill Dual-Button Controls (spec §7.1 / §14.3) ── */
function EnginPillControls({ enginName, accentColor, onBack }: {
  enginName: string;
  accentColor: string;
  onBack: () => void;
}) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0,
      background: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(24px) saturate(200%)',
      WebkitBackdropFilter: 'blur(24px) saturate(200%)',
      borderRadius: 999,
      border: `1.5px solid ${accentColor}30`,
      boxShadow: `0 4px 20px ${accentColor}25, inset 0 1px 0 rgba(255,255,255,0.6)`,
      overflow: 'hidden',
      fontSize: 12,
      fontWeight: 700,
    }}>
      <motion.button
        type="button"
        onClick={onBack}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        style={{
          padding: '8px 18px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: accentColor,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.04em',
          borderRight: `1.5px solid ${accentColor}20`,
          whiteSpace: 'nowrap',
        }}
        aria-label="Return to Side A"
      >
        ← Side A
      </motion.button>
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        style={{
          padding: '8px 18px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--de-heading)',
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}
        aria-label={`${enginName} engine controls`}
      >
        {enginName} ⚙
      </motion.button>
    </div>
  );
}

/* ── Single marble bubble widget ── */
function MarbleWidget({ w }: { w: DaydreamWidget }) {
  const tile = (
    <div
      className="premium-shimmer"
      style={{
        /* Deeper marble: brighter white core, richer color saturation */
        background: `radial-gradient(ellipse at 28% 20%, rgba(255,255,255,0.92) 0%, ${w.color}22 45%, ${w.color}0c 100%)`,
        backdropFilter: 'blur(28px) saturate(240%)',
        WebkitBackdropFilter: 'blur(28px) saturate(240%)',
        borderRadius: 22,
        border: '1.5px solid rgba(255,255,255,0.78)',
        boxShadow: `0 8px 32px ${w.color}30, inset 0 2px 0 rgba(255,255,255,0.95), inset 0 -2px 0 ${w.color}20, 0 0 0 0.5px rgba(255,255,255,0.2)`,
        padding: '20px 14px 16px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        userSelect: 'none' as const,
        WebkitUserSelect: 'none' as const,
        minHeight: 118,
        justifyContent: 'center',
        transition: 'box-shadow 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        textDecoration: 'none',
      }}
      onPointerDown={e => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(0.94)';
        (e.currentTarget as HTMLElement).style.transition = 'transform 0.12s cubic-bezier(0.34,1.56,0.64,1)';
      }}
      onPointerUp={e => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
      onPointerLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
    >
      {/* Specular highlight overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '48%',
        borderRadius: '20px 20px 60% 60% / 20px 20px 42% 42%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.32) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      <div style={{ fontSize: 34, lineHeight: 1, position: 'relative', zIndex: 1 }}>{w.emoji}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--de-heading)', textAlign: 'center', lineHeight: 1.2, position: 'relative', zIndex: 1 }}>
        {w.label}
      </div>
      <div style={{ fontSize: 10, color: 'var(--de-text-dim)', textAlign: 'center', lineHeight: 1.35, position: 'relative', zIndex: 1 }}>
        {w.desc}
      </div>
    </div>
  );

  if (w.href) return <Link href={w.href} style={{ textDecoration: 'none', display: 'block', position: 'relative' }}>{tile}</Link>;
  return (
    <button type="button" onClick={w.onClick} style={{ all: 'unset', display: 'block', cursor: 'pointer', position: 'relative' }}>
      {tile}
    </button>
  );
}
