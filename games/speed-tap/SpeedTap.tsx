'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useSubmitScore } from '@/lib/games/hooks';

type Phase = 'idle' | 'countdown' | 'playing' | 'done';

export default function SpeedTap() {
  const [phase, setPhase]     = useState<Phase>('idle');
  const [count, setCount]     = useState(0);
  const [countdown, setCd]    = useState(3);
  const [timeLeft, setTimeLeft] = useState(10);
  const [best, setBest]       = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitScore = useSubmitScore('speed-tap');
  useEffect(() => { if (phase === 'done') submitScore(count); }, [phase, count, submitScore]);

  const start = useCallback(() => {
    setCount(0); setCd(3); setTimeLeft(10); setPhase('countdown');
  }, []);
  useGameAutoStart(phase === 'idle' ? start : null);

  // countdown 3-2-1
  useEffect(() => {
    if (phase !== 'countdown') return;
    const iv = setInterval(() => {
      setCd(c => {
        if (c <= 1) { clearInterval(iv); setPhase('playing'); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  // 10s game timer
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setPhase('done');
          setCount(c => { setBest(b => Math.max(b, c)); return c; });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const tap = useCallback(() => {
    if (phase === 'playing') setCount(c => c + 1);
  }, [phase]);

  // keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); tap(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tap]);

  const tps = timeLeft < 10 ? (count / (10 - timeLeft)).toFixed(1) : '0.0';
  const barPct = (timeLeft / 10) * 100;

  if (phase === 'idle') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'20px 0' }}>
      <span style={{ fontSize:38 }}>⚡</span>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:15, fontWeight:800, color:'var(--de-heading)' }}>Speed Tap</div>
        <div style={{ fontSize:12, color:'var(--de-text-dim)', marginTop:3 }}>Tap as fast as you can for 10 seconds. Touch or Space bar.</div>
      </div>
      {best > 0 && <div style={{ fontSize:12, color:'var(--de-gold)', fontWeight:700 }}>Best: {best} taps</div>}
      <button type="button" onClick={start} className="de-btn de-btn-primary">Play Now</button>
    </div>
  );

  if (phase === 'countdown') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, padding:'32px 0' }}>
      <div style={{ fontSize:72, fontWeight:900, color:'var(--de-accent)', lineHeight:1 }}>{countdown}</div>
      <div style={{ fontSize:14, color:'var(--de-text-dim)' }}>Get ready…</div>
    </div>
  );

  if (phase === 'done') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'20px 0' }}>
      <span style={{ fontSize:44 }}>{count >= 80 ? '🔥' : count >= 50 ? '⚡' : '💪'}</span>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:36, fontWeight:800, color:'var(--de-heading)' }}>{count}</div>
        <div style={{ fontSize:12, color:'var(--de-text-dim)' }}>taps in 10 seconds · {tps} per sec</div>
        {count === best && best > 0 && <div style={{ fontSize:12, color:'var(--de-gold)', fontWeight:700, marginTop:4 }}>🏆 New best!</div>}
      </div>
      <button type="button" onClick={start} className="de-btn de-btn-primary">Play Again</button>
    </div>
  );

  // playing
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ height:4, borderRadius:9999, background:'rgba(160,195,240,0.2)' }}>
        <div style={{ height:'100%', width:`${barPct}%`, background:'var(--de-accent)', borderRadius:9999, transition:'width 1s linear' }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
        <span style={{ fontWeight:700, color:'var(--de-accent)' }}>{timeLeft}s</span>
        <span style={{ color:'var(--de-text-dim)' }}>{tps} taps/sec</span>
      </div>

      <button
        type="button"
        onClick={tap}
        style={{
          width:'100%', padding:'32px 0', borderRadius:20, border:'none',
          background: `linear-gradient(135deg, var(--de-accent), var(--de-gold))`,
          color:'#fff', fontSize:48, fontWeight:900, cursor:'pointer',
          userSelect:'none', WebkitUserSelect:'none',
          boxShadow:'0 4px 24px rgba(42,138,184,0.3)',
          transition:'transform 0.08s, box-shadow 0.08s',
          touchAction:'manipulation',
        }}
        onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(42,138,184,0.2)'; }}
        onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(42,138,184,0.3)'; }}
        aria-label="Tap!"
      >
        {count}
      </button>
      <p style={{ fontSize:11, color:'var(--de-text-dim)', textAlign:'center' }}>Tap or press Space</p>
    </div>
  );
}
