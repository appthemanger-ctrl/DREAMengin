'use client';

import { useCallback, useEffect, useState } from 'react';

const EMOJIS = ['🌊','🔥','⚡','🎵','💎','🌙','🎯','🚀'];

interface Card { id: number; emoji: string; matched: boolean; flipped: boolean; }

function makeCards(): Card[] {
  const pairs = [...EMOJIS, ...EMOJIS]
    .sort(() => Math.random() - 0.5)
    .map((emoji, id) => ({ id, emoji, matched: false, flipped: false }));
  return pairs;
}

type Phase = 'idle' | 'playing' | 'won';

export default function MemoryGrid() {
  const [phase, setPhase]   = useState<Phase>('idle');
  const [cards, setCards]   = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves]   = useState(0);
  const [locked, setLocked] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useState<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setCards(makeCards());
    setFlipped([]); setMoves(0); setElapsed(0); setLocked(false); setPhase('playing');
  }, []);

  // timer
  useEffect(() => {
    if (phase !== 'playing') return;
    const iv = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(iv);
  }, [phase]);

  const flip = useCallback((id: number) => {
    if (locked) return;
    setCards(prev => {
      const card = prev[id];
      if (card.flipped || card.matched) return prev;
      return prev.map((c, i) => i === id ? { ...c, flipped: true } : c);
    });
    setFlipped(prev => {
      const next = [...prev, id];
      if (next.length === 2) {
        setMoves(m => m + 1);
        setLocked(true);
        setTimeout(() => {
          setCards(prevCards => {
            const [a, b] = next;
            const cardA = prevCards[a];
            const cardB = prevCards[b];
            const match = cardA.emoji === cardB.emoji;
            const updated = prevCards.map((c, i) => {
              if (i === a || i === b) return { ...c, matched: match, flipped: match };
              return c;
            });
            const allDone = updated.every(c => c.matched);
            if (allDone) setPhase('won');
            return updated;
          });
          setFlipped([]);
          setLocked(false);
        }, 700);
        return next;
      }
      return next;
    });
  }, [locked]);

  const fmt = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  if (phase === 'idle') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'20px 0' }}>
      <span style={{ fontSize:38 }}>🧩</span>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:15, fontWeight:800, color:'var(--de-heading)' }}>Memory Grid</div>
        <div style={{ fontSize:12, color:'var(--de-text-dim)', marginTop:3 }}>Flip cards to find matching pairs. 8 pairs, 4×4 grid.</div>
      </div>
      <button type="button" onClick={start} className="de-btn de-btn-primary">Play Now</button>
    </div>
  );

  if (phase === 'won') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'20px 0' }}>
      <span style={{ fontSize:44 }}>🎉</span>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:22, fontWeight:800, color:'var(--de-heading)' }}>You matched them all!</div>
        <div style={{ fontSize:13, color:'var(--de-text-dim)', marginTop:4 }}>{moves} moves · {fmt(elapsed)}</div>
      </div>
      <button type="button" onClick={start} className="de-btn de-btn-primary">Play Again</button>
    </div>
  );

  const matched = cards.filter(c => c.matched).length / 2;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
        <span style={{ color:'var(--de-text-dim)' }}>{fmt(elapsed)}</span>
        <span style={{ color:'var(--de-text-dim)' }}>{moves} moves · {matched}/8 matched</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
        {cards.map((card, i) => (
          <button
            key={card.id}
            type="button"
            onClick={() => flip(i)}
            style={{
              aspectRatio:'1', borderRadius:12, border:'none', cursor: card.matched ? 'default' : 'pointer',
              fontSize:24, display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.25s',
              background: card.matched
                ? 'linear-gradient(135deg, rgba(42,138,184,0.15), rgba(200,152,26,0.15))'
                : card.flipped
                  ? 'rgba(255,255,255,0.8)'
                  : 'rgba(42,138,184,0.12)',
              border: card.matched
                ? '1.5px solid rgba(200,152,26,0.4)'
                : card.flipped
                  ? '1.5px solid rgba(42,138,184,0.4)'
                  : '1.5px solid rgba(160,195,240,0.3)',
              transform: card.flipped || card.matched ? 'scale(1)' : 'scale(0.97)',
              boxShadow: card.matched ? '0 2px 8px rgba(200,152,26,0.15)' : 'none',
            }}
            aria-label={card.flipped || card.matched ? card.emoji : 'Hidden card'}
          >
            {card.flipped || card.matched ? card.emoji : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
