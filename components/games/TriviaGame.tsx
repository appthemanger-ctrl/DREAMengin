'use client';
/**
 * TriviaGame — Quiz game with multiple categories.
 * Category: trivia / educational
 */
import { useCallback, useEffect, useState } from 'react';
import { useGameAutoStart, useSubmitScore } from '@/lib/games/hooks';

type Phase = 'menu' | 'playing' | 'done';

const QUESTIONS = [
  { q: 'What is the capital of France?', a: 0, options: ['Paris','London','Berlin','Madrid'] },
  { q: 'Which planet is known as the Red Planet?', a: 1, options: ['Venus','Mars','Jupiter','Saturn'] },
  { q: 'What is 15 × 14?', a: 2, options: ['190','200','210','220'] },
  { q: 'Who painted the Mona Lisa?', a: 0, options: ['Leonardo da Vinci','Picasso','Raphael','Michelangelo'] },
  { q: 'What is the chemical symbol for gold?', a: 1, options: ['Ag','Au','Fe','Cu'] },
  { q: 'Which programming language uses "fun" for functions?', a: 2, options: ['Python','JavaScript','Kotlin','Swift'] },
  { q: 'What year did the first iPhone launch?', a: 1, options: ['2005','2007','2008','2010'] },
  { q: 'Who wrote "1984"?', a: 0, options: ['George Orwell','Aldous Huxley','Ray Bradbury','Philip K. Dick'] },
  { q: 'What is the largest ocean on Earth?', a: 2, options: ['Atlantic','Arctic','Pacific','Indian'] },
  { q: 'Which element has atomic number 1?', a: 3, options: ['Helium','Oxygen','Carbon','Hydrogen'] },
  { q: 'What does CPU stand for?', a: 0, options: ['Central Processing Unit','Computer Power Unit','Control Processing Unit','Central Program Unit'] },
  { q: 'In chess, which piece can only move diagonally?', a: 1, options: ['Rook','Bishop','Knight','Queen'] },
  { q: 'What is the largest prime number less than 20?', a: 2, options: ['17','18','19','20'] },
  { q: 'Which country invented the internet?', a: 3, options: ['Japan','UK','Germany','USA'] },
  { q: 'What is the speed of light (approx)?', a: 0, options: ['300,000 km/s','30,000 km/s','3,000,000 km/s','300 km/s'] },
];

export default function TriviaGame() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [shuffled, setShuffled] = useState<typeof QUESTIONS>([]);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const submitScore = useSubmitScore('trivia');
  useEffect(() => { if (phase === 'done') submitScore(score); }, [phase, score, submitScore]);

  const startGame = useCallback(() => {
    const s = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
    setShuffled(s); setIdx(0); setScore(0); setSelected(null); setStreak(0);
    setPhase('playing');
  }, []);
  useGameAutoStart(phase === 'menu' ? startGame : null);

  const handleAnswer = useCallback((optIdx: number) => {
    if (selected !== null) return;
    setSelected(optIdx);
    const correct = shuffled[idx].a === optIdx;
    const newStreak = correct ? streak + 1 : 0;
    setStreak(newStreak);
    setMaxStreak(m => Math.max(m, newStreak));
    if (correct) setScore(s => s + 10 + newStreak * 2);
    setTimeout(() => {
      if (idx + 1 >= shuffled.length) { setPhase('done'); }
      else { setIdx(i => i + 1); setSelected(null); }
    }, 900);
  }, [idx, selected, shuffled, streak]);

  if (phase === 'menu') return (
    <div style={{ background: '#0c1445', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#818cf8' }}>🧠 TRIVIA QUEST</div>
      <div style={{ fontSize: 12, color: '#a5b4fc' }}>10 questions · Score more for answer streaks · Test your knowledge!</div>
      <button onClick={startGame} style={{ background: '#4338ca', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>▶ Start Quiz</button>
    </div>
  );

  if (phase === 'done') return (
    <div style={{ background: '#0c1445', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ fontSize: 26, color: '#818cf8', fontWeight: 900 }}>🎓 Quiz Complete!</div>
      <div style={{ fontSize: 24, color: '#facc15', fontWeight: 700 }}>Score: {score}</div>
      <div style={{ fontSize: 13, color: '#a5b4fc' }}>Max streak: {maxStreak}x</div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>
        {score >= 80 ? '🏆 Excellent!' : score >= 60 ? '✅ Good job!' : score >= 40 ? '👍 Not bad!' : '📚 Keep learning!'}
      </div>
      <button onClick={startGame} style={{ background: '#4338ca', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Play Again</button>
    </div>
  );

  const q = shuffled[idx];
  return (
    <div style={{ background: '#0c1445', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a5b4fc', fontSize: 12 }}>
        <span>Question {idx + 1} / {shuffled.length}</span>
        <span style={{ color: '#facc15', fontWeight: 700 }}>Score: {score}</span>
        {streak > 1 && <span style={{ color: '#f97316', fontWeight: 700 }}>🔥 {streak}x streak!</span>}
      </div>
      <div style={{ background: '#1e1b4b', borderRadius: 8, padding: '14px 16px', fontSize: 15, fontWeight: 600, color: '#e0e7ff', lineHeight: 1.5 }}>
        {q.q}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.options.map((opt, i) => {
          const isCorrect = i === q.a;
          const isSelected = i === selected;
          const revealed = selected !== null;
          let bg = '#1e3a5f';
          if (revealed) { if (isCorrect) bg = '#14532d'; else if (isSelected) bg = '#450a0a'; }
          if (!revealed && isSelected) bg = '#312e81';
          return (
            <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
              style={{
                background: bg, color: '#fff', border: `1.5px solid ${revealed && isCorrect ? '#22c55e' : revealed && isSelected ? '#ef4444' : '#312e81'}`,
                padding: '10px 14px', borderRadius: 8, fontSize: 13, textAlign: 'left', cursor: selected !== null ? 'default' : 'pointer',
                fontWeight: isSelected || (revealed && isCorrect) ? 700 : 400,
                transition: 'background 0.2s',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
              <span style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0, fontWeight: 700 }}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
              {revealed && isCorrect && <span style={{ marginLeft: 'auto' }}>✓</span>}
              {revealed && isSelected && !isCorrect && <span style={{ marginLeft: 'auto' }}>✗</span>}
            </button>
          );
        })}
      </div>
      <div style={{ height: 4, background: '#1e1b4b', borderRadius: 999 }}>
        <div style={{ height: 4, background: '#818cf8', borderRadius: 999, width: `${((idx) / shuffled.length) * 100}%`, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}
