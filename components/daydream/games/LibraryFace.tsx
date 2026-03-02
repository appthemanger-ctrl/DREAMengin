'use client';
import React, { useState } from 'react';
import { DSection, DCard, DBtn, DEmptyState, FACE_WRAPPER } from '../DayDreamShell';

const A = '#f97316';
type Game = { id: string; title: string; genre: string; players: string; icon: string; installed: boolean; wishlisted: boolean; recentlyPlayed?: boolean };

const CATALOG: Game[] = [
  { id: 'word-sprint',  title: 'Word Sprint',   genre: 'Word',    players: '1–4', icon: '📝', installed: true,  wishlisted: false, recentlyPlayed: true },
  { id: 'logic-gates',  title: 'Logic Gates',   genre: 'Puzzle',  players: '1',   icon: '⚡', installed: false, wishlisted: true  },
  { id: 'rhythm-clash', title: 'Rhythm Clash',  genre: 'Rhythm',  players: '1–2', icon: '🥁', installed: false, wishlisted: false },
  { id: 'tap-race',     title: 'Tap Race',      genre: 'Arcade',  players: '1–4', icon: '🏁', installed: true,  wishlisted: false },
  { id: 'word-duel',    title: 'Word Duel',     genre: 'Word',    players: '2',   icon: '⚔️', installed: false, wishlisted: true  },
  { id: 'puzzle-rush',  title: 'Puzzle Rush',   genre: 'Puzzle',  players: '1',   icon: '🧩', installed: false, wishlisted: false },
];
const CATEGORIES = ['All','Installed','Wishlist','Word','Puzzle','Rhythm','Arcade'];

type Props = { onPlay: (gameId: string) => void };

export default function LibraryFace({ onPlay }: Props) {
  const [games, setGames] = useState<Game[]>(CATALOG);
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');

  const toggle = (id: string, field: 'installed'|'wishlisted') =>
    setGames(gs => gs.map(g => g.id === id ? { ...g, [field]: !g[field] } : g));

  const filtered = games.filter(g => {
    if (q && !g.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat === 'Installed') return g.installed;
    if (cat === 'Wishlist')  return g.wishlisted;
    if (cat !== 'All')       return g.genre === cat;
    return true;
  });

  return (
    <div style={FACE_WRAPPER}>
      {/* Search */}
      <div style={{ marginBottom: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍  Search games…" style={{ width: '100%', ...inp }} />
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
        {CATEGORIES.map(c => (
          <button key={c} type="button" onClick={() => setCat(c)} style={{
            flexShrink: 0, padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: cat === c ? `${A}22` : 'rgba(100,150,255,0.06)',
            border: cat === c ? `1px solid ${A}55` : '1px solid rgba(100,150,255,0.1)',
            color: cat === c ? 'rgba(255,200,150,0.95)' : 'rgba(160,185,255,0.5)',
          }}>{c}</button>
        ))}
      </div>

      {/* Recently played */}
      {cat === 'All' && (
        <DSection title="Recently Played">
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {games.filter(g => g.recentlyPlayed).map(g => (
              <button key={g.id} type="button" onClick={() => onPlay(g.id)}
                style={{ flexShrink: 0, padding: '10px 16px', borderRadius: 14, cursor: 'pointer', background: `${A}22`, border: `1px solid ${A}44`, color: 'rgba(255,220,180,0.9)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{g.icon}</span><span style={{ fontWeight: 700 }}>{g.title}</span>
              </button>
            ))}
          </div>
        </DSection>
      )}

      {/* Game grid */}
      <DSection title={`${filtered.length} game${filtered.length !== 1 ? 's' : ''}`}>
        {filtered.length === 0 && <DEmptyState icon="🎮" message="No games found" />}
        {filtered.map(g => (
          <DCard key={g.id} accent={A} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${A}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{g.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(240,244,255,0.9)' }}>{g.title}</div>
                <div style={{ fontSize: 10, color: 'rgba(160,185,255,0.45)', marginTop: 2 }}>{g.genre} · {g.players} players</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => toggle(g.id, 'wishlisted')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: g.wishlisted ? '#facc15' : 'rgba(160,185,255,0.25)' }}>★</button>
                {g.installed
                  ? <DBtn label="▶ Play" accent={A} small onClick={() => onPlay(g.id)} />
                  : <DBtn label="Install" accent="#64748b" small ghost onClick={() => toggle(g.id, 'installed')} />}
              </div>
            </div>
          </DCard>
        ))}
      </DSection>
    </div>
  );
}

const inp: React.CSSProperties = { background: 'rgba(100,150,255,0.08)', border: '1px solid rgba(100,150,255,0.15)', borderRadius: 10, padding: '9px 14px', color: 'rgba(240,244,255,0.85)', fontSize: 13, outline: 'none' };
