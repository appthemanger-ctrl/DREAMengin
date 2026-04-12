'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useSubmitScore } from '@/lib/games/hooks';

const WORDS = [
  'dream','blue','gold','sky','run','jump','play','make','create','build',
  'move','fast','art','beat','flow','vibe','mind','free','bold','glow',
  'rise','real','live','code','style','loop','space','push','time','link',
  'grow','share','fire','light','wave','drop','deep','pure','loud','clean',
  'shine','craft','rush','world','spark','reach','open','vast','edge','true',
];

type Phase = 'idle' | 'playing' | 'done';

export default function WordSprint() {
  const [phase, setPhase]       = useState<Phase>('idle');
  const [wordIdx, setWordIdx]   = useState(0);
  const [input, setInput]       = useState('');
  const [score, setScore]       = useState(0);
  const [misses, setMisses]     = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [flash, setFlash]       = useState<'correct' | 'wrong' | null>(null);
  const [shuffled, setShuffled] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitScore = useSubmitScore('word-sprint');
  useEffect(() => { if (phase === 'done') submitScore(score); }, [phase, score, submitScore]);

  const start = useCallback(() => {
    const sh = [...WORDS].sort(() => Math.random() - 0.5);
    setShuffled(sh);
    setWordIdx(0); setScore(0); setMisses(0); setTimeLeft(60);
    setInput(''); setFlash(null); setPhase('playing');
  }, []);
  useGameAutoStart(phase === 'idle' ? start : null);

  useEffect(() => {
    if (phase !== 'playing') return;
    inputRef.current?.focus();
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); setPhase('done'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    const target = shuffled[wordIdx] ?? '';
    if (val.toLowerCase() === target) {
      setFlash('correct'); setScore(s => s + 1); setWordIdx(i => i + 1); setInput('');
      setTimeout(() => setFlash(null), 180);
    } else if (val.endsWith(' ')) {
      setFlash('wrong'); setMisses(m => m + 1); setWordIdx(i => i + 1); setInput('');
      setTimeout(() => setFlash(null), 280);
    }
  };

  const barPct = (timeLeft / 60) * 100;
  const barColor = timeLeft > 20 ? 'var(--de-accent)' : timeLeft > 10 ? 'var(--de-gold)' : '#dc4444';

  if (phase === 'idle') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'20px 0' }}>
      <span style={{ fontSize:38 }}>📝</span>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:15, fontWeight:800, color:'var(--de-heading)' }}>Word Sprint</div>
        <div style={{ fontSize:12, color:'var(--de-text-dim)', marginTop:3 }}>Type each word correctly · 60 seconds · Space = skip</div>
      </div>
      <button type="button" onClick={start} className="de-btn de-btn-primary">Play Now</button>
    </div>
  );

  if (phase === 'done') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'20px 0' }}>
      <span style={{ fontSize:44 }}>{score >= 30 ? '🔥' : score >= 15 ? '⚡' : '💪'}</span>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:32, fontWeight:800, color:'var(--de-heading)' }}>{score}</div>
        <div style={{ fontSize:12, color:'var(--de-text-dim)' }}>words correct · {misses} skipped</div>
      </div>
      <button type="button" onClick={start} className="de-btn de-btn-primary">Play Again</button>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ height:4, borderRadius:9999, background:'rgba(160,195,240,0.2)' }}>
        <div style={{ height:'100%', width:`${barPct}%`, background:barColor, borderRadius:9999, transition:'width 1s linear, background 0.3s' }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
        <span style={{ fontWeight:700, color:barColor }}>{timeLeft}s</span>
        <span style={{ color:'var(--de-text-dim)' }}>✓ {score} &nbsp;·&nbsp; ✗ {misses}</span>
      </div>
      <div style={{
        textAlign:'center', padding:'18px 0', fontSize:34, fontWeight:800, letterSpacing:'0.04em',
        color: flash === 'correct' ? '#16a34a' : flash === 'wrong' ? '#dc4444' : 'var(--de-heading)',
        transition:'color 0.15s',
      }}>
        {shuffled[wordIdx] ?? ''}
      </div>
      <input
        ref={inputRef} value={input} onChange={handleChange}
        style={{
          width:'100%', padding:'12px 16px', borderRadius:12, fontSize:20, fontWeight:700,
          textAlign:'center', outline:'none', letterSpacing:'0.06em',
          background: flash === 'correct' ? 'rgba(22,163,74,0.08)' : flash === 'wrong' ? 'rgba(220,68,68,0.08)' : 'rgba(255,255,255,0.6)',
          border:`2px solid ${flash === 'correct' ? '#16a34a' : flash === 'wrong' ? '#dc4444' : 'rgba(42,138,184,0.3)'}`,
          color:'var(--de-heading)', transition:'all 0.15s',
        }}
        placeholder="type here…"
        autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
      />
      <p style={{ fontSize:11, color:'var(--de-text-dim)', textAlign:'center' }}>Space bar to skip</p>
    </div>
  );
}
