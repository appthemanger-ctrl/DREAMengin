'use client';
import React, { useState } from 'react';
import { DSection, DCard, DBtn, DEmptyState, FACE_WRAPPER } from '../DayDreamShell';

const A = '#22d3ee';
type Note = { id: string; title: string; hypothesis: string; body: string; tags: string[]; public: boolean; date: string };

export default function ResearchFace() {
  const [notes, setNotes] = useState<Note[]>([
    { id: '1', title: 'Experiment Log #1', hypothesis: 'Velocity increases proportionally with force applied.', body: '', tags: ['physics','draft'], public: false, date: new Date().toLocaleDateString() },
  ]);
  const [active, setActive] = useState<string | null>('1');
  const [newTag, setNewTag] = useState('');

  const note = notes.find(n => n.id === active);
  const update = (partial: Partial<Note>) => setNotes(ns => ns.map(n => n.id === active ? { ...n, ...partial } : n));

  return (
    <div style={FACE_WRAPPER}>
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12 }}>
        {/* Sidebar — note list */}
        <div>
          <DBtn label="New Note" icon="+" accent={A} small onClick={() => {
            const id = Date.now().toString();
            setNotes(ns => [...ns, { id, title: 'Untitled', hypothesis: '', body: '', tags: [], public: false, date: new Date().toLocaleDateString() }]);
            setActive(id);
          }} />
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {notes.map(n => (
              <button key={n.id} type="button" onClick={() => setActive(n.id)} style={{
                textAlign: 'left', padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                background: active === n.id ? `${A}22` : 'rgba(100,150,255,0.06)',
                border: active === n.id ? `1px solid ${A}44` : '1px solid rgba(100,150,255,0.1)',
                color: active === n.id ? 'rgba(220,235,255,0.9)' : 'rgba(160,185,255,0.55)',
                fontSize: 11, fontWeight: 700,
              }}>
                <div style={{ marginBottom: 2 }}>{n.title}</div>
                <div style={{ fontSize: 9, opacity: 0.6 }}>{n.date}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div>
          {!note && <DEmptyState icon="🔬" message="Select or create a note" />}
          {note && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input value={note.title} onChange={e => update({ title: e.target.value })} placeholder="Note title" style={{ ...inp, fontSize: 15, fontWeight: 700 }} />

              <DCard accent={A} style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: `${A}99`, marginBottom: 6 }}>Hypothesis</div>
                <textarea value={note.hypothesis} onChange={e => update({ hypothesis: e.target.value })} placeholder="State your hypothesis…" rows={2} style={{ ...inp, width: '100%', resize: 'vertical' }} />
              </DCard>

              <textarea value={note.body} onChange={e => update({ body: e.target.value })} placeholder="Research notes, observations, methods… (markdown supported)" rows={8} style={{ ...inp, width: '100%', resize: 'vertical', lineHeight: 1.6 }} />

              {/* Tags */}
              <DSection title="Tags">
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {note.tags.map(t => (
                    <span key={t} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: `${A}18`, border: `1px solid ${A}33`, color: `${A}cc`, cursor: 'pointer' }}
                      onClick={() => update({ tags: note.tags.filter(x => x !== t) })}>{t} ×</span>
                  ))}
                  <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="+ tag" style={{ ...inp, width: 80, padding: '3px 8px', fontSize: 11 }}
                    onKeyDown={e => { if (e.key === 'Enter' && newTag.trim()) { update({ tags: [...note.tags, newTag.trim()] }); setNewTag(''); } }} />
                </div>
              </DSection>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <DBtn label={note.public ? '🌐 Public' : '🔒 Private'} accent={A} small ghost onClick={() => update({ public: !note.public })} />
                <DBtn label="Save" icon="✓" accent={A} small />
                <DBtn label="Publish to Feed" icon="↑" accent={A} small ghost />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { background: 'rgba(100,150,255,0.08)', border: '1px solid rgba(100,150,255,0.15)', borderRadius: 8, padding: '8px 10px', color: 'rgba(240,244,255,0.85)', fontSize: 12, outline: 'none' };
