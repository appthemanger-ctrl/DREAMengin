'use client';
import React, { useState } from 'react';
import { DSection, DCard, DBtn, DEmptyState, FACE_WRAPPER } from '../DayDreamShell';

const A = '#f97316';

type Game = {
  id: string; title: string; genre: string; players: string; icon: string;
  installed: boolean; wishlisted: boolean; recentlyPlayed: boolean;
  cloudSave: boolean; hasUpdate: boolean; offlineOk: boolean;
  achievements: number; totalAchievements: number;
  rating: number; size: string; version: string;
  dlcCount: number; subscription: boolean;
  compatibility: 'excellent'|'good'|'limited';
};

type Props = { onPlay: (gameId: string) => void };

const CATALOG: Game[] = [
  {id:'word-sprint',  title:'Word Sprint',    genre:'Word',    players:'1–4', icon:'📝', installed:true,  wishlisted:false, recentlyPlayed:true,  cloudSave:true,  hasUpdate:false, offlineOk:true,  achievements:4,  totalAchievements:10, rating:4.5, size:'2.1 MB', version:'1.3.2', dlcCount:0,  subscription:false, compatibility:'excellent'},
  {id:'logic-gates',  title:'Logic Gates',    genre:'Puzzle',  players:'1',   icon:'⚡', installed:false, wishlisted:true,  recentlyPlayed:false, cloudSave:true,  hasUpdate:false, offlineOk:false, achievements:0,  totalAchievements:15, rating:4.8, size:'5.4 MB', version:'2.1.0', dlcCount:2,  subscription:false, compatibility:'excellent'},
  {id:'rhythm-clash', title:'Rhythm Clash',   genre:'Rhythm',  players:'1–2', icon:'🥁', installed:false, wishlisted:false, recentlyPlayed:false, cloudSave:false, hasUpdate:false, offlineOk:true,  achievements:0,  totalAchievements:20, rating:4.2, size:'8.7 MB', version:'1.0.4', dlcCount:0,  subscription:false, compatibility:'good'},
  {id:'tap-race',     title:'Tap Race',       genre:'Arcade',  players:'1–4', icon:'🏁', installed:true,  wishlisted:false, recentlyPlayed:true,  cloudSave:true,  hasUpdate:true,  offlineOk:true,  achievements:7,  totalAchievements:12, rating:4.0, size:'3.2 MB', version:'2.0.1', dlcCount:1,  subscription:false, compatibility:'excellent'},
  {id:'word-duel',    title:'Word Duel',      genre:'Word',    players:'2',   icon:'⚔️', installed:false, wishlisted:true,  recentlyPlayed:false, cloudSave:true,  hasUpdate:false, offlineOk:false, achievements:0,  totalAchievements:8,  rating:4.6, size:'1.9 MB', version:'1.1.0', dlcCount:0,  subscription:true,  compatibility:'excellent'},
  {id:'puzzle-rush',  title:'Puzzle Rush',    genre:'Puzzle',  players:'1',   icon:'🧩', installed:true,  wishlisted:false, recentlyPlayed:false, cloudSave:false, hasUpdate:false, offlineOk:true,  achievements:2,  totalAchievements:18, rating:4.3, size:'4.0 MB', version:'1.5.0', dlcCount:3,  subscription:false, compatibility:'good'},
  {id:'dream-racer',  title:'Dream Racer',    genre:'Racing',  players:'1–8', icon:'🏎️', installed:false, wishlisted:false, recentlyPlayed:false, cloudSave:true,  hasUpdate:false, offlineOk:false, achievements:0,  totalAchievements:25, rating:4.7, size:'22 MB',  version:'1.0.0', dlcCount:0,  subscription:false, compatibility:'limited'},
  {id:'mind-maze',    title:'Mind Maze',      genre:'Strategy',players:'1',   icon:'🌀', installed:false, wishlisted:true,  recentlyPlayed:false, cloudSave:true,  hasUpdate:false, offlineOk:true,  achievements:0,  totalAchievements:14, rating:4.9, size:'6.1 MB', version:'3.0.0', dlcCount:1,  subscription:false, compatibility:'excellent'},
];

const CATEGORIES = ['All','Installed','Wishlist','Word','Puzzle','Rhythm','Arcade','Racing','Strategy'];
const COMPAT_COLORS: Record<Game['compatibility'],string> = {excellent:'#4ade80',good:'#facc15',limited:'#f87171'};

export default function LibraryFace({ onPlay }: Props) {
  const [games, setGames] = useState<Game[]>(CATALOG);
  const [cat,   setCat]   = useState('All');
  const [q,     setQ]     = useState('');
  const [sort,  setSort]  = useState<'name'|'rating'|'recent'>('recent');
  const [detail,setDetail]= useState<Game|null>(null);
  const [installing,setInstalling] = useState<string|null>(null);
  const [installProgress,setInstProg] = useState(0);

  const toggle = (id: string, field: 'installed'|'wishlisted') =>
    setGames(gs=>gs.map(g=>g.id===id?{...g,[field]:!g[field]}:g));

  const startInstall = (id: string) => {
    setInstalling(id); setInstProg(0);
    const iv = setInterval(()=>{
      setInstProg(p=>{
        if (p>=100) { clearInterval(iv); setInstalling(null); setGames(gs=>gs.map(g=>g.id===id?{...g,installed:true}:g)); return 0; }
        return p+8;
      });
    },80);
  };

  const applyUpdate = (id: string) => setGames(gs=>gs.map(g=>g.id===id?{...g,hasUpdate:false}:g));

  const filtered = games
    .filter(g=>{
      if (q && !g.title.toLowerCase().includes(q.toLowerCase())) return false;
      if (cat==='Installed') return g.installed;
      if (cat==='Wishlist')  return g.wishlisted;
      if (cat!=='All')       return g.genre===cat;
      return true;
    })
    .sort((a,b)=>
      sort==='rating' ? b.rating-a.rating :
      sort==='name'   ? a.title.localeCompare(b.title) :
      (b.recentlyPlayed?1:0)-(a.recentlyPlayed?1:0)
    );

  const installedCount = games.filter(g=>g.installed).length;
  const achievementTotal = games.filter(g=>g.installed).reduce((s,g)=>s+g.achievements,0);

  if (detail) {
    return (
      <div style={FACE_WRAPPER}>
        <DSection title={detail.title}
          action={<DBtn label="← Back" accent={A} small ghost onClick={()=>setDetail(null)}/>}>
          <DCard accent={A}>
            <div style={{display:'flex',gap:14,marginBottom:14}}>
              <div style={{width:72,height:72,borderRadius:16,background:`${A}22`,border:`1px solid ${A}44`,
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,flexShrink:0}}>
                {detail.icon}
              </div>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:'rgba(240,244,255,0.95)',marginBottom:4}}>{detail.title}</div>
                <div style={{fontSize:11,color:'rgba(160,185,255,0.5)',marginBottom:6}}>
                  {detail.genre} · {detail.players} players · {detail.size}
                </div>
                <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                  {'★'.repeat(Math.floor(detail.rating)).split('').map((_,i)=>(
                    <span key={i} style={{color:'#facc15',fontSize:12}}>★</span>
                  ))}
                  <span style={{fontSize:11,color:'rgba(160,185,255,0.5)'}}>{detail.rating}/5</span>
                  {detail.subscription&&<span style={{fontSize:9,padding:'2px 7px',borderRadius:10,background:'rgba(212,168,67,0.15)',border:'1px solid rgba(212,168,67,0.3)',color:'#d4a843',fontWeight:700}}>PRO</span>}
                </div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
              {[
                ['Version',detail.version],
                ['Size',detail.size],
                ['Compatibility',detail.compatibility],
                ['Cloud Save',detail.cloudSave?'Yes':'No'],
                ['Offline',detail.offlineOk?'Yes':'Online only'],
                ['DLC',detail.dlcCount>0?`${detail.dlcCount} packs`:'None'],
              ].map(([k,v])=>(
                <div key={k} style={{padding:'6px 10px',background:'rgba(100,150,255,0.04)',borderRadius:8}}>
                  <div style={{fontSize:9,color:'rgba(160,185,255,0.35)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{k}</div>
                  <div style={{fontSize:11,fontWeight:700,color:k==='Compatibility'?COMPAT_COLORS[detail.compatibility as Game['compatibility']]:'rgba(240,244,255,0.8)',marginTop:2}}>{v}</div>
                </div>
              ))}
            </div>
            {detail.totalAchievements>0&&(
              <div style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:10,color:'rgba(160,185,255,0.5)'}}>Achievements: {detail.achievements}/{detail.totalAchievements}</span>
                  <span style={{fontSize:10,color:A,fontWeight:700}}>{Math.round((detail.achievements/detail.totalAchievements)*100)}%</span>
                </div>
                <div style={{height:4,background:'rgba(100,150,255,0.1)',borderRadius:2}}>
                  <div style={{height:'100%',width:`${(detail.achievements/detail.totalAchievements)*100}%`,background:`linear-gradient(90deg,${A},#fbbf24)`,borderRadius:2}}/>
                </div>
              </div>
            )}
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {detail.installed
                ?<DBtn label="▶ Play Now" accent={A} onClick={()=>onPlay(detail.id)}/>
                :(installing===detail.id
                  ?<div style={{flex:1,height:36,background:'rgba(100,150,255,0.08)',borderRadius:20,overflow:'hidden',position:'relative'}}>
                    <div style={{height:'100%',width:`${installProgress}%`,background:`linear-gradient(90deg,${A},#fbbf24)`,transition:'width 0.1s'}}/>
                    <span style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'rgba(240,244,255,0.8)',fontWeight:700}}>Installing {installProgress}%</span>
                  </div>
                  :<DBtn label="Install" icon="⬇" accent={A} onClick={()=>startInstall(detail.id)}/>
                )
              }
              <DBtn label={detail.wishlisted?'★ Wishlisted':'☆ Wishlist'} accent="#facc15" small ghost
                onClick={()=>toggle(detail.id,'wishlisted')}/>
              {detail.hasUpdate&&<DBtn label="Update" icon="↑" accent="#4ade80" small onClick={()=>applyUpdate(detail.id)}/>}
            </div>
          </DCard>
        </DSection>
      </div>
    );
  }

  return (
    <div style={FACE_WRAPPER}>
      {/* Stats bar */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
        {[
          ['Installed',installedCount,A],
          ['Achievements',achievementTotal,'#facc15'],
          ['Wishlist',games.filter(g=>g.wishlisted).length,'#a855f7'],
        ].map(([label,val,color])=>(
          <div key={label as string} style={{padding:'8px 10px',background:'rgba(100,150,255,0.06)',borderRadius:12,border:'1px solid rgba(100,150,255,0.1)',textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:800,color:color as string}}>{val as number}</div>
            <div style={{fontSize:9,color:'rgba(160,185,255,0.4)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{label as string}</div>
          </div>
        ))}
      </div>

      {/* Search + sort */}
      <div style={{display:'flex',gap:8,marginBottom:10}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍  Search games…"
          style={{flex:1,...inp}}/>
        <select value={sort} onChange={e=>setSort(e.target.value as typeof sort)}
          style={{...inp,padding:'7px 8px'}}>
          <option value="recent">Recent</option>
          <option value="rating">Top Rated</option>
          <option value="name">A–Z</option>
        </select>
      </div>

      {/* Category pills */}
      <div style={{display:'flex',gap:6,overflowX:'auto',marginBottom:14,paddingBottom:4}}>
        {CATEGORIES.map(c=>(
          <button key={c} type="button" onClick={()=>setCat(c)}
            style={{flexShrink:0,padding:'6px 14px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',
              background:cat===c?`${A}22`:'rgba(100,150,255,0.06)',
              border:cat===c?`1px solid ${A}55`:'1px solid rgba(100,150,255,0.1)',
              color:cat===c?'rgba(255,200,150,0.95)':'rgba(160,185,255,0.5)'}}>
            {c}
          </button>
        ))}
      </div>

      {/* Featured */}
      {cat==='All' && (
        <DSection title="Featured">
          <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4}}>
            {games.filter(g=>g.rating>=4.6).slice(0,3).map(g=>(
              <div key={g.id} onClick={()=>setDetail(g)}
                style={{flexShrink:0,width:140,padding:'14px 12px',borderRadius:14,cursor:'pointer',
                  background:`linear-gradient(145deg,${A}18,rgba(5,15,45,0.8))`,
                  border:`1px solid ${A}33`}}>
                <div style={{fontSize:32,marginBottom:8}}>{g.icon}</div>
                <div style={{fontSize:12,fontWeight:800,color:'rgba(240,244,255,0.9)',marginBottom:2}}>{g.title}</div>
                <div style={{fontSize:9,color:'rgba(160,185,255,0.45)'}}>{g.genre}</div>
                <div style={{display:'flex',alignItems:'center',gap:4,marginTop:6}}>
                  <span style={{fontSize:10,color:'#facc15'}}>★ {g.rating}</span>
                  {g.cloudSave&&<span style={{fontSize:9,color:'rgba(160,185,255,0.4)'}}>☁</span>}
                </div>
              </div>
            ))}
          </div>
        </DSection>
      )}

      {/* Recently played */}
      {cat==='All' && games.some(g=>g.recentlyPlayed) && (
        <DSection title="Recently Played">
          <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4}}>
            {games.filter(g=>g.recentlyPlayed).map(g=>(
              <button key={g.id} type="button" onClick={()=>onPlay(g.id)}
                style={{flexShrink:0,padding:'10px 14px',borderRadius:14,cursor:'pointer',
                  background:`${A}18`,border:`1px solid ${A}33`,
                  color:'rgba(255,220,180,0.9)',fontSize:13,display:'flex',alignItems:'center',gap:8}}>
                <span>{g.icon}</span>
                <div style={{textAlign:'left'}}>
                  <div style={{fontWeight:700,fontSize:11}}>{g.title}</div>
                  {g.hasUpdate&&<div style={{fontSize:9,color:'#4ade80'}}>Update available</div>}
                </div>
              </button>
            ))}
          </div>
        </DSection>
      )}

      {/* Game grid */}
      <DSection title={`${filtered.length} game${filtered.length!==1?'s':''}`}>
        {filtered.length===0&&<DEmptyState icon="🎮" message="No games found"/>}
        {filtered.map(g=>(
          <DCard key={g.id} accent={A} style={{marginBottom:6,cursor:'pointer'}}
            onClick={()=>setDetail(g)}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:46,height:46,borderRadius:10,background:`${A}18`,border:`1px solid ${A}33`,
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0,position:'relative'}}>
                {g.icon}
                {g.hasUpdate&&(
                  <div style={{position:'absolute',top:-4,right:-4,width:12,height:12,borderRadius:'50%',
                    background:'#4ade80',border:'2px solid rgba(2,8,24,0.9)',fontSize:7,display:'flex',alignItems:'center',justifyContent:'center',color:'#001a08',fontWeight:800}}>!</div>
                )}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                  <span style={{fontSize:12,fontWeight:700,color:'rgba(240,244,255,0.9)'}}>{g.title}</span>
                  {g.subscription&&<span style={{fontSize:8,padding:'1px 5px',borderRadius:8,background:'rgba(212,168,67,0.15)',color:'#d4a843',border:'1px solid rgba(212,168,67,0.25)'}}>PRO</span>}
                  {g.offlineOk&&<span style={{fontSize:9,color:'rgba(160,185,255,0.3)'}}>✈</span>}
                  {g.cloudSave&&<span style={{fontSize:9,color:'rgba(160,185,255,0.3)'}}>☁</span>}
                </div>
                <div style={{fontSize:9,color:'rgba(160,185,255,0.4)'}}>{g.genre} · {g.players} players</div>
                {g.installed&&g.totalAchievements>0&&(
                  <div style={{marginTop:4,display:'flex',gap:4,alignItems:'center'}}>
                    <div style={{flex:1,height:2,background:'rgba(100,150,255,0.1)',borderRadius:1}}>
                      <div style={{height:'100%',width:`${(g.achievements/g.totalAchievements)*100}%`,background:A,borderRadius:1}}/>
                    </div>
                    <span style={{fontSize:8,color:A,fontWeight:700}}>{g.achievements}/{g.totalAchievements}</span>
                  </div>
                )}
              </div>
              <div style={{display:'flex',gap:4,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                <button type="button" onClick={()=>toggle(g.id,'wishlisted')}
                  style={{background:'none',border:'none',cursor:'pointer',fontSize:16,
                    color:g.wishlisted?'#facc15':'rgba(160,185,255,0.2)',lineHeight:1}}>★</button>
                {g.installed
                  ?<DBtn label="▶" accent={A} small onClick={()=>onPlay(g.id)}/>
                  :installing===g.id
                    ?<div style={{width:44,height:28,borderRadius:14,overflow:'hidden',background:'rgba(100,150,255,0.08)',position:'relative'}}>
                      <div style={{height:'100%',width:`${installProgress}%`,background:A,transition:'width 0.1s'}}/>
                      <span style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'rgba(240,244,255,0.8)'}}>…</span>
                    </div>
                    :<DBtn label="Get" accent="#64748b" small ghost onClick={()=>startInstall(g.id)}/>
                }
              </div>
            </div>
          </DCard>
        ))}
      </DSection>
    </div>
  );
}

const inp: React.CSSProperties = {background:'rgba(100,150,255,0.08)',border:'1px solid rgba(100,150,255,0.15)',borderRadius:8,padding:'7px 10px',color:'rgba(240,244,255,0.85)',fontSize:12,outline:'none'};
