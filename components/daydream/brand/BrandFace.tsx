'use client';
import React, { useState } from 'react';
import { DSection, DCard, DBtn, DEmptyState, FACE_WRAPPER } from '../DayDreamShell';
const A = '#f472b6';
type Post = { id: string; content: string; platforms: string[]; scheduled?: string; status: 'draft'|'scheduled'|'posted' };
const PLATFORMS = ['Twitter/X','Instagram','TikTok','Facebook','LinkedIn'];
export default function BrandFace() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState('');
  const [sel, setSel] = useState<string[]>(['Twitter/X']);
  const [schedDate, setSchedDate] = useState('');
  const [assets, setAssets] = useState<string[]>(['Logo.png','Banner.jpg','Profile.png']);
  const togglePlatform = (p: string) => setSel(s => s.includes(p) ? s.filter(x=>x!==p) : [...s,p]);
  const addPost = () => {
    if (!draft.trim()) return;
    setPosts(ps => [...ps, { id: Date.now().toString(), content: draft, platforms: [...sel], scheduled: schedDate||undefined, status: schedDate ? 'scheduled' : 'draft' }]);
    setDraft(''); setSchedDate('');
  };
  const post = (id: string) => setPosts(ps => ps.map(p => p.id===id ? {...p, status:'posted'} : p));
  return (
    <div style={FACE_WRAPPER}>
      {/* Compose */}
      <DSection title="Compose Post">
        <DCard accent={A}>
          <textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="What's on your mind…" rows={3}
            style={{ width:'100%', background:'rgba(100,150,255,0.06)', border:`1px solid ${A}33`, borderRadius:8, padding:'10px 12px', color:'rgba(240,244,255,0.88)', fontSize:13, outline:'none', resize:'vertical', lineHeight:1.6 }} />
          <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap', alignItems:'center' }}>
            {PLATFORMS.map(p => (
              <button key={p} type="button" onClick={() => togglePlatform(p)} style={{ padding:'4px 12px', borderRadius:20, fontSize:10, fontWeight:700, cursor:'pointer', background: sel.includes(p)?`${A}22`:'rgba(100,150,255,0.06)', border: sel.includes(p)?`1px solid ${A}55`:'1px solid rgba(100,150,255,0.12)', color: sel.includes(p)?'rgba(255,190,220,0.95)':'rgba(160,185,255,0.45)' }}>{p}</button>
            ))}
          </div>
          <div style={{ display:'flex', gap:8, marginTop:10, alignItems:'center', flexWrap:'wrap' }}>
            <input type="datetime-local" value={schedDate} onChange={e => setSchedDate(e.target.value)}
              style={{ background:'rgba(100,150,255,0.08)', border:`1px solid rgba(100,150,255,0.15)`, borderRadius:8, padding:'6px 10px', color:'rgba(200,220,255,0.7)', fontSize:11, outline:'none' }} />
            <DBtn label={schedDate?'Schedule':'Post Now'} icon={schedDate?'📅':'↑'} accent={A} onClick={addPost} />
            <span style={{ fontSize:11, color:'rgba(160,185,255,0.35)' }}>{draft.length}/280</span>
          </div>
        </DCard>
      </DSection>
      {/* Queue */}
      <DSection title={`Queue (${posts.length})`}>
        {posts.length===0 && <DEmptyState icon="📅" message="No posts queued — compose one above" />}
        {posts.map(p => (
          <DCard key={p.id} accent={A} style={{ marginBottom:8 }}>
            <div style={{ fontSize:13, color:'rgba(240,244,255,0.85)', marginBottom:6, lineHeight:1.5 }}>{p.content}</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
              {p.platforms.map(pl => <span key={pl} style={{ fontSize:9, padding:'2px 8px', borderRadius:10, background:`${A}18`, border:`1px solid ${A}33`, color:`${A}cc` }}>{pl}</span>)}
              {p.scheduled && <span style={{ fontSize:9, color:'#facc15' }}>📅 {new Date(p.scheduled).toLocaleString()}</span>}
              <span style={{ fontSize:9, marginLeft:'auto', color: p.status==='posted'?'#4ade80': p.status==='scheduled'?'#facc15':'#94a3b8', fontWeight:700, textTransform:'uppercase' }}>{p.status}</span>
              {p.status==='draft' && <DBtn label="Post" accent={A} small onClick={() => post(p.id)} />}
            </div>
          </DCard>
        ))}
      </DSection>
      {/* Assets */}
      <DSection title="Brand Assets" action={<DBtn label="Upload" icon="⬆" accent={A} small ghost onClick={() => setAssets(a => [...a, `Asset_${a.length+1}.png`])} />}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:8 }}>
          {assets.map(a => (
            <DCard key={a} accent={A} style={{ padding:'12px 8px', textAlign:'center', cursor:'pointer' }}>
              <div style={{ fontSize:24, marginBottom:6 }}>🖼</div>
              <div style={{ fontSize:10, color:'rgba(160,185,255,0.7)', wordBreak:'break-all' }}>{a}</div>
            </DCard>
          ))}
        </div>
      </DSection>
    </div>
  );
}
