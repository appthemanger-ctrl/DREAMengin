'use client';
import React, { useState, useRef } from 'react';
import { DSection, DCard, DBtn, DEmptyState, FACE_WRAPPER } from '../DayDreamShell';

const A = '#22d3ee';

type Note = {
  id: string; title: string; body: string; hypothesis: string;
  tags: string[]; refs: string[]; status: 'hypothesis'|'testing'|'confirmed'|'refuted';
  isPublic: boolean; createdAt: string; version: number;
};
type LogEntry = { id: string; action: string; ts: string; noteId: string };

const STATUS_COLORS: Record<Note['status'],string> = {
  hypothesis:'#facc15',testing:'#f97316',confirmed:'#4ade80',refuted:'#f87171'
};
const TAG_PRESETS = ['Physics','Biology','Chemistry','AI/ML','Economics','Psychology','Engineering','Climate'];

const DEMO_NOTES: Note[] = [
  {id:'1',title:'Quantum Coherence in Biological Systems',
   body:'Investigating long-lived quantum coherence effects in photosynthetic complexes. Initial observations suggest coherence timescales exceed thermal decoherence predictions by 2–3x.',
   hypothesis:'Quantum coherence enhances energy transfer efficiency in photosynthetic organisms.',
   tags:['Biology','Physics'],refs:['Engel et al. 2007','Ishizaki & Fleming 2009'],
   status:'testing',isPublic:false,createdAt:'2026-02-14',version:3},
  {id:'2',title:'Neural Plasticity Under Sleep Deprivation',
   body:'Longitudinal study of synaptic pruning rates in subjects with restricted sleep cycles.',
   hypothesis:'Sleep deprivation accelerates synaptic loss beyond normal pruning rates.',
   tags:['Psychology','Biology'],refs:[],
   status:'hypothesis',isPublic:true,createdAt:'2026-03-01',version:1},
];

export default function ResearchFace() {
  const [notes,    setNotes]    = useState<Note[]>(DEMO_NOTES);
  const [selected, setSelected] = useState<Note|null>(DEMO_NOTES[0]);
  const [view,     setView]     = useState<'list'|'editor'>('editor');
  const [log,      setLog]      = useState<LogEntry[]>([
    {id:'1',action:'Note created: Quantum Coherence…',ts:'2 days ago',noteId:'1'},
    {id:'2',action:'Version 2 → 3 saved',ts:'1 day ago',noteId:'1'},
  ]);
  const [newTag,   setNewTag]   = useState('');
  const [newRef,   setNewRef]   = useState('');
  const [aiLoading,setAi]       = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const update = (patch: Partial<Note>) => {
    if (!selected) return;
    const updated = {...selected,...patch,version:selected.version+1};
    setSelected(updated);
    setNotes(ns=>ns.map(n=>n.id===selected.id?updated:n));
    setLog(l=>[{id:Date.now().toString(),action:`Updated: ${selected.title}`,ts:'Just now',noteId:selected.id},...l.slice(0,9)]);
  };

  const newNote = () => {
    const n: Note = {id:Date.now().toString(),title:'New Research Note',body:'',hypothesis:'',
      tags:[],refs:[],status:'hypothesis',isPublic:false,createdAt:new Date().toISOString().slice(0,10),version:1};
    setNotes(ns=>[n,...ns]);
    setSelected(n);
    setView('editor');
  };

  const addTag = () => {
    if (!newTag.trim()||!selected) return;
    update({tags:[...selected.tags,newTag.trim()]});
    setNewTag('');
  };

  const addRef = () => {
    if (!newRef.trim()||!selected) return;
    update({refs:[...selected.refs,newRef.trim()]});
    setNewRef('');
  };

  const aiSummarise = async () => {
    if (!selected) return;
    setAi(true);
    await new Promise(r=>setTimeout(r,1600));
    setAi(false);
    update({body:selected.body+(selected.body?'\n\n':'')+`[AI Summary] This note explores ${selected.hypothesis.toLowerCase()||'the research hypothesis'} through structured observation and data collection. Key themes: ${selected.tags.join(', ')||'untagged'}. Current status: ${selected.status}.`});
  };

  return (
    <div style={FACE_WRAPPER}>
      <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center'}}>
        <DBtn label={view==='editor'?'← Notes':'New Note'} accent={A} small ghost
          onClick={()=>view==='editor'?setView('list'):newNote()}/>
        <div style={{flex:1}}/>
        {view==='editor'&&selected&&(
          <>
            <button type="button" onClick={()=>update({isPublic:!selected.isPublic})}
              style={{fontSize:11,color:selected.isPublic?'#4ade80':'rgba(160,185,255,0.4)',
                background:'none',border:'none',cursor:'pointer',fontWeight:700}}>
              {selected.isPublic?'🌐 Public':'🔒 Private'}
            </button>
            <DBtn label="+ Log" accent={A} small ghost
              onClick={()=>setLog(l=>[{id:Date.now().toString(),action:'Manual log entry',ts:'Just now',noteId:selected.id},...l.slice(0,9)])}/>
          </>
        )}
      </div>

      {view==='list' && (
        <DSection title={`Research Notes (${notes.length})`}
          action={<DBtn label="New Note" icon="+" accent={A} small onClick={newNote}/>}>
          {notes.length===0&&<DEmptyState icon="🧪" message="No notes yet — start researching"/>}
          {notes.map(n=>(
            <DCard key={n.id} accent={A} style={{marginBottom:8,cursor:'pointer'}}
              onClick={()=>{setSelected(n);setView('editor');}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:'rgba(240,244,255,0.9)',marginBottom:4}}>{n.title}</div>
                  <div style={{fontSize:11,color:'rgba(160,185,255,0.5)',lineHeight:1.4,
                    display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                    {n.body||n.hypothesis||'No content yet'}
                  </div>
                  <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap',alignItems:'center'}}>
                    <StatusPill status={n.status}/>
                    {n.tags.slice(0,3).map(t=>(
                      <span key={t} style={{fontSize:9,padding:'2px 6px',borderRadius:8,background:`${A}15`,color:`${A}99`,border:`1px solid ${A}25`}}>{t}</span>
                    ))}
                    <span style={{fontSize:9,color:'rgba(160,185,255,0.3)',marginLeft:'auto'}}>v{n.version}</span>
                  </div>
                </div>
              </div>
            </DCard>
          ))}
        </DSection>
      )}

      {view==='editor' && selected && (
        <>
          <DSection title="Title">
            <input value={selected.title} onChange={e=>update({title:e.target.value})}
              style={{...inp,width:'100%',fontSize:14,fontWeight:700}}/>
          </DSection>

          <DSection title="Status & Tools">
            <DCard accent={A}>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                {(['hypothesis','testing','confirmed','refuted'] as Note['status'][]).map(s=>(
                  <button key={s} type="button" onClick={()=>update({status:s})}
                    style={{padding:'5px 12px',borderRadius:14,fontSize:10,fontWeight:700,cursor:'pointer',
                      background:selected.status===s?`${STATUS_COLORS[s]}22`:'rgba(100,150,255,0.06)',
                      border:selected.status===s?`1px solid ${STATUS_COLORS[s]}`:'1px solid rgba(100,150,255,0.1)',
                      color:selected.status===s?STATUS_COLORS[s]:'rgba(160,185,255,0.4)',
                      textTransform:'capitalize'}}>
                    {s}
                  </button>
                ))}
                <DBtn label={aiLoading?'Summarising…':'⚡ AI Summary'} accent={A} small ghost
                  onClick={aiSummarise}/>
              </div>
            </DCard>
          </DSection>

          <DSection title="Hypothesis">
            <DCard accent={A}>
              <textarea value={selected.hypothesis} rows={2}
                onChange={e=>update({hypothesis:e.target.value})}
                placeholder="State your hypothesis clearly…"
                style={{...inp,width:'100%',resize:'vertical',lineHeight:1.5}}/>
            </DCard>
          </DSection>

          <DSection title="Notes">
            <DCard accent={A}>
              <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap'}}>
                {['**Bold**','_Italic_','## Heading','- List','> Quote','```Code```'].map(f=>(
                  <button key={f} type="button"
                    onClick={()=>{const ta=bodyRef.current;if(!ta)return;const s=ta.selectionStart,e=ta.selectionEnd;const v=ta.value;update({body:v.slice(0,s)+f+v.slice(e)});}}
                    style={{fontSize:10,padding:'3px 8px',borderRadius:8,cursor:'pointer',
                      background:'rgba(100,150,255,0.06)',border:'1px solid rgba(100,150,255,0.12)',
                      color:'rgba(160,185,255,0.6)'}}>
                    {f.replace(/[*_#>`]/g,'').trim()||f}
                  </button>
                ))}
              </div>
              <textarea ref={bodyRef} value={selected.body} rows={8}
                onChange={e=>update({body:e.target.value})}
                placeholder="Write your research notes here. Supports markdown."
                style={{...inp,width:'100%',resize:'vertical',lineHeight:1.7,fontFamily:'inherit'}}/>
            </DCard>
          </DSection>

          <DSection title="Tags">
            <DCard accent={A}>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
                {TAG_PRESETS.map(t=>(
                  <button key={t} type="button"
                    onClick={()=>!selected.tags.includes(t)&&update({tags:[...selected.tags,t]})}
                    style={{fontSize:10,padding:'4px 10px',borderRadius:20,cursor:'pointer',
                      background:selected.tags.includes(t)?`${A}22`:'rgba(100,150,255,0.04)',
                      border:selected.tags.includes(t)?`1px solid ${A}55`:'1px solid rgba(100,150,255,0.1)',
                      color:selected.tags.includes(t)?`${A}cc`:'rgba(160,185,255,0.35)'}}>
                    {t}
                  </button>
                ))}
              </div>
              <div style={{display:'flex',gap:6}}>
                <input value={newTag} onChange={e=>setNewTag(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&addTag()}
                  placeholder="Custom tag…" style={{...inp,flex:1}}/>
                <DBtn label="Add" accent={A} small onClick={addTag}/>
              </div>
              {selected.tags.length>0&&(
                <div style={{display:'flex',gap:4,marginTop:8,flexWrap:'wrap'}}>
                  {selected.tags.map(t=>(
                    <span key={t} style={{display:'flex',alignItems:'center',gap:4,fontSize:10,padding:'3px 8px',
                      borderRadius:10,background:`${A}15`,color:`${A}cc`,border:`1px solid ${A}25`}}>
                      {t}
                      <button type="button" onClick={()=>update({tags:selected.tags.filter(x=>x!==t)})}
                        style={{background:'none',border:'none',cursor:'pointer',color:`${A}88`,fontSize:10,lineHeight:1}}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </DCard>
          </DSection>

          <DSection title="References & Citations">
            <DCard accent={A}>
              {selected.refs.map((r,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',
                  borderBottom:'1px solid rgba(100,150,255,0.06)'}}>
                  <span style={{fontSize:10,color:`${A}77`,fontWeight:700,minWidth:20}}>[{i+1}]</span>
                  <span style={{flex:1,fontSize:11,color:'rgba(160,185,255,0.7)'}}>{r}</span>
                  <button type="button" onClick={()=>update({refs:selected.refs.filter((_,j)=>j!==i)})}
                    style={{background:'none',border:'none',cursor:'pointer',color:'rgba(160,185,255,0.3)',fontSize:12}}>×</button>
                </div>
              ))}
              <div style={{display:'flex',gap:6,marginTop:8}}>
                <input value={newRef} onChange={e=>setNewRef(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&addRef()}
                  placeholder="Author, Year — Title…" style={{...inp,flex:1}}/>
                <DBtn label="Add" accent={A} small onClick={addRef}/>
              </div>
            </DCard>
          </DSection>

          <DSection title="Export & Share">
            <DCard accent={A}>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <DBtn label="Export Markdown" icon="⬇" accent={A} small ghost/>
                <DBtn label="Export PDF" icon="📄" accent={A} small ghost/>
                <DBtn label="Publish to Feed" icon="📡" accent="#4ade80" small ghost/>
              </div>
            </DCard>
          </DSection>
        </>
      )}

      <DSection title={`Experiment Log (${log.length})`}>
        <DCard accent={A}>
          {log.slice(0,5).map((l,i)=>(
            <div key={l.id} style={{display:'flex',gap:10,padding:'6px 0',
              borderBottom:i<Math.min(log.length,5)-1?'1px solid rgba(100,150,255,0.06)':'none'}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:A,flexShrink:0,marginTop:4,opacity:0.6}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:'rgba(160,185,255,0.7)'}}>{l.action}</div>
                <div style={{fontSize:9,color:'rgba(160,185,255,0.3)'}}>{l.ts}</div>
              </div>
            </div>
          ))}
          {log.length===0&&<div style={{fontSize:11,color:'rgba(160,185,255,0.3)',padding:'8px 0'}}>No activity yet</div>}
        </DCard>
      </DSection>
    </div>
  );
}

const inp: React.CSSProperties = {background:'rgba(100,150,255,0.08)',border:'1px solid rgba(100,150,255,0.15)',borderRadius:8,padding:'7px 10px',color:'rgba(240,244,255,0.85)',fontSize:12,outline:'none',width:'100%'};
function StatusPill({status}:{status:Note['status']}) {
  const c=STATUS_COLORS[status];
  return <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:c,background:`${c}22`,padding:'2px 7px',borderRadius:10,border:`1px solid ${c}44`}}>{status}</span>;
}
