'use client';
import React, { useState } from 'react';
import { DSection, DCard, DBtn, DEmptyState, FACE_WRAPPER } from '../DayDreamShell';

const A = '#a855f7';
type Track = { id: string; name: string; duration: string; muted: boolean; solo: boolean; volume: number; pan: number };

const DEMO: Track[] = [
  { id: '1', name: 'Drums',  duration: '2:30', muted: false, solo: false, volume: 80, pan: 0  },
  { id: '2', name: 'Bass',   duration: '2:30', muted: false, solo: false, volume: 70, pan: -15},
  { id: '3', name: 'Keys',   duration: '2:20', muted: false, solo: false, volume: 65, pan: 20 },
  { id: '4', name: 'Vocals', duration: '1:55', muted: false, solo: false, volume: 90, pan: 0  },
];

export default function StudioFace() {
  const [tracks, setTracks] = useState<Track[]>(DEMO);
  const [bpm, setBpm] = useState(120);
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');

  const toggle = (id: string, field: 'muted' | 'solo') =>
    setTracks(ts => ts.map(t => t.id === id ? { ...t, [field]: !t[field] } : t));
  const setVol = (id: string, v: number) =>
    setTracks(ts => ts.map(t => t.id === id ? { ...t, volume: v } : t));

  return (
    <div style={FACE_WRAPPER}>
      {/* Project Meta */}
      <DSection title="Project" action={<DBtn label="Export" icon="⬇" accent={A} small />}>
        <DCard accent={A}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input placeholder="Untitled Project" style={inp} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={lbl}>BPM</label>
              <input type="number" value={bpm} min={40} max={300} onChange={e => setBpm(+e.target.value)} style={{ ...inp, width: 64 }} />
            </div>
            <input placeholder="Genre" value={genre} onChange={e => setGenre(e.target.value)} style={{ ...inp, flex: 1 }} />
            <input placeholder="Mood" value={mood} onChange={e => setMood(e.target.value)} style={{ ...inp, flex: 1 }} />
          </div>
        </DCard>
      </DSection>

      {/* Tracks */}
      <DSection title={`Tracks (${tracks.length})`} action={
        <DBtn label="Add Track" icon="+" accent={A} small onClick={() =>
          setTracks(ts => [...ts, { id: Date.now().toString(), name: `Track ${ts.length+1}`, duration: '0:00', muted: false, solo: false, volume: 75, pan: 0 }])
        } />
      }>
        {tracks.map(t => (
          <DCard key={t.id} accent={A} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Waveform preview */}
              <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 28, width: 60, flexShrink: 0 }}>
                {[0.4,0.9,0.6,1,0.7,0.8,0.5,0.9,0.4,0.7].map((h,i) => (
                  <div key={i} style={{ flex: 1, background: t.muted ? 'rgba(100,150,255,0.15)' : A, opacity: 0.7, height: `${h*100}%`, borderRadius: 1 }} />
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(240,244,255,0.9)' }}>{t.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(160,185,255,0.4)' }}>{t.duration}</div>
              </div>
              {/* Vol */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={lbl}>Vol</span>
                <input type="range" min={0} max={100} value={t.volume} onChange={e => setVol(t.id, +e.target.value)} style={{ width: 60, cursor: 'pointer' }} />
              </div>
              {/* Mute / Solo */}
              <Pill label="M" active={t.muted}  color="#f87171" onClick={() => toggle(t.id, 'muted')} />
              <Pill label="S" active={t.solo}   color="#facc15" onClick={() => toggle(t.id, 'solo')}  />
            </div>
          </DCard>
        ))}
        {tracks.length === 0 && <DEmptyState icon="🎙" message="No tracks yet — click Add Track to start" />}
      </DSection>

      {/* Sample Library */}
      <DSection title="Sample Library" action={<DBtn label="Upload" icon="⬆" accent={A} small ghost />}>
        <DCard accent={A}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Kick 808','Hi-Hat','Snare Crack','Sub Bass','Vocal Chop'].map(s => (
              <button key={s} type="button" style={{ padding: '6px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', background: `${A}18`, border: `1px solid ${A}33`, color: 'rgba(220,220,255,0.8)' }}>
                ▶ {s}
              </button>
            ))}
          </div>
        </DCard>
      </DSection>

      {/* Cover Art */}
      <DSection title="Cover Art">
        <DCard accent={A} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 10, background: `linear-gradient(135deg,${A}44,rgba(5,15,45,0.9))`, border: `1px solid ${A}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🎨</div>
          <DBtn label="Upload Cover Art" icon="⬆" accent={A} small ghost />
        </DCard>
      </DSection>
    </div>
  );
}

const inp: React.CSSProperties = { background: 'rgba(100,150,255,0.08)', border: '1px solid rgba(100,150,255,0.15)', borderRadius: 8, padding: '7px 10px', color: 'rgba(240,244,255,0.85)', fontSize: 12, outline: 'none' };
const lbl: React.CSSProperties = { fontSize: 9, color: 'rgba(160,185,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' };

function Pill({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ width: 26, height: 26, borderRadius: 6, fontSize: 10, fontWeight: 800, cursor: 'pointer', flexShrink: 0, background: active ? `${color}33` : 'rgba(100,150,255,0.06)', border: active ? `1px solid ${color}` : '1px solid rgba(100,150,255,0.15)', color: active ? color : 'rgba(160,185,255,0.4)' }}>{label}</button>
  );
}
