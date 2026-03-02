'use client';
import React, { useState } from 'react';
import { DBtn } from '../DayDreamShell';

const A = '#38bdf8';

type ConsoleLine = { type: 'log'|'warn'|'error'|'info'; msg: string; ts: string };
type NetworkReq  = { method: string; url: string; status: number; ms: number };
type Viewport = 'mobile'|'tablet'|'desktop';

const VIEWPORT_SIZES: Record<Viewport,{w:number;h:number;label:string}> = {
  mobile:  {w:390, h:844, label:'iPhone 15 Pro'},
  tablet:  {w:768, h:1024,label:'iPad'},
  desktop: {w:1280,h:800, label:'MacBook'},
};

const ENVS = ['Development','Staging','Production'];

const DEMO_CONSOLE: ConsoleLine[] = [
  {type:'info', msg:'App mounted successfully',    ts:'12:30:01'},
  {type:'log',  msg:'Fetching user data…',         ts:'12:30:01'},
  {type:'log',  msg:'User data loaded: 42 items',  ts:'12:30:02'},
  {type:'warn', msg:'Missing key prop in list',    ts:'12:30:02'},
];

const DEMO_NETWORK: NetworkReq[] = [
  {method:'GET',  url:'/api/user',     status:200, ms:42},
  {method:'GET',  url:'/api/feed',     status:200, ms:118},
  {method:'POST', url:'/api/log',      status:201, ms:23},
  {method:'GET',  url:'/api/settings', status:304, ms:8},
];

export default function PreviewFace({ previewCode }: { previewCode?: string; onBack?: () => void }) {
  // suppress unused warning
  void previewCode;

  const [viewport,   setViewport]   = useState<Viewport>('mobile');
  const [env,        setEnv]        = useState('Development');
  const [tab,        setTab]        = useState<'preview'|'console'|'network'|'metrics'>('preview');
  const [isLoading,  setIsLoading]  = useState(false);
  const [shareUrl,   setShareUrl]   = useState('');
  const [isPublic,   setIsPublic]   = useState(false);
  const [consoleLogs,setConsoleLogs]= useState<ConsoleLine[]>(DEMO_CONSOLE);
  const [network,    setNetwork]    = useState<NetworkReq[]>(DEMO_NETWORK);
  const [filter,     setFilter]     = useState<'all'|'log'|'warn'|'error'>('all');
  const [metrics,    setMetrics]    = useState({fcp:1.24,lcp:2.10,cls:0.04,fid:18,ttfb:0.32,size:'142 KB'});

  const vp = VIEWPORT_SIZES[viewport];
  const errors = consoleLogs.filter(l=>l.type==='error').length;

  const reload = () => {
    setIsLoading(true);
    setConsoleLogs([{type:'info',msg:'Page reloaded',ts:new Date().toLocaleTimeString()}]);
    setNetwork([]);
    setTimeout(()=>{
      setConsoleLogs(DEMO_CONSOLE);
      setNetwork(DEMO_NETWORK);
      setMetrics({fcp:+(0.8+Math.random()*0.8).toFixed(2),lcp:+(1.5+Math.random()*1.5).toFixed(2),
        cls:+(Math.random()*0.1).toFixed(3),fid:Math.round(10+Math.random()*30),
        ttfb:+(0.1+Math.random()*0.5).toFixed(2),size:'142 KB'});
      setIsLoading(false);
    },800);
  };

  const generateShareUrl = () => {
    const url = `https://preview.dreamengin.com/p/${Math.random().toString(36).slice(2,10)}`;
    setShareUrl(url);
    navigator.clipboard?.writeText(url).catch(()=>{});
  };

  const filteredLogs = filter==='all'?consoleLogs:consoleLogs.filter(l=>l.type===filter);

  const metricColor = (key: string, val: number) => {
    if (key==='fcp') return val<1.8?'#4ade80':val<3?'#facc15':'#f87171';
    if (key==='lcp') return val<2.5?'#4ade80':val<4?'#facc15':'#f87171';
    if (key==='cls') return val<0.1?'#4ade80':val<0.25?'#facc15':'#f87171';
    if (key==='fid') return val<100?'#4ade80':val<300?'#facc15':'#f87171';
    if (key==='ttfb')return val<0.8?'#4ade80':val<1.8?'#facc15':'#f87171';
    return A;
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100dvh - 52px)',overflow:'hidden'}}>

      {/* ── Toolbar ─────────────────────────────────── */}
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',
        background:'rgba(2,8,24,0.95)',borderBottom:'1px solid rgba(100,150,255,0.1)',
        flexShrink:0,flexWrap:'wrap'}}>
        {(['mobile','tablet','desktop'] as Viewport[]).map(v=>(
          <button key={v} type="button" onClick={()=>setViewport(v)}
            style={{padding:'4px 10px',borderRadius:14,fontSize:10,fontWeight:700,cursor:'pointer',
              background:viewport===v?`${A}22`:'rgba(100,150,255,0.06)',
              border:viewport===v?`1px solid ${A}55`:'1px solid rgba(100,150,255,0.1)',
              color:viewport===v?'rgba(200,240,255,0.9)':'rgba(160,185,255,0.4)'}}>
            {v==='mobile'?'📱':v==='tablet'?'⬜':'🖥'} {v}
          </button>
        ))}
        <select value={env} onChange={e=>setEnv(e.target.value)}
          style={{...inp,padding:'4px 8px',fontSize:10}}>
          {ENVS.map(e=><option key={e}>{e}</option>)}
        </select>
        <button type="button" onClick={reload}
          style={{width:28,height:28,borderRadius:'50%',cursor:'pointer',
            background:'rgba(100,150,255,0.08)',border:'1px solid rgba(100,150,255,0.15)',
            color:'rgba(160,185,255,0.6)',fontSize:14,animation:isLoading?'spin 1s linear infinite':'none'}}>
          ↻
        </button>
        <div style={{flex:1}}/>
        <button type="button" onClick={()=>setIsPublic(v=>!v)}
          style={{fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:14,cursor:'pointer',
            background:isPublic?'rgba(74,222,128,0.12)':'rgba(100,150,255,0.06)',
            border:isPublic?'1px solid rgba(74,222,128,0.3)':'1px solid rgba(100,150,255,0.12)',
            color:isPublic?'#4ade80':'rgba(160,185,255,0.4)'}}>
          {isPublic?'🌐 Public':'🔒 Private'}
        </button>
        <DBtn label="Share ↗" accent={A} small ghost onClick={generateShareUrl}/>
        {errors>0&&<span style={{fontSize:10,color:'#f87171',fontWeight:700}}>⚠ {errors} error{errors>1?'s':''}</span>}
      </div>

      {/* ── Shared URL ──────────────────────────────── */}
      {shareUrl&&(
        <div style={{padding:'6px 12px',background:`${A}08`,borderBottom:`1px solid ${A}22`,
          display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <span style={{flex:1,fontSize:11,fontFamily:'monospace',color:`${A}cc`,
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{shareUrl}</span>
          <span style={{fontSize:10,color:'#4ade80',fontWeight:700}}>✓ Copied</span>
          <button type="button" onClick={()=>setShareUrl('')}
            style={{background:'none',border:'none',cursor:'pointer',color:'rgba(160,185,255,0.3)',fontSize:12}}>×</button>
        </div>
      )}

      {/* ── Tab bar ─────────────────────────────────── */}
      <div style={{display:'flex',borderBottom:'1px solid rgba(100,150,255,0.08)',
        background:'rgba(2,5,18,0.5)',flexShrink:0}}>
        {(['preview','console','network','metrics'] as const).map(t=>(
          <button key={t} type="button" onClick={()=>setTab(t)}
            style={{padding:'8px 14px',fontSize:11,fontWeight:700,cursor:'pointer',
              background:'transparent',border:'none',
              borderBottom:tab===t?`2px solid ${A}`:'2px solid transparent',
              color:tab===t?'rgba(200,240,255,0.9)':'rgba(160,185,255,0.4)'}}>
            {t==='console'?`Console${errors>0?` (${errors})`:''}`
              :t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Preview ─────────────────────────────────── */}
      {tab==='preview'&&(
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
          justifyContent:'flex-start',overflow:'auto',padding:'16px',background:'rgba(2,5,18,0.3)'}}>
          <div style={{fontSize:9,color:'rgba(160,185,255,0.3)',marginBottom:8,
            textTransform:'uppercase',letterSpacing:'0.08em'}}>
            {vp.label} · {vp.w}×{vp.h} · {env}
          </div>
          <div style={{
            width:Math.min(vp.w,360),
            maxWidth:'100%',
            border:'1px solid rgba(100,150,255,0.2)',
            borderRadius:viewport==='mobile'?24:viewport==='tablet'?16:8,
            overflow:'hidden',
            background:'rgba(5,15,45,0.9)',
            boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
            position:'relative',
          }}>
            {isLoading&&(
              <div style={{position:'absolute',inset:0,background:'rgba(2,8,24,0.8)',
                display:'flex',alignItems:'center',justifyContent:'center',zIndex:10}}>
                <div style={{width:24,height:24,border:`2px solid ${A}`,borderTopColor:'transparent',
                  borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
              </div>
            )}
            <div style={{padding:20}}>
              <div style={{fontSize:18,fontWeight:800,color:'rgba(240,244,255,0.95)',marginBottom:8}}>Hello, DREAMengin</div>
              <p style={{fontSize:13,color:'rgba(160,185,255,0.6)',lineHeight:1.6,marginBottom:16}}>Start building your dream project.</p>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <div style={{padding:'8px 16px',borderRadius:10,background:`${A}22`,border:`1px solid ${A}44`,
                  fontSize:11,fontWeight:700,color:`${A}cc`}}>Primary</div>
                <div style={{padding:'8px 16px',borderRadius:10,background:'rgba(100,150,255,0.08)',border:'1px solid rgba(100,150,255,0.2)',
                  fontSize:11,color:'rgba(160,185,255,0.6)'}}>Secondary</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Console ─────────────────────────────────── */}
      {tab==='console'&&(
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{display:'flex',gap:6,padding:'6px 12px',borderBottom:'1px solid rgba(100,150,255,0.06)',flexShrink:0}}>
            {(['all','log','warn','error'] as const).map(f=>(
              <button key={f} type="button" onClick={()=>setFilter(f)}
                style={{padding:'3px 10px',borderRadius:14,fontSize:10,fontWeight:700,cursor:'pointer',
                  background:filter===f?`${A}15`:'rgba(100,150,255,0.04)',
                  border:filter===f?`1px solid ${A}33`:'1px solid rgba(100,150,255,0.08)',
                  color:filter===f?A:'rgba(160,185,255,0.4)'}}>
                {f}
                {f!=='all'&&<span style={{marginLeft:4,fontSize:9,opacity:0.7}}>
                  ({consoleLogs.filter(l=>l.type===f).length})
                </span>}
              </button>
            ))}
            <button type="button" onClick={()=>setConsoleLogs([])}
              style={{marginLeft:'auto',fontSize:10,color:'rgba(160,185,255,0.3)',background:'none',border:'none',cursor:'pointer'}}>
              Clear
            </button>
          </div>
          <div style={{flex:1,overflowY:'auto',fontFamily:'monospace',fontSize:11,padding:'8px 12px'}}>
            {filteredLogs.map((l,i)=>(
              <div key={i} style={{display:'flex',gap:8,padding:'4px 0',
                borderBottom:'1px solid rgba(100,150,255,0.04)'}}>
                <span style={{color:'rgba(160,185,255,0.25)',flexShrink:0,fontSize:9}}>{l.ts}</span>
                <span style={{fontSize:9,padding:'1px 6px',borderRadius:8,flexShrink:0,fontWeight:700,
                  background:l.type==='error'?'rgba(248,113,113,0.12)':l.type==='warn'?'rgba(251,191,36,0.1)':l.type==='info'?`${A}10`:'rgba(100,150,255,0.06)',
                  color:l.type==='error'?'#f87171':l.type==='warn'?'#facc15':l.type==='info'?A:'rgba(160,185,255,0.5)'}}>
                  {l.type}
                </span>
                <span style={{color:'rgba(200,220,255,0.7)',wordBreak:'break-word'}}>{l.msg}</span>
              </div>
            ))}
            {filteredLogs.length===0&&<div style={{color:'rgba(160,185,255,0.25)',padding:'12px 0'}}>No {filter==='all'?'':filter+' '}messages</div>}
          </div>
        </div>
      )}

      {/* ── Network ─────────────────────────────────── */}
      {tab==='network'&&(
        <div style={{flex:1,overflowY:'auto',padding:'8px 12px'}}>
          {network.map((r,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',
              borderBottom:'1px solid rgba(100,150,255,0.06)',fontFamily:'monospace',fontSize:11}}>
              <span style={{width:40,padding:'2px 6px',borderRadius:6,textAlign:'center',fontWeight:700,fontSize:9,
                background:r.method==='GET'?`${A}15`:'rgba(168,85,247,0.15)',
                color:r.method==='GET'?A:'#a855f7',border:`1px solid ${r.method==='GET'?A+'33':'rgba(168,85,247,0.3)'}`}}>
                {r.method}
              </span>
              <span style={{flex:1,color:'rgba(200,220,255,0.7)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.url}</span>
              <span style={{fontWeight:700,fontSize:10,
                color:r.status<300?'#4ade80':r.status<400?'#facc15':'#f87171'}}>{r.status}</span>
              <span style={{fontSize:10,color:'rgba(160,185,255,0.35)',minWidth:36,textAlign:'right'}}>{r.ms}ms</span>
            </div>
          ))}
          {network.length===0&&<div style={{fontSize:11,color:'rgba(160,185,255,0.25)',padding:'12px 0'}}>No requests yet — reload to capture</div>}
        </div>
      )}

      {/* ── Metrics ─────────────────────────────────── */}
      {tab==='metrics'&&(
        <div style={{flex:1,overflowY:'auto',padding:'12px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:12}}>
            {([
              ['FCP','fcp',metrics.fcp,'s','First Contentful Paint'],
              ['LCP','lcp',metrics.lcp,'s','Largest Contentful Paint'],
              ['CLS','cls',metrics.cls,'','Cumulative Layout Shift'],
              ['FID','fid',metrics.fid,'ms','First Input Delay'],
              ['TTFB','ttfb',metrics.ttfb,'s','Time to First Byte'],
              ['Bundle','size',metrics.size,'','Bundle Size'],
            ] as [string,string,number|string,string,string][]).map(([label,key,val,unit,desc])=>(
              <div key={label} style={{padding:'10px 12px',background:'rgba(100,150,255,0.04)',
                borderRadius:10,border:'1px solid rgba(100,150,255,0.08)'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                  <span style={{fontSize:10,fontWeight:700,color:'rgba(160,185,255,0.5)'}}>{label}</span>
                  <span style={{fontSize:12,fontWeight:800,color:typeof val==='number'?metricColor(key,val):A}}>
                    {typeof val==='number'?val.toFixed(key==='fid'?0:key==='cls'?3:2):val}{unit}
                  </span>
                </div>
                <div style={{fontSize:9,color:'rgba(160,185,255,0.3)'}}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{padding:'10px 12px',background:'rgba(100,150,255,0.04)',borderRadius:10,border:'1px solid rgba(100,150,255,0.08)'}}>
            <div style={{fontSize:10,fontWeight:700,color:'rgba(160,185,255,0.5)',marginBottom:8}}>Overall Score</div>
            {[
              ['Performance',Math.round(100-(metrics.lcp>4?40:metrics.lcp>2.5?20:0)-(metrics.fcp>3?20:metrics.fcp>1.8?10:0)),'#4ade80'],
              ['Accessibility',88,'#22d3ee'],
              ['SEO',92,'#a855f7'],
            ].map(([label,score,color])=>(
              <div key={label as string} style={{marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                  <span style={{fontSize:11,color:'rgba(160,185,255,0.6)'}}>{label as string}</span>
                  <span style={{fontSize:11,fontWeight:700,color:color as string}}>{score as number}</span>
                </div>
                <div style={{height:4,background:'rgba(100,150,255,0.1)',borderRadius:2}}>
                  <div style={{height:'100%',width:`${score as number}%`,background:color as string,borderRadius:2}}/>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:10,display:'flex',gap:8}}>
            <DBtn label="Run Audit" icon="⚡" accent={A} small ghost onClick={reload}/>
            <DBtn label="Export Report" icon="⬇" accent={A} small ghost/>
            <DBtn label="Deploy" icon="🚀" accent="#4ade80" small ghost/>
          </div>
        </div>
      )}
    </div>
  );
}

const inp: React.CSSProperties = {background:'rgba(100,150,255,0.08)',border:'1px solid rgba(100,150,255,0.15)',borderRadius:8,padding:'7px 10px',color:'rgba(240,244,255,0.85)',fontSize:12,outline:'none'};
