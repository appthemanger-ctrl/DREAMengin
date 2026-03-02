'use client';
import React, { useEffect, useRef, useState } from 'react';

const A = '#f97316';

// ── Simple Word Sprint mini-game ─────────────────────────────────────────────
const WORDS = ['dream','code','music','create','build','launch','design','brand','play','learn','flow','sync','pulse','loop','wave','spark','glow','rise','shift','prime'];

type Props = { gameId?: string; onExit: () => void };

export default function PlayFace({ gameId: _gameId, onExit }: Props) {
  const [phase, setPhase] = useState<'menu'|'play'|'pause'|'end'>('menu');
  const [wordList, setWordList]   = useState<string[]>([]);
  const [current, setCurrent]     = useState(0);
  const [input, setInput]         = useState('');
  const [score, setScore]         = useState(0);
  const [timeLeft, setTimeLeft]   = useState(30);
  const [fps] = useState(60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function startGame() {
    const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
    setWordList(shuffled);
    setCurrent(0);
    setInput('');
    setScore(0);
    setTimeLeft(30);
    setPhase('play');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  useEffect(() => {
    if (phase === 'play') {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current!); setPhase('end'); return 0; }
          return t - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  function handleType(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInput(val);
    if (val.trimEnd() === wordList[current]) {
      setScore(s => s + val.trim().length);
      setCurrent(c => (c + 1) % wordList.length);
      setInput('');
    }
  }

  const timerPct = (timeLeft / 30) * 100;
  const timerColor = timeLeft > 10 ? '#4ade80' : timeLeft > 5 ? '#facc15' : '#f87171';

  return (
    <div style={{ minHeight: 'calc(100dvh - 52px)', background: '#020818', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Top bar — always reachable */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(100,150,255,0.1)' }}>
        <button type="button" onClick={onExit} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(160,185,255,0.5)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(100,150,255,0.2)' }}>← Library</button>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(160,185,255,0.4)', letterSpacing: '0.1em' }}>WORD SPRINT</span>
        {phase === 'play' && (
          <button type="button" onClick={() => setPhase('pause')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(160,185,255,0.5)' }}>⏸ Pause</button>
        )}
        <span style={{ fontSize: 10, color: 'rgba(100,150,255,0.3)' }}>{fps}fps</span>
      </div>

      {/* Game area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>

        {/* MENU */}
        {phase === 'menu' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📝</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'rgba(240,244,255,0.95)' }}>Word Sprint</div>
            <div style={{ fontSize: 13, color: 'rgba(160,185,255,0.5)', maxWidth: 260, textAlign: 'center', lineHeight: 1.6 }}>Type the words as fast as you can. 30 seconds. Every character scores points.</div>
            <button type="button" onClick={startGame} style={{ padding: '14px 40px', borderRadius: 30, fontSize: 15, fontWeight: 800, cursor: 'pointer', background: `linear-gradient(135deg,${A},#fb923c)`, border: 'none', color: '#fff', boxShadow: `0 4px 20px ${A}55` }}>▶ Start</button>
          </div>
        )}

        {/* PLAYING */}
        {phase === 'play' && (
          <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            {/* Timer bar */}
            <div style={{ width: '100%', height: 6, background: 'rgba(100,150,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${timerPct}%`, background: timerColor, borderRadius: 3, transition: 'width 0.5s linear, background 0.3s' }} />
            </div>
            {/* Stats */}
            <div style={{ display: 'flex', gap: 32, textAlign: 'center' }}>
              <div><div style={{ fontSize: 28, fontWeight: 800, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>{timeLeft}</div><div style={{ fontSize: 10, color: 'rgba(160,185,255,0.4)' }}>seconds</div></div>
              <div><div style={{ fontSize: 28, fontWeight: 800, color: A }}>{score}</div><div style={{ fontSize: 10, color: 'rgba(160,185,255,0.4)' }}>points</div></div>
            </div>
            {/* Target word */}
            <div style={{ fontSize: 36, fontWeight: 800, color: 'rgba(240,244,255,0.95)', letterSpacing: '0.08em', textTransform: 'lowercase' }}>
              {wordList[current]}
            </div>
            {/* Upcoming words */}
            <div style={{ display: 'flex', gap: 8, opacity: 0.3 }}>
              {[1,2,3].map(i => <span key={i} style={{ fontSize: 14, color: 'rgba(160,185,255,0.6)' }}>{wordList[(current+i) % wordList.length]}</span>)}
            </div>
            {/* Input */}
            <input ref={inputRef} value={input} onChange={handleType} placeholder="Type here…"
              style={{ width: '100%', padding: '14px 18px', borderRadius: 16, fontSize: 16, fontWeight: 700, outline: 'none', textAlign: 'center', background: 'rgba(100,150,255,0.1)', border: `2px solid ${input && wordList[current]?.startsWith(input) ? '#4ade80' : 'rgba(100,150,255,0.2)'}`, color: 'rgba(240,244,255,0.95)' }} />
          </div>
        )}

        {/* PAUSE */}
        {phase === 'pause' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <div style={{ fontSize: 36 }}>⏸</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'rgba(240,244,255,0.9)' }}>Paused</div>
            <div style={{ fontSize: 14, color: 'rgba(160,185,255,0.5)' }}>Score so far: {score} pts</div>
            <button type="button" onClick={() => { setPhase('play'); inputRef.current?.focus(); }} style={{ padding: '12px 32px', borderRadius: 24, cursor: 'pointer', background: `${A}22`, border: `1px solid ${A}55`, color: 'rgba(255,200,150,0.9)', fontSize: 13, fontWeight: 700 }}>▶ Resume</button>
            <button type="button" onClick={startGame} style={{ fontSize: 12, color: 'rgba(160,185,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>↺ New Game</button>
          </div>
        )}

        {/* END */}
        {phase === 'end' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <div style={{ fontSize: 48 }}>🏆</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'rgba(240,244,255,0.95)' }}>Time's Up!</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: A }}>{score}</div>
            <div style={{ fontSize: 14, color: 'rgba(160,185,255,0.45)' }}>points</div>
            <button type="button" onClick={startGame} style={{ padding: '12px 32px', borderRadius: 24, cursor: 'pointer', background: `linear-gradient(135deg,${A},#fb923c)`, border: 'none', color: '#fff', fontSize: 13, fontWeight: 800 }}>▶ Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
}
