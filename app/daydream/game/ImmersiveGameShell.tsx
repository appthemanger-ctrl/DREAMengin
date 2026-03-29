'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Power } from 'lucide-react';
import GamePageClient from './GamePageClient';

const BOOT_MESSAGES = [
  'Booting DREAMENGIN GameOS',
  'Loading render pipeline',
  'Syncing control deck',
  'Mounting MADMAXI session',
] as const;

export default function ImmersiveGameShell() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [bootStep, setBootStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  useEffect(() => {
    const timers = BOOT_MESSAGES.map((_, index) => (
      window.setTimeout(() => setBootStep(index), index * 450)
    ));
    const readyTimer = window.setTimeout(() => setReady(true), 1700);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(readyTimer);
    };
  }, []);

  const progress = useMemo(() => ((bootStep + 1) / BOOT_MESSAGES.length) * 100, [bootStep]);

  async function handleEnterExperience() {
    const target = rootRef.current ?? document.documentElement;

    try {
      if (document.fullscreenElement === null && 'requestFullscreen' in target) {
        await target.requestFullscreen();
      }
    } catch {
      // Ignore fullscreen denial and continue into the experience.
    }

    setOverlayDismissed(true);
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      {!overlayDismissed && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: 'radial-gradient(circle at top, rgba(42,138,184,0.2), rgba(4,8,18,0.98) 48%), linear-gradient(180deg, #040816, #02040b)',
          }}
        >
          <div
            style={{
              width: 'min(100%, 460px)',
              borderRadius: 28,
              padding: '28px 24px',
              background: 'linear-gradient(180deg, rgba(8,18,38,0.96), rgba(4,10,22,0.96))',
              border: '1px solid rgba(125,211,252,0.18)',
              boxShadow: '0 28px 80px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ background: 'rgba(125,211,252,0.08)', color: '#7dd3fc', border: '1px solid rgba(125,211,252,0.18)' }}>
              <Power className="w-3.5 h-3.5" />
              DREAMENGIN boot sequence
            </div>

            <div style={{ marginTop: 18, fontSize: 34, fontWeight: 900, lineHeight: 0.98, color: '#f8fbff', letterSpacing: '-0.04em' }}>
              DREAMENGIN
            </div>
            <div style={{ marginTop: 4, fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7dd3fc' }}>
              Powered by DREAMengin
            </div>
            <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: 'rgba(226,232,240,0.76)' }}>
              Starting your game session like a console boot: dark room, system wake-up, then straight into the title screen.
            </div>
            <div style={{ marginTop: 8, fontSize: 11, lineHeight: 1.7, color: 'rgba(226,232,240,0.56)', letterSpacing: '0.04em' }}>
              Engine shelf → console handoff → remote docked → fullscreen boot.
            </div>

            <div style={{ marginTop: 22, display: 'grid', gap: 10 }}>
              {BOOT_MESSAGES.map((message, index) => {
                const active = index <= bootStep;
                return (
                  <div
                    key={message}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 14,
                      background: active ? 'rgba(125,211,252,0.08)' : 'rgba(255,255,255,0.03)',
                      border: active ? '1px solid rgba(125,211,252,0.18)' : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: active ? '#f8fbff' : 'rgba(226,232,240,0.46)' }}>{message}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: active ? '#7dd3fc' : 'rgba(226,232,240,0.34)' }}>
                      {active ? 'Ready' : 'Wait'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 18, borderRadius: 999, height: 8, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #2a8ab8, #7dd3fc, #c8981a)', transition: 'width 0.35s ease' }} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center" style={{ marginTop: 22 }}>
              <button
                type="button"
                onClick={handleEnterExperience}
                disabled={!ready}
                className="de-btn de-btn-primary"
                style={{
                  minWidth: 210,
                  justifyContent: 'center',
                  opacity: ready ? 1 : 0.6,
                  cursor: ready ? 'pointer' : 'wait',
                }}
              >
                <Maximize2 className="w-4 h-4" />
                {ready ? 'Enter full experience' : 'Preparing...'}
              </button>
              <div style={{ fontSize: 11, lineHeight: 1.6, color: 'rgba(226,232,240,0.58)' }}>
                Fullscreen will be requested when your browser allows it.
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          borderRadius: 24,
          overflow: 'hidden',
          border: '1px solid rgba(125,211,252,0.18)',
          background: 'linear-gradient(180deg, rgba(10,18,38,0.98), rgba(2,6,14,0.98))',
          boxShadow: '0 28px 80px rgba(0,0,0,0.42)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(125,211,252,0.12)', background: 'rgba(7,14,28,0.9)' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7dd3fc' }}>DREAMENGIN GameOS</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fbff', marginTop: 4 }}>MADMAXI immersive session</div>
          </div>
          <button
            type="button"
            onClick={handleEnterExperience}
            className="de-btn de-btn-ghost text-xs"
            style={{ borderColor: 'rgba(125,211,252,0.22)', color: '#7dd3fc' }}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Fullscreen
          </button>
        </div>

        <div style={{ padding: 14 }}>
          <GamePageClient />
        </div>
      </div>
    </div>
  );
}
