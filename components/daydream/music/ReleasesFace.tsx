'use client';
import React, { useState } from 'react';
import { DSection, DCard, DBtn, DEmptyState, DMetricCard, FACE_WRAPPER } from '../DayDreamShell';

const A = '#a855f7';
type Release = { id: string; title: string; type: 'single'|'EP'|'album'; status: 'draft'|'scheduled'|'live'; plays: number; price: number };

export default function ReleasesFace() {
  const [releases, setReleases] = useState<Release[]>([
    { id: '1', title: 'Untitled Single', type: 'single', status: 'draft', plays: 0, price: 0 },
  ]);
  const [newTitle, setNewTitle] = useState('');

  const publish = (id: string) => setReleases(rs => rs.map(r => r.id === id ? { ...r, status: 'live' } : r));

  return (
    <div style={FACE_WRAPPER}>
      {/* Metrics */}
      <DSection title="Overview">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 0 }}>
          <DMetricCard label="Total Plays" value="—" accent={A} icon="▶️" />
          <DMetricCard label="Revenue" value="$0" delta="+0%" accent={A} icon="💰" />
          <DMetricCard label="Releases" value={String(releases.length)} accent={A} icon="📀" />
        </div>
      </DSection>

      {/* New release */}
      <DSection title="New Release">
        <DCard accent={A}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input placeholder="Release title…" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={inp} />
            <DBtn label="Create" icon="+" accent={A} small onClick={() => {
              if (!newTitle.trim()) return;
              setReleases(rs => [...rs, { id: Date.now().toString(), title: newTitle, type: 'single', status: 'draft', plays: 0, price: 0 }]);
              setNewTitle('');
            }} />
          </div>
        </DCard>
      </DSection>

      {/* Releases list */}
      <DSection title="My Releases">
        {releases.length === 0 && <DEmptyState icon="📀" message="No releases yet" />}
        {releases.map(r => (
          <DCard key={r.id} accent={A} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: `linear-gradient(135deg,${A}44,rgba(5,15,45,0.9))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📀</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(240,244,255,0.9)' }}>{r.title}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                  <StatusBadge status={r.status} accent={A} />
                  <span style={{ fontSize: 10, color: 'rgba(160,185,255,0.4)' }}>{r.type} · ▶ {r.plays} · {r.price === 0 ? 'Free' : `$${r.price}`}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {r.status === 'draft' && <DBtn label="Publish" accent={A} small onClick={() => publish(r.id)} />}
                {r.status === 'live' && <DBtn label="Share" icon="↗" accent={A} small ghost />}
                <DBtn label="Archive" accent="#666" small ghost />
              </div>
            </div>
          </DCard>
        ))}
      </DSection>

      {/* Promo */}
      <DSection title="Promotion">
        <DCard accent={A}>
          <div style={{ fontSize: 12, color: 'rgba(160,185,255,0.6)', marginBottom: 10 }}>Generate a promo link for your latest release</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, padding: '8px 12px', background: 'rgba(100,150,255,0.08)', border: '1px solid rgba(100,150,255,0.15)', borderRadius: 8, fontSize: 11, color: 'rgba(160,185,255,0.4)', fontFamily: 'monospace' }}>dreamengin.com/r/your-release</div>
            <DBtn label="Copy" icon="⎘" accent={A} small ghost />
          </div>
        </DCard>
      </DSection>
    </div>
  );
}

const inp: React.CSSProperties = { flex: 1, background: 'rgba(100,150,255,0.08)', border: '1px solid rgba(100,150,255,0.15)', borderRadius: 8, padding: '7px 10px', color: 'rgba(240,244,255,0.85)', fontSize: 12, outline: 'none', minWidth: 140 };

function StatusBadge({ status, accent }: { status: string; accent: string }) {
  const colors: Record<string, string> = { draft: '#94a3b8', scheduled: '#facc15', live: '#4ade80' };
  const c = colors[status] ?? '#94a3b8';
  return <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c, background: `${c}22`, padding: '2px 7px', borderRadius: 10, border: `1px solid ${c}44` }}>{status}</span>;
}
