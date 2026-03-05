'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GameRemote from '@/components/games/GameRemote';

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
  accentColor: string;
  widgets: DaydreamWidget[];
  children: React.ReactNode;
  /**
   * Controls which UI renders on Side B.
   *   'widgets'     (default) — the standard marble widget tray
   *   'game-remote' — dual analog-stick game controller (Games Daydream)
   */
  sideBVariant?: 'widgets' | 'game-remote';
};

export default function DaydreamShell({ title, accentColor, widgets, children, sideBVariant = 'widgets' }: Props) {
  const [side, setSide]   = useState<'A' | 'B'>('A');
  const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const [busy, setBusy]   = useState(false);

  const flip = useCallback(() => {
    if (busy) return;
    setBusy(true);
    setPhase('out');
    setTimeout(() => {
      setSide(s => s === 'A' ? 'B' : 'A');
      setPhase('in');
      setTimeout(() => { setPhase('idle'); setBusy(false); }, 340);
    }, 250);
  }, [busy]);

  // Alt + F = flip (keyboard shortcut)
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.altKey && e.key === 'f') { e.preventDefault(); flip(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [flip]);

  const contentStyle: React.CSSProperties =
    phase === 'out' ? { animation: 'de-flip-out 0.25s cubic-bezier(0.55,0,1,0.45) forwards' }
    : phase === 'in' ? { animation: 'de-flip-in 0.34s cubic-bezier(0,0.55,0.45,1) forwards' }
    : {};

  return (
    <>
      {/* Animated content — swaps between Side A (daydream) and Side B (tools) */}
      <div style={contentStyle}>
        {side === 'A'
          ? children
          : sideBVariant === 'game-remote'
            ? <GameRemote onBack={flip} />
            : <WidgetTray title={title} accentColor={accentColor} widgets={widgets} onBack={flip} />
        }
      </div>

      {/* ── Side A only: corner fold tab → opens Side B ── */}
      {side === 'A' && (
        <>
          <button
            type="button"
            onClick={flip}
            aria-label="Open dream tools"
            title="Dream Tools (Alt+F)"
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
              background: `linear-gradient(135deg, ${accentColor}aa, rgba(200,152,26,0.75))`,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '-3px -3px 18px rgba(0,0,0,0.22)',
              padding: 0,
              transition: 'width 0.2s, height 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.width = '80px'; e.currentTarget.style.height = '80px'; }}
            onMouseLeave={e => { e.currentTarget.style.width = '64px'; e.currentTarget.style.height = '64px'; }}
          />
          <div style={{
            position: 'fixed', bottom: 18, right: 72, zIndex: 48,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 4px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }}>
            TOOLS →
          </div>
        </>
      )}
    </>
  );
}

/* ── Widget Tray — Side B ── */
function WidgetTray({ title, accentColor, widgets, onBack }: {
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
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full"
            style={{ background: 'rgba(160,195,240,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Back to daydream"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </button>
          <div
            style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              background: `linear-gradient(135deg, ${accentColor}, rgba(200,152,26,0.8))`,
            }}
          />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1 }}>Dream Tools</div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{title}</div>
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
        {/* Intro line */}
        <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 16 }}>
          Quick-launch anything in {title}. Tap to go, Alt+F to flip back.
        </p>

        {/* Marble widget grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {widgets.map(w => <MarbleWidget key={w.id} w={w} />)}
        </div>
      </div>
    </div>
  );
}

/* ── Single marble bubble widget ── */
function MarbleWidget({ w }: { w: DaydreamWidget }) {
  const tile = (
    <div
      style={{
        /* The marble look: radial gradient — white core → color mid → fade to edge */
        background: `radial-gradient(ellipse at 30% 22%, rgba(255,255,255,0.88) 0%, ${w.color}1a 48%, ${w.color}08 100%)`,
        backdropFilter: 'blur(22px) saturate(210%)',
        WebkitBackdropFilter: 'blur(22px) saturate(210%)',
        borderRadius: 22,
        border: '1.5px solid rgba(255,255,255,0.72)',
        boxShadow: `0 6px 28px ${w.color}25, inset 0 1.5px 0 rgba(255,255,255,0.9), inset 0 -1.5px 0 ${w.color}18`,
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
        transition: 'transform 0.15s, box-shadow 0.15s',
        textDecoration: 'none',
      }}
      onPointerDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.96)'; }}
      onPointerUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
      onPointerLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
    >
      {/* Shimmer highlight overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '45%',
        borderRadius: '20px 20px 60% 60% / 20px 20px 40% 40%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, transparent 100%)',
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
