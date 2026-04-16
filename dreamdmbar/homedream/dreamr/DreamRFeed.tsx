'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { enginBridge } from '@/lib/runtime/dualRuntimeBridge';
import { scoreSwipePath, type TouchPoint } from './algorithms/botDetector';
import { recordView } from '@/lib/ledger';
import { createLedger } from '@/lib/ledger';
export { DREAMR_TOPICS } from './algorithms/dreamrfeed';

/** Module-level ledger instance for view tallying (lightweight, in-memory only). */
const _feedLedger = createLedger();

/** Freeze the feed UI for `ms` milliseconds (bot penalty). */
const BOT_FREEZE_MS_MIN = 3000;
const BOT_FREEZE_MS_MAX = 5000;

export default function DreamRFeed({ videoId, sharerId, viewerId }: { videoId: string, sharerId: string, viewerId: string }) {
  const [hasTallied, setHasTallied] = useState(false);
  const [dragX, setDragX] = useState(0);
  /** When > Date.now(), the feed is frozen as a bot-penalty. */
  const [frozenUntil, setFrozenUntil] = useState(0);
  const touchStart = useRef<number | null>(null);
  /** Accumulated touch points for the current swipe (for bot analysis). */
  const touchPointsRef = useRef<TouchPoint[]>([]);
  /** Recent deviation arrays for cross-swipe similarity analysis (last 5). */
  const recentPathsRef = useRef<number[][]>([]);
  /** Timer ID for the 4-second view tally. */
  const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFrozen = useCallback(() => Date.now() < frozenUntil, [frozenUntil]);

  // ── 4-second view tally ──────────────────────────────────────────────────
  // Start the 4-second timer when this feed card mounts/changes.
  // If the user is still on the card after 4 s, record the view.
  useEffect(() => {
    if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
    viewTimerRef.current = setTimeout(() => {
      // Record view in the local feed ledger for torridity tracking
      recordView(_feedLedger, videoId);
      // Also broadcast to the dual-runtime bridge for cross-surface tallying
      enginBridge.emitToChannel('LEDGER_TALLY', { videoId, sharerId });
    }, 4000);

    return () => {
      if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
    };
  }, [videoId, sharerId]);

  // SILENT VIEW TALLY: Only counts unique discovery paths
  useEffect(() => {
    if (!hasTallied) {
      const path = `${videoId}-${sharerId}-${viewerId}`;
      enginBridge.emitToChannel('CHECK_DISCOVERY', { 
        path,
        callback: (isUnique: boolean) => {
          if (isUnique) {
            enginBridge.emitToChannel('LEDGER_TALLY', { videoId, sharerId });
            setHasTallied(true);
          }
        }
      });
    }
  }, [videoId, sharerId, viewerId, hasTallied]);

  // STICKY PHYSICS: Swipe left to Share — with bot detection on swipe end
  const handleTouch = (e: React.TouchEvent, phase: 'start' | 'move' | 'end') => {
    if (isFrozen()) return; // block input while frozen

    if (phase === 'start') {
      touchStart.current = e.targetTouches[0].clientX;
      touchPointsRef.current = [{
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
        t: e.timeStamp,
      }];
    }

    if (phase === 'move' && touchStart.current !== null) {
      const t = e.targetTouches[0];
      touchPointsRef.current.push({ x: t.clientX, y: t.clientY, t: e.timeStamp });
      const diff = t.clientX - touchStart.current;
      if (diff < 0) setDragX(diff);
    }

    if (phase === 'end') {
      // ── Bot detection ────────────────────────────────────────────────────
      const points = touchPointsRef.current;
      if (points.length >= 3) {
        const result = scoreSwipePath(points, recentPathsRef.current);

        // Maintain rolling window of last 5 deviation arrays for cross-swipe sim
        const deviations = points.slice(1, -1).map((p, i) => {
          const p0 = points[0];
          const pn = points[points.length - 1];
          const dx = pn.x - p0.x;
          const dy = pn.y - p0.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len < 1e-9) return 0;
          return Math.abs(dx * (p.y - p0.y) - dy * (p.x - p0.x)) / len;
        });
        recentPathsRef.current = [...recentPathsRef.current, deviations].slice(-5);

        if (result.isBot) {
          // Freeze feed for 3–5 seconds (random within range)
          const freezeMs = BOT_FREEZE_MS_MIN +
            Math.random() * (BOT_FREEZE_MS_MAX - BOT_FREEZE_MS_MIN);
          setFrozenUntil(Date.now() + freezeMs);
          setDragX(0);
          touchStart.current = null;
          touchPointsRef.current = [];
          return;
        }
      }

      if (dragX < -100) enginBridge.emitToChannel('SHARE', { videoId, viewerId });
      setDragX(0);
      touchStart.current = null;
      touchPointsRef.current = [];
    }
  };

  const frozen = isFrozen();

  return (
    <div className="w-full max-w-md mx-auto p-4 select-none">
      {/* THE GLASS FRAME */}
      <div className="relative p-[1px] rounded-[40px] bg-gradient-to-b from-white/10 to-[#FFD700]/10 shadow-2xl">
        <div className="relative bg-[#02050A] rounded-[39px] p-8 border border-white/5 overflow-hidden">
          
          {/* HEADER: Gold Branding Only */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[#FFD700] font-black text-xl italic uppercase tracking-tighter">DreamR</h2>
            <div className="h-1.5 w-1.5 rounded-full bg-[#FFD700] shadow-[0_0_8px_#FFD700]" />
          </div>

          {/* Bot-freeze overlay */}
          {frozen && (
            <div
              aria-live="assertive"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(2,5,10,0.82)',
                borderRadius: 'inherit',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: 'rgba(255,215,0,0.5)',
                letterSpacing: '0.08em',
              }}
            >
              ⚡ verifying…
            </div>
          )}

          {/* VIEWPORT: The Content Area */}
          <div 
            onTouchStart={(e) => handleTouch(e, 'start')}
            onTouchMove={(e) => handleTouch(e, 'move')}
            onTouchEnd={(e) => handleTouch(e, 'end')}
            style={{ 
              transform: `translateX(${dragX}px)`, 
              transition: dragX === 0 ? 'transform 0.6s cubic-bezier(0.2, 1, 0.2, 1)' : 'none' 
            }}
            className="relative aspect-[3/4] rounded-3xl mb-8 bg-black border border-white/5 shadow-[inset_0_0_100px_rgba(0,0,0,1)]"
          >
             <span className="absolute bottom-5 left-5 text-[8px] text-[#FFD700]/20 font-mono">∇μ Jμ = 0</span>
          </div>

          {/* INTERACTIONS: Icons Only, No Numbers */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-10">
              {/* LIKE */}
              <button onClick={() => enginBridge.emitToChannel('LIKE', { videoId })} className="text-[#FFD700] hover:scale-110 active:scale-90 transition-all">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
              
              {/* COMMENT */}
              <button onClick={() => enginBridge.emitToChannel('COMMENT', { videoId })} className="text-white/20 hover:text-white transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            </div>

            {/* SHARE STATUS: A subtle gold bar to show activity */}
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent via-[#FFD700]/20 to-transparent" />
          </div>

        </div>
      </div>
    </div>
  );
}
