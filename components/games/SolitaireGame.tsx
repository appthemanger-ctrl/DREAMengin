'use client';
/**
 * SolitaireGame — Classic Klondike Solitaire card game.
 * Category: card game / casual
 */
import { useCallback, useEffect, useState } from 'react';
import { useGameAutoStart, useSubmitScore } from '@/lib/games/hooks';

type Suit = '♠'|'♥'|'♦'|'♣';
type Rank = 'A'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K';
interface Card { suit: Suit; rank: Rank; face: boolean; }
type Phase = 'menu' | 'playing' | 'win';

const SUITS: Suit[] = ['♠','♥','♦','♣'];
const RANKS: Rank[] = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const RED: Suit[] = ['♥','♦'];
const RANK_VAL: Record<Rank,number> = { A:1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,J:11,Q:12,K:13 };

function isRed(s: Suit) { return RED.includes(s); }

function makeDeck(): Card[] {
  const d: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) d.push({ suit, rank, face: false });
  return d.sort(() => Math.random() - 0.5);
}

function makeGame() {
  const deck = makeDeck();
  const tableau: Card[][] = Array.from({ length: 7 }, (_, i) => {
    const col = deck.splice(0, i + 1);
    col[col.length - 1].face = true;
    return col;
  });
  return { deck, stock: deck.splice(0), waste: [] as Card[], foundation: [[], [], [], []] as Card[][], tableau };
}

export default function SolitaireGame() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [state, setState] = useState(() => makeGame());
  const [selected, setSelected] = useState<{ from: 'tableau'|'waste'; col?: number; cardIdx?: number } | null>(null);
  const [moves, setMoves] = useState(0);
  const submitScore = useSubmitScore('solitaire');
  useEffect(() => { if (phase === 'win') submitScore(Math.max(0, 5000 - moves * 10)); }, [phase, moves, submitScore]);

  const startGame = useCallback(() => {
    setState(makeGame()); setSelected(null); setMoves(0); setPhase('playing');
  }, []);
  useGameAutoStart(phase === 'menu' ? startGame : null);

  const canPlace = (card: Card, onto: Card | null): boolean => {
    if (!onto) return card.rank === 'K';
    return isRed(card.suit) !== isRed(onto.suit) && RANK_VAL[card.rank] === RANK_VAL[onto.rank] - 1;
  };

  const canFoundation = (card: Card, pile: Card[]): boolean => {
    if (pile.length === 0) return card.rank === 'A';
    const top = pile[pile.length - 1];
    return top.suit === card.suit && RANK_VAL[card.rank] === RANK_VAL[top.rank] + 1;
  };

  const drawFromStock = useCallback(() => {
    setState(s => {
      const next = { ...s, stock: [...s.stock], waste: [...s.waste] };
      if (next.stock.length === 0) { next.stock = next.waste.reverse().map(c => ({ ...c, face: false })); next.waste = []; }
      else { const c = next.stock.pop()!; c.face = true; next.waste.push(c); }
      return next;
    });
    setMoves(m => m + 1);
  }, []);

  const handleTableauClick = useCallback((col: number, cardIdx: number) => {
    const card = state.tableau[col][cardIdx];
    if (!card.face) {
      if (cardIdx === state.tableau[col].length - 1) {
        setState(s => { const t = s.tableau.map(c => [...c]); t[col][cardIdx] = { ...t[col][cardIdx], face: true }; return { ...s, tableau: t }; });
      }
      return;
    }

    if (selected) {
      const topCard = state.tableau[col][state.tableau[col].length - 1];
      const movingCard = selected.from === 'waste' ? state.waste[state.waste.length - 1] : state.tableau[selected.col!][selected.cardIdx!];
      if (canPlace(movingCard, topCard ?? null)) {
        setState(s => {
          const t = s.tableau.map(c => [...c]);
          let moving: Card[];
          let w = s.waste;
          if (selected.from === 'waste') { moving = [s.waste[s.waste.length - 1]]; w = s.waste.slice(0, -1); }
          else { moving = t[selected.col!].splice(selected.cardIdx!); if (t[selected.col!].length > 0) t[selected.col!][t[selected.col!].length - 1].face = true; }
          t[col].push(...moving);
          return { ...s, tableau: t, waste: w };
        });
        setSelected(null); setMoves(m => m + 1); return;
      }
      setSelected(null);
    }
    setSelected({ from: 'tableau', col, cardIdx });
  }, [selected, state]);

  const handleWasteClick = useCallback(() => {
    if (state.waste.length === 0) return;
    if (selected?.from === 'waste') { setSelected(null); return; }
    setSelected({ from: 'waste' });
  }, [selected, state.waste]);

  const handleFoundationClick = useCallback((foundIdx: number) => {
    const card = selected?.from === 'waste' ? state.waste[state.waste.length - 1]
      : selected?.from === 'tableau' ? state.tableau[selected.col!][state.tableau[selected.col!].length - 1]
      : null;
    if (!card) return;
    if (canFoundation(card, state.foundation[foundIdx])) {
      setState(s => {
        const f = s.foundation.map(p => [...p]);
        f[foundIdx].push({ ...card });
        const t = s.tableau.map(c => [...c]);
        let w = s.waste;
        if (selected!.from === 'waste') { w = s.waste.slice(0, -1); }
        else { t[selected!.col!].splice(selected!.cardIdx!); if (t[selected!.col!].length > 0) t[selected!.col!][t[selected!.col!].length - 1].face = true; }
        const won = f.every(p => p.length === 13);
        return { ...s, foundation: f, tableau: t, waste: w };
      });
      setSelected(null); setMoves(m => m + 1);
      // Check win
      setTimeout(() => {
        setState(s => {
          if (s.foundation.every(p => p.length === 13)) setPhase('win');
          return s;
        });
      }, 100);
    }
  }, [selected, state]);

  const CARD_W = 56; const CARD_H = 76;
  const cardStyle = (card: Card, isSel = false): React.CSSProperties => ({
    width: CARD_W, height: CARD_H, borderRadius: 6, border: `2px solid ${isSel ? '#facc15' : 'rgba(255,255,255,0.2)'}`,
    background: card.face ? '#fff' : 'linear-gradient(135deg, #1e3a5f, #0f172a)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
    color: card.face ? (isRed(card.suit) ? '#dc2626' : '#111') : 'transparent',
    fontSize: 11, fontWeight: 700, userSelect: 'none', position: 'relative',
  });

  if (phase === 'menu') return (
    <div style={{ background: '#14532d', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>🃏 KLONDIKE SOLITAIRE</div>
      <div style={{ fontSize: 12, color: '#86efac' }}>Build four foundation piles from Ace to King!</div>
      <button onClick={startGame} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>▶ Deal Cards</button>
    </div>
  );
  if (phase === 'win') return (
    <div style={{ background: '#14532d', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ fontSize: 28, color: '#facc15', fontWeight: 900 }}>🏆 You Win!</div>
      <div style={{ fontSize: 14, color: '#86efac' }}>Completed in {moves} moves</div>
      <button onClick={startGame} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>New Game</button>
    </div>
  );

  const topWaste = state.waste[state.waste.length - 1];
  return (
    <div style={{ background: '#14532d', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, overflowX: 'auto' }}>
      {/* Top row: stock, waste, foundations */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minWidth: 'max-content' }}>
        {/* Stock */}
        <div onClick={drawFromStock} style={{ ...cardStyle({ suit: '♠', rank: 'A', face: false }), cursor: 'pointer', flexShrink: 0 }}>
          {state.stock.length > 0 ? <span style={{ color: '#60a5fa', fontSize: 16 }}>🂠</span> : <span style={{ color: '#9ca3af', fontSize: 12 }}>↺</span>}
        </div>
        {/* Waste */}
        <div onClick={handleWasteClick} style={topWaste ? cardStyle(topWaste, selected?.from === 'waste') : { ...cardStyle({ suit: '♠', rank: 'A', face: false }), opacity: 0.3 }}>
          {topWaste && <div style={{ padding: 4 }}><div>{topWaste.rank}</div><div>{topWaste.suit}</div></div>}
        </div>
        <div style={{ flex: 1 }} />
        {/* Foundations */}
        {state.foundation.map((pile, fi) => {
          const top = pile[pile.length - 1];
          return (
            <div key={fi} onClick={() => handleFoundationClick(fi)} style={{ ...cardStyle(top ?? { suit: SUITS[fi], rank: 'A', face: false }), border: '2px dashed rgba(255,255,255,0.3)', opacity: top ? 1 : 0.5 }}>
              {top ? <div style={{ padding: 4 }}><div>{top.rank}</div><div>{top.suit}</div></div> : <span style={{ color: '#86efac', fontSize: 20 }}>{SUITS[fi]}</span>}
            </div>
          );
        })}
      </div>
      {/* Tableau */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', minWidth: 'max-content' }}>
        {state.tableau.map((col, ci) => (
          <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: CARD_H, position: 'relative' }}>
            {col.length === 0 ? (
              <div onClick={() => selected && handleTableauClick(ci, 0)} style={{ width: CARD_W, height: CARD_H, borderRadius: 6, border: '2px dashed rgba(255,255,255,0.2)', cursor: 'pointer' }} />
            ) : col.map((card, idx) => {
              const isSel = selected?.from === 'tableau' && selected.col === ci && (selected.cardIdx ?? -1) <= idx;
              return (
                <div key={idx} onClick={() => handleTableauClick(ci, idx)}
                  style={{ ...cardStyle(card, isSel), marginTop: idx === 0 ? 0 : -CARD_H + 18, zIndex: idx }}>
                  {card.face && <div style={{ padding: 4 }}><div>{card.rank}</div><div>{card.suit}</div></div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: '#86efac', textAlign: 'center' }}>Moves: {moves} · Click stock to draw · Click card to select · Click destination to move</div>
    </div>
  );
}
