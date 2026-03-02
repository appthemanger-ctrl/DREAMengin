'use client';
import React, { useState } from 'react';
import { DSection, DCard, DBtn, DEmptyState, DMetricCard, FACE_WRAPPER } from '../DayDreamShell';

const A = '#a855f7';

type Release = {
  id: string; title: string; type: 'single'|'EP'|'album';
  status: 'draft'|'scheduled'|'live'|'archived';
  price: number; plays: number; downloads: number; revenue: number;
  schedDate: string; cover: string; promoUrl: string;
};

const DEMO: Release[] = [
  {id:'1',title:'Neon Dreams',    type:'single',status:'live',     price:1.99,plays:247, downloads:34,revenue:67.66, schedDate:'',promoUrl:'dreamengin.com/r/neon-dreams'},
  {id:'2',title:'Midnight EP',    type:'EP',    status:'scheduled',price:4.99,plays:0,   downloads:0, revenue:0,     schedDate:'2026-04-01',promoUrl:'dreamengin.com/r/midnight-ep'},
  {id:'3',title:'Untitled Single',type:'single',status:'draft',    price:0,   plays:0,   downloads:0, revenue:0,     schedDate:'',promoUrl:''},
];

const TYPE_OPTS: Release['type'][] = ['single','EP','album'];
const PRICE_PRESETS = [0,0.99,1.99,2.99,4.99,9.99];

export default function ReleasesFace() {
  const [releases,  setReleases]  = useState<Release[]>(DEMO);
  const [tab,       setTab]       = useState<'releases'|'revenue'|'promo'>('releases');
  const [newTitle,  setNewTitle]  = useState('');
  const [newType,   setNewType]   = useState<Release['type']>('single');
  const [newPrice,  setNewPrice]  = useState(0);
  const [newDate,   setNewDate]   = useState('');
  const [editing,   setEditing]   = useState<string|null>(null);
  const [copied,    setCopied]    = useState<string|null>(null);
  const [range,     setRange]     = useState<'7d'|'30d'|'All'>('30d');

  const totalPlays  = releases.reduce((a,r)=>a+r.plays,0);
  const totalRev    = releases.reduce((a,r)=>a+r.revenue,0);
  const liveCount   = releases.filter(r=>r.status==='live').length;

  const addRelease = () => {
    if (!newTitle.trim()) return;
    const slug = newTitle.toLowerCase().replace(/\s+/g,'-');
    setReleases(rs=>[...rs,{
      id:Date.now().toString(),title:newTitle,type:newType,status:newDate?'scheduled':'draft',
      price:newPrice,plays:0,downloads:0,revenue:0,schedDate:newDate,
      promoUrl:`dreamengin.com/r/${slug}`,cover:'',
    }]);
    setNewTitle(''); setNewDate('');
  };

  const publish  = (id: string) => setReleases(rs=>rs.map(r=>r.id===id?{...r,status:'live'}:r));
  const archive  = (id: string) => setReleases(rs=>rs.map(r=>r.id===id?{...r,status:'archived'}:r));
  const unarchive= (id: string) => setReleases(rs=>rs.map(r=>r.id===id?{...r,status:'draft'}:r));

  const copyPromo = (url: string) => {
    navigator.clipboard?.writeText(`https://${url}`).catch(()=>{});
    setCopied(url);
    setTimeout(()=>setCopied(null),1500);
  };

  const visible = releases.filter(r=>tab==='releases'?r.status!=='archived':true);

  return (
    <div style={FACE_WRAPPER}>

      <div style={{display:'flex',gap:4,marginBottom:16,background:'rgba(100,150,255,0.06)',
        border:'1px solid rgba(100,150,255,0.12)',borderRadius:20,padding:3}}>
        {([['releases','📀 Releases'],['revenue','💰 Revenue'],['promo','📡 Promo']] as const).map(([t,label])=>(
          <button key={t} type="button" onClick={()=>setTab(t)}
            style={{flex:1,padding:'7px 0',borderRadius:16,fontSize:11,fontWeight:700,cursor:'pointer',
              background:tab===t?`${A}22`:'transparent',border:tab===t?`1px solid ${A}55`:'1px solid transparent',
              color:tab===t?'rgba(220,210,255,0.95)':'rgba(160,185,255,0.4)'}}>
            {label}
          </button>
        ))}
      </div>

      <DSection title="Overview">
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          <DMetricCard label="Total Plays"  value={totalPlays>0?totalPlays.toLocaleString():'—'} accent={A} icon="▶️"/>
          <DMetricCard label="Revenue"      value={totalRev>0?`$${totalRev.toFixed(2)}`:'$0'} delta={totalRev>0?'+12%':undefined} accent={A} icon="💰"/>
          <DMetricCard label="Live"         value={String(liveCount)} accent={A} icon="📡"/>
        </div>
      </DSection>

      {tab==='releases' && (
        <>
          <DSection title="New Release">
            <DCard accent={A}>
              <input placeholder="Release title…" value={newTitle}
                onChange={e=>setNewTitle(e.target.value)}
                style={{...inp,width:'100%',marginBottom:8}}/>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                {TYPE_OPTS.map(t=>(
                  <button key={t} type="button" onClick={()=>setNewType(t)}
                    style={{...sBtn(A),background:newType===t?`${A}22`:'rgba(100,150,255,0.06)',
                      border:newType===t?`1px solid ${A}55`:'1px solid rgba(100,150,255,0.1)',
                      color:newType===t?'rgba(220,210,255,0.9)':'rgba(160,185,255,0.4)'}}>
                    {t.toUpperCase()}
                  </button>
                ))}
                <select value={newPrice} onChange={e=>setNewPrice(+e.target.value)}
                  style={{...inp,flex:1}}>
                  {PRICE_PRESETS.map(p=>(
                    <option key={p} value={p}>{p===0?'Free':`$${p.toFixed(2)}`}</option>
                  ))}
                </select>
                <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)}
                  style={{...inp,flex:1}}/>
                <DBtn label="Create" icon="+" accent={A} small onClick={addRelease}/>
              </div>
            </DCard>
          </DSection>

          <DSection title={`Releases (${visible.length})`}>
            {visible.length===0 && <DEmptyState icon="📀" message="No releases yet"/>}
            {visible.map(r=>(
              <DCard key={r.id} accent={A} style={{marginBottom:8}}>
                <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                  <div style={{width:48,height:48,borderRadius:10,background:`linear-gradient(135deg,${A}44,rgba(5,15,45,0.9))`,
                    border:`1px solid ${A}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                    📀
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                      <span style={{fontSize:13,fontWeight:700,color:'rgba(240,244,255,0.92)'}}>{r.title}</span>
                      <StatusBadge status={r.status} accent={A}/>
                      <span style={{fontSize:9,color:'rgba(160,185,255,0.35)',marginLeft:'auto'}}>
                        {r.type.toUpperCase()} · {r.price===0?'Free':`$${r.price}`}
                      </span>
                    </div>
                    {r.status==='live' && (
                      <div style={{display:'flex',gap:12,marginBottom:6}}>
                        <span style={{fontSize:10,color:'rgba(160,185,255,0.5)'}}>▶ {r.plays.toLocaleString()} plays</span>
                        <span style={{fontSize:10,color:'rgba(160,185,255,0.5)'}}>⬇ {r.downloads} downloads</span>
                        {r.revenue>0 && <span style={{fontSize:10,color:'#4ade80'}}>${r.revenue.toFixed(2)} earned</span>}
                      </div>
                    )}
                    {r.status==='scheduled' && r.schedDate && (
                      <div style={{fontSize:10,color:'#facc15',marginBottom:6}}>📅 Scheduled: {new Date(r.schedDate).toLocaleDateString()}</div>
                    )}
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      {r.status==='draft'     && <DBtn label="Publish Now"  accent={A}       small onClick={()=>publish(r.id)}/>}
                      {r.status==='live'      && <DBtn label="Share ↗"     accent={A}       small ghost/>}
                      {r.status==='live'      && <DBtn label="Edit"         accent="#64748b" small ghost onClick={()=>setEditing(editing===r.id?null:r.id)}/>}
                      {r.status!=='archived'  && <DBtn label="Archive"      accent="#ef4444" small ghost onClick={()=>archive(r.id)}/>}
                      {r.status==='archived'  && <DBtn label="Restore"      accent="#4ade80" small ghost onClick={()=>unarchive(r.id)}/>}
                    </div>
                  </div>
                </div>
              </DCard>
            ))}
          </DSection>
        </>
      )}

      {tab==='revenue' && (
        <>
          <DSection title="Revenue Breakdown"
            action={
              <div style={{display:'flex',gap:4}}>
                {(['7d','30d','All'] as const).map(r=>(
                  <button key={r} type="button" onClick={()=>setRange(r)}
                    style={{...sBtn(A),background:range===r?`${A}22`:'rgba(100,150,255,0.06)',
                      border:range===r?`1px solid ${A}55`:'1px solid rgba(100,150,255,0.1)',
                      color:range===r?'rgba(220,210,255,0.9)':'rgba(160,185,255,0.4)'}}>
                    {r}
                  </button>
                ))}
              </div>
            }>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
              <DMetricCard label="Gross Revenue" value={`$${totalRev.toFixed(2)}`} delta="+12%" accent={A} icon="💰"/>
              <DMetricCard label="Net (after fees)" value={`$${(totalRev*0.85).toFixed(2)}`} accent={A} icon="✦"/>
              <DMetricCard label="Avg per release" value={liveCount?`$${(totalRev/liveCount).toFixed(2)}`:'$0'} accent={A} icon="📊"/>
              <DMetricCard label="Fan purchases" value={String(releases.reduce((a,r)=>a+r.downloads,0))} accent={A} icon="👥"/>
            </div>
            {releases.filter(r=>r.revenue>0).map(r=>(
              <DCard key={r.id} accent={A} style={{marginBottom:6,padding:'10px 12px'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:11,fontWeight:700,color:'rgba(240,244,255,0.8)',flex:1}}>{r.title}</span>
                  <span style={{fontSize:11,color:'#4ade80',fontWeight:700}}>${r.revenue.toFixed(2)}</span>
                </div>
                <div style={{marginTop:6,height:4,background:'rgba(100,150,255,0.1)',borderRadius:2}}>
                  <div style={{height:'100%',width:`${(r.revenue/totalRev)*100}%`,background:`linear-gradient(90deg,${A},#e879f9)`,borderRadius:2}}/>
                </div>
              </DCard>
            ))}
            {totalRev===0 && <DEmptyState icon="💰" message="No revenue yet — publish a release to start earning"/>}
          </DSection>
        </>
      )}

      {tab==='promo' && (
        <DSection title="Promo Links">
          {releases.filter(r=>r.promoUrl).map(r=>(
            <DCard key={r.id} accent={A} style={{marginBottom:8}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:'rgba(240,244,255,0.85)',marginBottom:4}}>{r.title}</div>
                  <div style={{fontSize:11,fontFamily:'monospace',color:`${A}bb`,
                    background:'rgba(100,150,255,0.06)',padding:'5px 8px',borderRadius:6,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    https://{r.promoUrl}
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  <DBtn label={copied===r.promoUrl?'✓ Copied':'Copy'} accent={A} small ghost
                    onClick={()=>copyPromo(r.promoUrl)}/>
                  <DBtn label="Share ↗" accent="#22d3ee" small ghost/>
                </div>
              </div>
              <div style={{display:'flex',gap:8,marginTop:8}}>
                <div style={{fontSize:10,color:'rgba(160,185,255,0.4)'}}>
                  {r.plays} clicks · {r.downloads} conversions
                  {r.plays>0&&` · ${((r.downloads/r.plays)*100).toFixed(1)}% CVR`}
                </div>
              </div>
            </DCard>
          ))}
          <DCard accent={A}>
            <div style={{fontSize:11,fontWeight:700,color:'rgba(240,244,255,0.8)',marginBottom:8}}>✦ Pre-Save Campaign</div>
            <div style={{fontSize:12,color:'rgba(160,185,255,0.5)',marginBottom:10}}>Generate a pre-save page for an upcoming release before it goes live.</div>
            <DBtn label="Create Pre-Save Link" icon="📡" accent={A} small/>
          </DCard>
        </DSection>
      )}
    </div>
  );
}

const inp: React.CSSProperties = {background:'rgba(100,150,255,0.08)',border:'1px solid rgba(100,150,255,0.15)',borderRadius:8,padding:'7px 10px',color:'rgba(240,244,255,0.85)',fontSize:12,outline:'none'};
const sBtn = (a: string): React.CSSProperties => ({padding:'4px 10px',borderRadius:14,fontSize:10,fontWeight:700,cursor:'pointer'});

function StatusBadge({status,accent}:{status:string;accent:string}) {
  const c={draft:'#94a3b8',scheduled:'#facc15',live:'#4ade80',archived:'#64748b'}[status]??'#94a3b8';
  return <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:c,background:`${c}22`,padding:'2px 7px',borderRadius:10,border:`1px solid ${c}44`}}>{status}</span>;
}
