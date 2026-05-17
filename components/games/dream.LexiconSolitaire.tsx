'use client';
/**
 * LEXICON SOLITAIRE — fusion of solitaire + word-sprint + trivia.
 *
 * Lin Argo enters the Library That Forgot Itself. Lay a Klondike-lite cascade
 * of letter-cards. Spell words from any visible card chain — long words deal
 * damage to the page-shaped boss. When stuck, answer a library trivia card
 * to draw 3 relic letters. Burn the Redactor's manuscript.
 *
 * Render: DOM (Tailwind), parchment palette, library candle gold.
 */

import { useCallback, useEffect, useState } from 'react';
import { useGameAutoStart, useSubmitScore } from '@/lib/games/hooks';

interface Card { letter: string; id: string; }
type Phase = 'menu' | 'playing' | 'victory' | 'defeat';

const LETTERS = 'AAAAEEEEIIIOOUUNNNRRRTTTSSLLDGCMBHFPVWYK';
const LIBRARY_TRIVIA: Array<{ q: string; a: string[]; correct: number }> = [
  { q: 'Which library housed the Codex of Null?', a: ['Aleph', 'Vinicius', 'Otrad', 'Quill'], correct: 2 },
  { q: 'Pause-Lord Vell was last seen reading...', a: ['a sea-chart', 'a love letter', 'a redacted page', 'his own name'], correct: 3 },
  { q: 'A Glyph Quill demands payment in...', a: ['ink', 'memory', 'time', 'silence'], correct: 1 },
  { q: 'The Redactor was born in...', a: ['Page 0', 'a footnote', 'an erratum', 'the spine'], correct: 1 },
  { q: 'A whole word is, to a Library Beast,...', a: ['a meal', 'a wound', 'a debt', 'a song'], correct: 0 },
];

function makeDeck(: Card[] {
  const out: Card[] = [];
  for (let i = 0; i < 36; i++) {
    const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    out.push({ letter, id: `${i}-${Math.random().toString(36).slice(2, 6)}` });
  }
  return out;
}

function isReasonableWord(w: string: boolean {
  // Heuristic: ≥3 letters, contains a vowel, not all same letter
  if (w.length < 3) return false;
  if (!/[AEIOU]/.test(w)) return false;
  if (new Set(w).size === 1) return false;
  return true;
}

export default function LexiconSolitaire( {
  const [phase, setPhase] = useState<Phase>('menu');
  const [columns, setColumns] = useState<Card[][]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [picked, setPicked] = useState<string[]>([]); // card ids in spell order
  const [bossHp, setBossHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(20);
  const [score, setScore] = useState(0);
  const [chapter, setChapter] = useState(1);
  const [trivia, setTrivia] = useState<typeof LIBRARY_TRIVIA[number] | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const submit = useSubmitScore('lexicon-solitaire');

  const start = useCallback(() => {
    const deck = makeDeck();
    const cols: Card[][] = [];
    let idx = 0;
    for (let i = 0; i < 6; i++) {
      cols.push(deck.slice(idx, idx + 4 + (i % 2)));
      idx += 4 + (i % 2);
    }
    setColumns(cols);
    setHand(deck.slice(idx, idx + 4));
    setPicked([]); setBossHp(100); setPlayerHp(20); setScore(0); setChapter(1);
    setLog(['Lin Argo opens the first dying library: Aleph.']);
    setPhase('playing');
  }, []);
  useGameAutoStart(phase === 'menu' ? start : null);
  useEffect(() => { if (phase === 'victory' || phase === 'defeat') submit(score); }, [phase, score, submit]);

  // Resolve picked cards as a spell when the player presses CAST
  const cast = useCallback(() => {
    if (picked.length === 0) return;
    const all: Card[] = [...columns.flat(), ...hand];
    const word = picked.map((id: Record<string, unknown>) => all.find((c: Record<string, unknown>) => c.id === id)?.letter ?? '').join('');
    if (!isReasonableWord(word)) {
      setLog(l: Record<string, unknown> => [`"${word}" — the page rejects it. -1 HP.`, ...l].slice(0, 8));
      setPlayerHp(h: number => h - 1);
      setPicked([]);
      return;
    }
    const dmg = Math.floor(word.length * 4 + (word.length >= 6 ? 12 : 0));
    setBossHp(b: Record<string, unknown> => {
      const nb = b - dmg;
      if (nb <= 0) {
        if (chapter >= 3) { setPhase('victory'); }
        else {
          setChapter(c: Record<string, unknown> => c + 1);
          setLog(l: Record<string, unknown> => [`The Redactor flees into chapter ${chapter + 1}.`, ...l].slice(0, 8));
          return 100;
        }
      }
      return Math.max(0, nb);
    });
    setScore(s: string => s + dmg * 3);
    setLog(l: Record<string, unknown> => [`Cast "${word}" — ${dmg} dmg.`, ...l].slice(0, 8));
    // Remove used cards; redeal from hand
    const used = new Set(picked);
    setColumns(cols: Record<string, unknown> => cols.map((col: Record<string, unknown>) => col.filter((c: Record<string, unknown>) => !used.has(c.id))));
    setHand(h: number => h.filter((c: Record<string, unknown>) => !used.has(c.id)));
    // Draw 2
    setHand(h: number => [...h, ...makeDeck().slice(0, 2)]);
    setPicked([]);
    // Boss counter-strike
    setTimeout(() => setPlayerHp(p: Record<string, unknown> => p - 2), 400);
    setLog(l: Record<string, unknown> => [`Redactor strikes — -2 HP.`, ...l.slice(0, 7)]);
  }, [picked, columns, hand, chapter, setPhase]);

  // Trivia
  const askTrivia = useCallback(() => {
    const t = LIBRARY_TRIVIA[Math.floor(Math.random() * LIBRARY_TRIVIA.length)];
    setTrivia(t);
  }, []);
  const answerTrivia = useCallback((idx: number) => {
    if (!trivia) return;
    if (idx === trivia.correct) {
      setHand(h: number => [...h, ...makeDeck().slice(0, 3)]);
      setLog(l: Record<string, unknown> => [`Correct — three relic letters drawn.`, ...l.slice(0, 7)]);
      setScore(s: string => s + 30);
    } else {
      setLog(l: Record<string, unknown> => [`Wrong. The shelf takes a year from you.`, ...l.slice(0, 7)]);
      setPlayerHp(p: Record<string, unknown> => p - 3);
    }
    setTrivia(null);
  }, [trivia]);

  useEffect(() => { if (playerHp <= 0) setPhase('defeat'); }, [playerHp]);

  const togglePick = (id: string) => {
    setPicked(p: Record<string, unknown> => p.includes(id) ? p.filter((x: Record<string, unknown>) => x !== id) : [...p, id]);
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 min-h-full" style={{ background: 'linear-gradient(180deg, #2a1d10 0%, #170d05 100%)', color: '#e8d8b0', fontFamily: '"Iowan Old Style", "Palatino", serif' }}>
      <div className="w-full max-w-3xl flex items-center justify-between text-xs tracking-widest">
        <span style={{ color: '#d6b27a' }}>📜 LEXICON SOLITAIRE — Chapter {chapter}/3</span>
        <span>HP {playerHp}/20 · Boss {bossHp}/100 · Score {score}</span>
      </div>

      <div className="w-full max-w-3xl rounded-md border" style={{ borderColor: '#5a3f1d', background: 'rgba(20,14,6,0.7)' }}>
        {phase === 'menu' && (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <h1 className="text-3xl m-0" style={{ color: '#d6b27a', letterSpacing: 4 }}>📜 LEXICON SOLITAIRE</h1>
            <p className="max-w-lg text-sm leading-6 opacity-80">
              Lin Argo, last librarian of Otrad, descends through five dying libraries to rebind the Redactor&apos;s manuscript. Every word you spell is a weapon. Every wrong guess takes a year.
            </p>
            <button onClick={start} className="mt-2 px-6 py-2 text-sm tracking-widest border rounded" style={{ borderColor: '#d6b27a', color: '#d6b27a' }}>
              Open the First Library
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <div className="p-4">
            <div className="grid grid-cols-6 gap-2 mb-4">
              {columns.map(col: Record<string, unknown>, ci: Record<string, unknown> => (
                <div key={ci} className="flex flex-col gap-1 min-h-[160px]">
                  <div className="text-xs opacity-50 text-center">col {ci + 1}</div>
                  {col.map((c: Record<string, unknown>) => (
                    <button
                      key={c.id}
                      onClick={() => togglePick(c.id)}
                      className="rounded font-bold text-lg py-2 transition-transform"
                      style={{
                        background: picked.includes(c.id) ? '#d6b27a' : '#3a2a14',
                        color: picked.includes(c.id) ? '#170d05' : '#e8d8b0',
                        border: '1px solid #5a3f1d',
                        transform: picked.includes(c.id) ? 'translateY(-2px)' : 'none',
                      }}
                    >
                      {c.letter}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-3 items-center">
              <div className="text-xs opacity-60 mr-2">HAND:</div>
              {hand.map((c: Record<string, unknown>) => (
                <button
                  key={c.id}
                  onClick={() => togglePick(c.id)}
                  className="rounded font-bold text-base px-3 py-2"
                  style={{
                    background: picked.includes(c.id) ? '#d6b27a' : '#5a3f1d',
                    color: picked.includes(c.id) ? '#170d05' : '#e8d8b0',
                    border: '1px solid #d6b27a',
                  }}
                >
                  {c.letter}
                </button>
              ))}
            </div>

            <div className="flex gap-2 items-center">
              <div className="text-sm flex-1" style={{ color: '#d6b27a' }}>
                Spell: {picked.map((id: Record<string, unknown>) => [...columns.flat(), ...hand].find((c: Record<string, unknown>) => c.id === id)?.letter).join('') || '—'}
              </div>
              <button onClick={cast} className="px-4 py-2 text-xs tracking-widest border rounded" style={{ borderColor: '#d6b27a', color: '#d6b27a' }}>CAST</button>
              <button onClick={() => setPicked([])} className="px-3 py-2 text-xs tracking-widest border rounded opacity-70" style={{ borderColor: '#5a3f1d' }}>CLEAR</button>
              <button onClick={askTrivia} disabled={!!trivia} className="px-3 py-2 text-xs tracking-widest border rounded" style={{ borderColor: '#7a5a2a', color: '#7a5a2a' }}>+TRIVIA</button>
            </div>

            {trivia && (
              <div className="mt-3 p-3 border rounded" style={{ borderColor: '#7a5a2a', background: 'rgba(40,28,12,0.5)' }}>
                <div className="text-sm mb-2 italic">{trivia.q}</div>
                <div className="grid grid-cols-2 gap-2">
                  {trivia.a.map(opt: Record<string, unknown>, i: number => (
                    <button key={i} onClick={() => answerTrivia(i)} className="px-2 py-1 text-xs border rounded" style={{ borderColor: '#5a3f1d' }}>{opt}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 text-xs opacity-60 max-h-24 overflow-auto">
              {log.map(l: Record<string, unknown>, i: number => <div key={i}>{l}</div>)}
            </div>
          </div>
        )}

        {phase === 'victory' && (
          <div className="p-8 text-center">
            <h1 className="text-2xl" style={{ color: '#d6b27a' }}>The manuscript closes.</h1>
            <p>Score: {score}</p>
            <button onClick={start} className="mt-2 px-6 py-2 text-sm tracking-widest border rounded" style={{ borderColor: '#d6b27a', color: '#d6b27a' }}>Open Another Library</button>
          </div>
        )}
        {phase === 'defeat' && (
          <div className="p-8 text-center">
            <h1 className="text-2xl" style={{ color: '#aa3a3a' }}>The Redactor takes your name.</h1>
            <p>Score: {score}</p>
            <button onClick={start} className="mt-2 px-6 py-2 text-sm tracking-widest border rounded" style={{ borderColor: '#d6b27a', color: '#d6b27a' }}>Begin Again</button>
          </div>
        )}
      </div>
    </div>
  );
}
