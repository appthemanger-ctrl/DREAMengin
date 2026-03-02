'use client';
import React, { useState, useCallback, useRef } from 'react';
import { DSection, DCard, DBtn, DEmptyState, FACE_WRAPPER } from '../DayDreamShell';

const A = '#a855f7';

type Track = {
  id: string; name: string; armed: boolean; muted: boolean; solo: boolean;
  volume: number; pan: number; type: 'audio'|'midi'|'stem'; color: string;
  waveform: number[]; hasContent: boolean; clips: number;
};
type Snap = { id: string; label: string; ts: string };
const TRACK_COLORS = ['#a855f7','#22d3ee','#f97316','#f472b6','#4ade80','#facc15','#ef4444','#38bdf8'];
const GENRES = ['Hip-Hop','R&B','Pop','Electronic','Jazz','Rock','Classical','Ambient','Lo-Fi','Afrobeats'];
const MOODS  = ['Dark','Energetic','Chill','Melancholic','Euphoric','Tense','Dreamy','Soulful'];
const KEYS   = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const SAMPLES = {
  Drums:  ['Kick 808','Hi-Hat Open','Snare Crack','Clap Layer','Ride Bell','Perc Roll'],
  Bass:   ['Sub 808','Pluck Bass','Slap Bass','Synth Bass','Acid Line'],
  Keys:   ['Rhodes Pad','Synth Lead','Warm Organ','Bell Arp','Cinematic Pad'],
  Vocals: ['Vocal Chop','Falsetto Riff','Harmony Stack','Ad Lib','Breath'],
  FX:     ['Riser 4-bar','Downlifter','Vinyl Crackle','White Noise Sweep','Gate Slam'],
};

const mkWave = () => Array.from({length:16},()=>0.2+Math.random()*0.8);

const DEMO_TRACKS: Track[] = [
  {id:'1',name:'Drums',   armed:false,muted:false,solo:false,volume:82,pan:0,  type:'audio',color:'#a855f7',waveform:mkWave(),hasContent:true, clips:4},
  {id:'2',name:'Bass',    armed:false,muted:false,solo:false,volume:74,pan:-15,type:'audio',color:'#22d3ee',waveform:mkWave(),hasContent:true, clips:2},
  {id:'3',name:'Keys',    armed:false,muted:false,solo:false,volume:66,pan:20, type:'midi', color:'#f97316',waveform:mkWave(),hasContent:true, clips:3},
  {id:'4',name:'Vocals',  armed:true, muted:false,solo:false,volume:90,pan:0,  type:'audio',color:'#f472b6',waveform:mkWave(),hasContent:false,clips:0},
];

export default function StudioFace() {
  const [tracks, setTracks]     = useState<Track[]>(DEMO_TRACKS);
  const [title,  setTitle]      = useState('Untitled Project');
  const [bpm,    setBpm]        = useState(128);
  const [key,    setKey]        = useState('A');
  const [genre,  setGenre]      = useState('');
  const [mood,   setMood]       = useState('');
  const [playing,setPlaying]    = useState(false);
  const [transport, setTransport] = useState(0);
  const [sampleCat, setSampleCat] = useState<keyof typeof SAMPLES>('Drums');
  const [snaps,  setSnaps]      = useState<Snap[]>([{id:'1',label:'v1 \u2014 Initial',ts:'Just now'}]);
  const [aiLoading,setAiLoading]= useState<string|null>(null);
  const [saveStatus,setSave]    = useState<'saved'|'saving'|'unsaved'>('saved');
  const [showVersions,setShowVersions] = useState(false);
  const [exportFormat,setExportFmt] = useState<'WAV'|'MP3'>('MP3');
  const [showExport,setShowExport] = useState(false);
  const playRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const toggle = (id: string, f: 'muted'|'solo'|'armed') =>
    setTracks(ts => ts.map(t => t.id===id ? {...t,[f]:!t[f]} : t));
  const setVol = (id: string, v: number) => {
    setSave('unsaved');
    setTracks(ts => ts.map(t => t.id===id ? {...t,volume:v} : t));
  };
  const setPan = (id: string, v: number) => setTracks(ts => ts.map(t => t.id===id ? {...t,pan:v} : t));

  const addTrack = (type: Track['type']) => {
    const idx = tracks.length;
    setTracks(ts => [...ts,{id:Date.now().toString(),name:`${type==='midi'?'MIDI':'Track'} ${idx+1}`,
      armed:false,muted:false,solo:false,volume:75,pan:0,type,
      color:TRACK_COLORS[idx%TRACK_COLORS.length],waveform:mkWave(),hasContent:false,clips:0}]);
    setSave('unsaved');
  };

  const togglePlay = () => {
    if (playing) {
      if (playRef.current) clearInterval(playRef.current);
      setPlaying(false);
    } else {
      setPlaying(true);
      playRef.current = setInterval(() => {
        setTransport(v => { if (v>=100) { clearInterval(playRef.current!); setPlaying(false); return 0; } return v+0.5; });
      }, 50);
    }
  };

  const aiAction = async (action: string) => {
    setAiLoading(action);
    await new Promise(r => setTimeout(r, 1800));
    if (action==='bpm') setBpm(prev => prev===128 ? 120 : 128);
    if (action==='key') setKey(KEYS[Math.floor(Math.random()*KEYS.length)]);
    if (action==='mix') setTracks(ts => ts.map(t=>({...t,volume:Math.round(60+Math.random()*30)})));
    setAiLoading(null);
    setSave('unsaved');
  };

  const saveSnap = () => {
    const label = `v${snaps.length+1} \u2014 ${new Date().toLocaleTimeString()}`;
    setSnaps(s=>[{id:Date.now().toString(),label,ts:'Just now'},...s]);
    setSave('saving');
    setTimeout(()=>setSave('saved'),800);
  };

  const masterVol = tracks.filter(t=>!t.muted).reduce((a,t)=>a+t.volume,0)/(tracks.filter(t=>!t.muted).length||1);

  return (
    <div style={FACE_WRAPPER}>

      <DSection title="Project"
        action={
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <span style={{fontSize:9,color:saveStatus==='saved'?'#4ade80':saveStatus==='saving'?'#facc15':'rgba(160,185,255,0.4)',fontWeight:700}}>
              {saveStatus==='saved'?'\u2713 Saved':saveStatus==='saving'?'\u21bb Saving\u2026':'\u25cf Unsaved'}
            </span>
            <DBtn label="Snapshot" icon="\ud83d\udcf8" accent={A} small ghost onClick={saveSnap}/>
          </div>
        }>
        <DCard accent={A}>
          <input
            value={title} onChange={e=>{setTitle(e.target.value);setSave('unsaved');}}
            style={{...inp,width:'100%',fontSize:15,fontWeight:700,marginBottom:10}}
            placeholder="Project title\u2026"
          />
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:6,flex:'0 0 auto'}}>
              <span style={lbl}>BPM</span>
              <input type="number" value={bpm} min={40} max={300}
                onChange={e=>{setBpm(+e.target.value);setSave('unsaved');}}
                style={{...inp,width:62,textAlign:'center'}}/>
              <button type="button" onClick={()=>aiAction('bpm')} disabled={!!aiLoading}
                style={{...pill(A),padding:'4px 8px',opacity:aiLoading==='bpm'?0.5:1}}>
                {aiLoading==='bpm'?'\u2026':'\u26a1 Detect'}
              </button>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={lbl}>Key</span>
              <select value={key} onChange={e=>setKey(e.target.value)} style={{...inp,padding:'6px 8px'}}>
                {KEYS.map(k=><option key={k}>{k}</option>)}
              </select>
              <button type="button" onClick={()=>aiAction('key')} disabled={!!aiLoading}
                style={{...pill(A),padding:'4px 8px'}}>
                {aiLoading==='key'?'\u2026':'\u26a1'}
              </button>
            </div>
            <select value={genre} onChange={e=>setGenre(e.target.value)} style={{...inp,flex:1,minWidth:100}}>
              <option value="">Genre\u2026</option>
              {GENRES.map(g=><option key={g}>{g}</option>)}
            </select>
            <select value={mood} onChange={e=>setMood(e.target.value)} style={{...inp,flex:1,minWidth:80}}>
              <option value="">Mood\u2026</option>
              {MOODS.map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
        </DCard>
      </DSection>

      <DSection title="Transport">
        <DCard accent={A} style={{padding:'12px 14px'}}>
          <div style={{marginBottom:10,cursor:'pointer'}}
            onClick={e=>{const r=e.currentTarget.getBoundingClientRect();setTransport(Math.round(((e.clientX-r.left)/r.width)*100));}}>
            <div style={{height:4,background:'rgba(100,150,255,0.12)',borderRadius:2,position:'relative'}}>
              <div style={{position:'absolute',left:0,top:0,height:'100%',width:`${transport}%`,background:`linear-gradient(90deg,${A},#e879f9)`,borderRadius:2,transition:playing?'none':'width 0.1s'}}/>
              <div style={{position:'absolute',top:-4,left:`${transport}%`,width:12,height:12,borderRadius:'50%',background:A,boxShadow:`0 0 8px ${A}`,transform:'translateX(-50%)',transition:playing?'none':'left 0.1s'}}/>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12}}>
            <TBtn icon="\u23ee" onClick={()=>{setTransport(0);setPlaying(false);if(playRef.current)clearInterval(playRef.current);}}/>
            <button type="button" onClick={togglePlay}
              style={{width:44,height:44,borderRadius:'50%',cursor:'pointer',
                background:`linear-gradient(135deg,${A},#e879f9)`,border:'none',
                color:'#fff',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',
                boxShadow:`0 4px 16px ${A}55`}}>
              {playing?'\u23f8':'\u25b6'}
            </button>
            <TBtn icon="\u23f9" onClick={()=>{setTransport(0);setPlaying(false);if(playRef.current)clearInterval(playRef.current);}}/>
            <TBtn icon="\u23fa" onClick={()=>{}}/>
            <div style={{marginLeft:8,textAlign:'center'}}>
              <div style={{fontSize:12,fontWeight:800,fontFamily:'monospace',color:'rgba(240,244,255,0.8)'}}>
                {Math.floor(transport/100*240).toString().padStart(3,'0')}:{((transport/100*240%1)*60).toFixed(0).padStart(2,'0')}
              </div>
              <div style={{fontSize:9,color:'rgba(160,185,255,0.35)'}}>/ 4:00</div>
            </div>
            <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6}}>
              <span style={lbl}>Master</span>
              <div style={{width:80,height:8,background:'rgba(100,150,255,0.12)',borderRadius:4,position:'relative'}}>
                <div style={{height:'100%',width:`${masterVol}%`,background:`linear-gradient(90deg,#4ade80,#facc15,#ef4444)`,borderRadius:4}}/>
              </div>
            </div>
          </div>
        </DCard>
      </DSection>

      <DSection title={`Tracks (${tracks.length})`}
        action={
          <div style={{display:'flex',gap:4}}>
            <DBtn label="+ Audio" accent={A} small onClick={()=>addTrack('audio')}/>
            <DBtn label="+ MIDI" accent="#22d3ee" small ghost onClick={()=>addTrack('midi')}/>
            <DBtn label="+ Stem" accent="#f97316" small ghost onClick={()=>addTrack('stem')}/>
          </div>
        }>
        {tracks.map(t => (
          <DCard key={t.id} accent={t.color} style={{marginBottom:6,padding:'10px 12px'}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <button type="button" onClick={()=>toggle(t.id,'armed')}
                style={{width:20,height:20,borderRadius:'50%',cursor:'pointer',flexShrink:0,
                  background:t.armed?'#ef4444':'rgba(100,150,255,0.08)',
                  border:t.armed?'1px solid #ef4444':'1px solid rgba(100,150,255,0.2)',
                  boxShadow:t.armed?'0 0 6px #ef4444':'none',
                  transition:'all 0.2s'}}/>
              <div style={{display:'flex',gap:1,alignItems:'flex-end',height:24,width:56,flexShrink:0}}>
                {t.waveform.map((h,i)=>(
                  <div key={i} style={{flex:1,background:t.muted?'rgba(100,150,255,0.1)':t.color,
                    opacity:t.hasContent?0.7:0.2,height:`${h*100}%`,borderRadius:1}}/>
                ))}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:'rgba(240,244,255,0.9)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.name}</div>
                <div style={{fontSize:9,color:'rgba(160,185,255,0.35)',textTransform:'uppercase',letterSpacing:'0.08em'}}>
                  {t.type}{t.clips>0?` \u00b7 ${t.clips} clips`:''}
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,flexShrink:0}}>
                <span style={{...lbl,fontSize:8}}>Vol {t.volume}</span>
                <input type="range" min={0} max={100} value={t.volume}
                  onChange={e=>setVol(t.id,+e.target.value)} style={{width:56,cursor:'pointer',accentColor:t.color}}/>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,flexShrink:0}}>
                <span style={{...lbl,fontSize:8}}>Pan {t.pan>0?'+':''}{t.pan}</span>
                <input type="range" min={-100} max={100} value={t.pan}
                  onChange={e=>setPan(t.id,+e.target.value)} style={{width:44,cursor:'pointer',accentColor:t.color}}/>
              </div>
              <Pill label="M" active={t.muted}  color="#f87171" onClick={()=>toggle(t.id,'muted')}/>
              <Pill label="S" active={t.solo}   color="#facc15" onClick={()=>toggle(t.id,'solo')}/>
            </div>
          </DCard>
        ))}
        {tracks.length===0 && <DEmptyState icon="\ud83c\udf99" message="No tracks \u2014 add Audio, MIDI, or Stem above"/>}
      </DSection>

      <DSection title="AI Tools">
        <DCard accent={A}>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {[
              {label:'AI Mix',    icon:'\ud83c\udfdb',action:'mix',   desc:'Auto-balance all tracks'},
              {label:'Harmony',   icon:'\ud83c\udfb5',action:'harm',  desc:'Suggest chord progressions'},
              {label:'Mastering', icon:'\u2726',      action:'master',desc:'Adaptive loudness preview'},
              {label:'Stem Split',icon:'\u26a1',      action:'stem',  desc:'Separate vocals/instruments'},
            ].map(({label,icon,action,desc})=>(
              <button key={action} type="button" onClick={()=>aiAction(action)} disabled={!!aiLoading}
                style={{flex:'1 0 40%',padding:'10px 12px',borderRadius:12,cursor:'pointer',textAlign:'left',
                  background:`${A}11`,border:`1px solid ${A}28`,
                  opacity:aiLoading===action?0.6:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:16}}>{aiLoading===action?'\u23f3':icon}</span>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:'rgba(240,244,255,0.85)'}}>{label}</div>
                    <div style={{fontSize:9,color:'rgba(160,185,255,0.4)'}}>{desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DCard>
      </DSection>

      <DSection title="Sample Library"
        action={<DBtn label="Upload" icon="\u2b06" accent={A} small ghost/>}>
        <DCard accent={A}>
          <div style={{display:'flex',gap:6,marginBottom:10,overflowX:'auto',paddingBottom:2}}>
            {(Object.keys(SAMPLES) as (keyof typeof SAMPLES)[]).map(cat=>(
              <button key={cat} type="button" onClick={()=>setSampleCat(cat)}
                style={{...pill(A),flexShrink:0,background:sampleCat===cat?`${A}22`:'rgba(100,150,255,0.06)',
                  border:sampleCat===cat?`1px solid ${A}55`:'1px solid rgba(100,150,255,0.1)',
                  color:sampleCat===cat?'rgba(220,210,255,0.95)':'rgba(160,185,255,0.45)'}}>
                {cat}
              </button>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {SAMPLES[sampleCat].map(s=>(
              <div key={s} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:8,
                background:'rgba(100,150,255,0.04)',border:'1px solid rgba(100,150,255,0.08)'}}>
                <button type="button" style={{width:26,height:26,borderRadius:'50%',cursor:'pointer',
                  background:`${A}22`,border:`1px solid ${A}44`,color:A,fontSize:10,flexShrink:0}}>\u25b6</button>
                <div style={{flex:1}}>
                  <span style={{fontSize:12,color:'rgba(240,244,255,0.8)'}}>{s}</span>
                </div>
                <div style={{display:'flex',gap:2,alignItems:'flex-end',height:16,width:32}}>
                  {[0.3,0.7,0.5,0.9,0.4,0.8].map((h,i)=>(
                    <div key={i} style={{flex:1,background:A,opacity:0.4,height:`${h*100}%`,borderRadius:1}}/>
                  ))}
                </div>
                <button type="button" style={{fontSize:12,color:`${A}aa`,background:'none',border:'none',cursor:'pointer'}}>+</button>
              </div>
            ))}
          </div>
        </DCard>
      </DSection>

      <DSection title="Finalise">
        <DCard accent={A}>
          <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
            <div style={{width:60,height:60,borderRadius:12,background:`linear-gradient(135deg,${A}44,rgba(5,15,45,0.9))`,
              border:`1px solid ${A}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0,cursor:'pointer'}}>
              \ud83c\udfa8
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:'rgba(240,244,255,0.8)',marginBottom:4}}>Cover Art</div>
              <DBtn label="Upload Image" icon="\u2b06" accent={A} small ghost/>
            </div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <span style={lbl}>Export as</span>
            {(['WAV','MP3'] as const).map(f=>(
              <button key={f} type="button" onClick={()=>setExportFmt(f)}
                style={{...pill(A),background:exportFormat===f?`${A}22`:'rgba(100,150,255,0.06)',
                  border:exportFormat===f?`1px solid ${A}55`:'1px solid rgba(100,150,255,0.12)',
                  color:exportFormat===f?'rgba(220,210,255,0.95)':'rgba(160,185,255,0.45)'}}>
                {f}
              </button>
            ))}
            <DBtn label="Export Draft" icon="\u2b07" accent={A} small onClick={()=>setShowExport(true)}/>
            <DBtn label="\u2192 Releases" icon="\ud83d\udcc0" accent="#4ade80" small ghost/>
          </div>
          {showExport && (
            <div style={{marginTop:10,padding:'8px 12px',borderRadius:8,background:'rgba(74,222,128,0.08)',
              border:'1px solid rgba(74,222,128,0.2)',fontSize:11,color:'#4ade80'}}>
              \u2713 Draft exported as {title}.{exportFormat.toLowerCase()}
            </div>
          )}
        </DCard>
      </DSection>

      <DSection title={`Versions (${snaps.length})`}
        action={<button type="button" onClick={()=>setShowVersions(v=>!v)} style={{background:'none',border:'none',cursor:'pointer',fontSize:11,color:`${A}aa`}}>{showVersions?'Hide':'Show'}</button>}>
        {showVersions && (
          <DCard accent={A}>
            {snaps.map((s,i)=>(
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',
                borderBottom:i<snaps.length-1?'1px solid rgba(100,150,255,0.07)':'none'}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:i===0?A:'rgba(100,150,255,0.2)',flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:700,color:'rgba(240,244,255,0.8)'}}>{s.label}</div>
                  <div style={{fontSize:9,color:'rgba(160,185,255,0.35)'}}>{s.ts}</div>
                </div>
                <DBtn label="Restore" accent={A} small ghost onClick={()=>{}}/>
              </div>
            ))}
          </DCard>
        )}
      </DSection>
    </div>
  );
}

const inp: React.CSSProperties = {background:'rgba(100,150,255,0.08)',border:'1px solid rgba(100,150,255,0.15)',borderRadius:8,padding:'7px 10px',color:'rgba(240,244,255,0.85)',fontSize:12,outline:'none'};
const lbl: React.CSSProperties = {fontSize:9,color:'rgba(160,185,255,0.4)',textTransform:'uppercase',letterSpacing:'0.1em',whiteSpace:'nowrap'};
const pill = (a: string): React.CSSProperties => ({padding:'5px 12px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',background:`${a}22`,border:`1px solid ${a}55`,color:'rgba(220,210,255,0.8)'});

function Pill({label,active,color,onClick}:{label:string;active:boolean;color:string;onClick:()=>void}) {
  return <button type="button" onClick={onClick} style={{width:24,height:24,borderRadius:5,fontSize:10,fontWeight:800,cursor:'pointer',flexShrink:0,background:active?`${color}33`:'rgba(100,150,255,0.06)',border:active?`1px solid ${color}`:'1px solid rgba(100,150,255,0.15)',color:active?color:'rgba(160,185,255,0.4)'}}>{label}</button>;
}
function TBtn({icon,onClick}:{icon:string;onClick:()=>void}) {
  return <button type="button" onClick={onClick} style={{width:32,height:32,borderRadius:'50%',cursor:'pointer',background:'rgba(100,150,255,0.08)',border:'1px solid rgba(100,150,255,0.15)',color:'rgba(160,185,255,0.6)',fontSize:14}}>{icon}</button>;
}
