'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import GameRemote from '@/components/games/GameRemote';
import BrandLogo from '@/components/BrandLogo';
import { logJourneyDot, hasJourneyDot } from '@/lib/journey/journeyDots';
import { JOURNEY_DOMAIN_COLORS } from '@/types/journey';
import { useDaydreamState } from '@/lib/daydream/useDaydreamState';
import { useForgeActivity } from '@/lib/forge/useForgeActivity';
import { useSearchParams } from 'next/navigation';
import { findEnginByName, findEnginById } from '@/engins/manifest';
import type { DaydreamEnginTab } from '@/lib/engins/types';

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

export default function DaydreamShell({
  title,
  enginName,
  accentColor,
  widgets,
  children,
  daydreamType,
  sideBComponent,
  sideBVariant = 'widgets',
}: Props) {
  const [tab, setTab] = useState<DaydreamEnginTab>('dream');
  const searchParams = useSearchParams();

  // Resolve manifest identity — enriches display name and emoji
  const resolvedEnginId = daydreamType ?? title.split(' ')[0].toLowerCase();
  const manifest = findEnginById(resolvedEnginId) ?? findEnginByName(enginName);
  const displayEnginName = manifest?.tagName ?? enginName;
  const enginEmoji = manifest?.emoji ?? '⚡';

  // Persist visit state to Supabase
  useDaydreamState({ daydreamType: resolvedEnginId, side: tab === 'dream' ? 'A' : 'B' });

  // Record Forge activity pulse when entering this DaydreamEngin surface
  const { record: recordForge } = useForgeActivity({ enginId: resolvedEnginId });

  const switchTab = useCallback(
    (next: DaydreamEnginTab) => {
      if (next === 'engin') recordForge(`Activated ${enginName}`);
      setTab(next);
    },
    [recordForge, enginName],
  );

  // Alt+E = open engin tab; Alt+D = open dream tab; Alt+F = toggle (legacy compat)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'e') { e.preventDefault(); switchTab('engin'); }
      if (e.altKey && e.key === 'd') { e.preventDefault(); switchTab('dream'); }
      if (e.altKey && e.key === 'f') { e.preventDefault(); setTab(t => t === 'dream' ? 'engin' : 'dream'); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [switchTab]);

  // Legacy event: de:open-side-b → open engin tab
  useEffect(() => {
    const handler = () => switchTab('engin');
    window.addEventListener('de:open-side-b', handler);
    return () => window.removeEventListener('de:open-side-b', handler);
  }, [switchTab]);

  // Legacy deep-link: ?openEngin=1 → open engin tab on mount
  useEffect(() => {
    if (searchParams.get('openEngin') === '1') {
      const timer = window.setTimeout(() => switchTab('engin'), 80);
      return () => window.clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Journey Trail — surface_first_entry instrumentation
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

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* ── Active tab content ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {tab === 'dream' ? (
          <motion.div
            key="dream"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        ) : (
          <motion.div
            key="engin"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {sideBComponent
              ? (() => { const EC = sideBComponent; return <EC onBack={() => switchTab('dream')} />; })()
              : sideBVariant === 'game-remote'
                ? <GameRemote onBack={() => switchTab('dream')} />
                : <EnginSurface enginName={enginName} title={title} accentColor={accentColor} widgets={widgets} onBack={() => switchTab('dream')} />
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Persistent DaydreamEngin tab bar ──────────────────────────────── */}
      <div
        aria-label="DaydreamEngin navigation"
        style={{
          position: 'fixed',
          bottom: `max(72px, calc(64px + env(safe-area-inset-bottom, 0px)))`,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          background: 'rgba(6,10,22,0.82)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          borderRadius: 9999,
          padding: 4,
          border: `1.5px solid ${accentColor}30`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(255,255,255,0.07) inset, 0 0 24px ${accentColor}18`,
        }}
      >
        {/* DREAM tab */}
        <motion.button
          type="button"
          onClick={() => switchTab('dream')}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          aria-label={`${title} Daydream`}
          aria-pressed={tab === 'dream'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 20px',
            borderRadius: 9999,
            border: 'none',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            transition: 'background 0.15s, color 0.15s',
            background: tab === 'dream' ? `${accentColor}22` : 'transparent',
            color:      tab === 'dream' ? accentColor : 'rgba(180,200,240,0.45)',
            boxShadow:  tab === 'dream' ? `0 0 0 1px ${accentColor}45 inset` : 'none',
          }}
        >
          <span style={{ fontSize: 14 }}>🌟</span>
          <span>DREAM</span>
        </motion.button>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: `${accentColor}25`, flexShrink: 0 }} />

        {/* ENGIN tab */}
        <motion.button
          type="button"
          onClick={() => switchTab('engin')}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          aria-label={`${displayEnginName}`}
          aria-pressed={tab === 'engin'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 20px',
            borderRadius: 9999,
            border: 'none',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            transition: 'background 0.15s, color 0.15s',
            background: tab === 'engin' ? `${accentColor}22` : 'transparent',
            color:      tab === 'engin' ? accentColor : 'rgba(180,200,240,0.45)',
            boxShadow:  tab === 'engin' ? `0 0 0 1px ${accentColor}45 inset` : 'none',
          }}
        >
          <span style={{ fontSize: 14 }}>{enginEmoji}</span>
          <span>{displayEnginName}</span>
        </motion.button>
      </div>
    </div>
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(155deg, #050508 0%, #08101e 45%, #0a0f1c 75%, #050508 100%)', position: 'relative', overflow: 'hidden' }}>
      {/* Accent glow halo */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-80px', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '400px',
          background: `radial-gradient(ellipse, ${accentColor}22 0%, transparent 65%)`,
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <header
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(6,10,22,0.88)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          borderBottom: `1px solid ${accentColor}28`,
          boxShadow: `0 1px 0 ${accentColor}18`,
        }}
      >
        {/* Accent top stripe */}
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${accentColor}90, rgba(200,152,26,0.6), transparent)` }} />
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <motion.button
            type="button"
            onClick={onBack}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="p-2 -ml-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label={`Back to ${title}`}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'rgba(200,220,255,0.80)' }} />
          </motion.button>
          <div
            style={{
              width: 22, height: 22, borderRadius: 7, flexShrink: 0,
              background: `linear-gradient(135deg, ${accentColor}, rgba(200,152,26,0.8))`,
              boxShadow: `0 2px 10px ${accentColor}55`,
            }}
          />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'rgba(225,240,255,0.96)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>{enginName}</div>
            <div style={{ fontSize: 11, color: 'rgba(140,170,220,0.55)', letterSpacing: '0.04em' }}>{title} · Control Layer</div>
          </div>
          <div className="ml-auto" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BrandLogo width={24} height={24} alt="DREAMengin" />
            <span
              className="text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}
            >
              Side B
            </span>
          </div>
        </div>
      </header>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto', padding: '24px 16px 80px' }}>
        {/* Hero block */}
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${accentColor}22`,
            borderRadius: 20,
            padding: '20px 20px 20px',
            marginBottom: 20,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top left, ${accentColor}12 0%, transparent 55%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: accentColor, marginBottom: 10 }}>
              {title} · Engin Side
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.10, letterSpacing: '-0.03em', color: 'rgba(225,240,255,0.96)', marginBottom: 10 }}>
              {enginName} is the powered control layer behind {title}.
            </div>
            <p style={{ fontSize: 13, color: 'rgba(140,170,220,0.65)', lineHeight: 1.65, margin: 0 }}>
              Use Side B like the operational deck: faster launch paths, clearer tool groups, and a more premium control surface that still keeps the daydream context anchored.
            </p>
          </div>
        </div>

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
      background: 'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(24px) saturate(160%)',
      WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      borderRadius: 999,
      border: `1.5px solid ${accentColor}35`,
      boxShadow: `0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)`,
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
          padding: '10px 18px',
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
          padding: '10px 18px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(200,220,255,0.85)',
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
        padding: '22px 14px 18px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        userSelect: 'none' as const,
        WebkitUserSelect: 'none' as const,
        minHeight: 126,
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
      <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(225,240,255,0.95)', textAlign: 'center', lineHeight: 1.2, position: 'relative', zIndex: 1 }}>
        {w.label}
      </div>
      <div style={{ fontSize: 10, color: 'rgba(160,190,230,0.70)', textAlign: 'center', lineHeight: 1.35, position: 'relative', zIndex: 1 }}>
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
