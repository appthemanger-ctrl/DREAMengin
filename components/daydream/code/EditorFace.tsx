'use client';
import React, { useState, useRef, useCallback } from 'react';
import { DSection, DCard, DBtn, FACE_WRAPPER } from '../DayDreamShell';

const A = '#38bdf8';

type FileEntry = { id: string; name: string; lang: string; content: string; hasErrors: boolean; modified: boolean };
type BuildLog = { type: 'info'|'warn'|'error'|'success'; msg: string; ts: string };

const LANGS: Record<string,string> = {
  tsx:'TypeScript','ts':'TypeScript',jsx:'JavaScript',js:'JavaScript',
  css:'CSS',html:'HTML',json:'JSON',md:'Markdown',py:'Python',sh:'Shell'
};

// suppress unused warning
void LANGS;
void FACE_WRAPPER;

const INITIAL_FILES: FileEntry[] = [
  {id:'1',name:'App.tsx',          lang:'tsx',  hasErrors:false,modified:false,content:`import React from 'react';\n\nexport default function App() {\n  return (\n    <div className="app">\n      <h1>Hello, DREAMengin</h1>\n      <p>Start building your dream project.</p>\n    </div>\n  );\n}`},
  {id:'2',name:'styles.css',       lang:'css',  hasErrors:false,modified:false,content:`.app {\n  font-family: sans-serif;\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 2rem;\n}\n\nh1 {\n  color: #38bdf8;\n}`},
  {id:'3',name:'utils.ts',         lang:'ts',   hasErrors:true, modified:true, content:`// Utility functions\nexport function formatDate(d: Date): string {\n  return d.toLocaleDateString();\n}\n\n// TODO: fix this function\nexport function parseConfig(raw: string) {\n  return JSON.parse(raw); // may throw\n}`},
  {id:'4',name:'package.json',     lang:'json', hasErrors:false,modified:false,content:`{\n  "name": "dream-project",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build"\n  },\n  "dependencies": {\n    "react": "^18",\n    "next": "^14"\n  }\n}`},
];

const SNIPPETS = [
  {label:'React Component',code:`function Component({ title }: { title: string }) {\n  return <div>{title}</div>;\n}`},
  {label:'useEffect',code:`useEffect(() => {\n  // side effect\n  return () => { /* cleanup */ };\n}, []);`},
  {label:'Fetch data',code:`const res = await fetch('/api/data');\nconst json = await res.json();`},
  {label:'useState',code:`const [value, setValue] = useState<string>('');`},
];

const ENVS = ['Development','Staging','Production'];

export default function EditorFace({ onCodeChange }: { onCodeChange?: (code: string) => void }) {
  const [files,     setFiles]     = useState<FileEntry[]>(INITIAL_FILES);
  const [activeId,  setActiveId]  = useState('1');
  const [tabs,      setTabs]      = useState<string[]>(['1','2']);
  const [env,       setEnv]       = useState('Development');
  const [buildLogs, setBuildLogs] = useState<BuildLog[]>([]);
  const [building,  setBuilding]  = useState(false);
  const [showLogs,  setShowLogs]  = useState(false);
  const [showSnippets,setShowSnips]= useState(false);
  const [newName,   setNewName]   = useState('');
  const [showNewFile,setShowNew]  = useState(false);
  const [aiQuery,   setAiQuery]   = useState('');
  const [aiLoading, setAiLoad]    = useState(false);
  const [aiReply,   setAiReply]   = useState('');
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const active = files.find(f=>f.id===activeId) ?? files[0];
  const errors = files.filter(f=>f.hasErrors).length;
  const modified = files.filter(f=>f.modified).length;

  const openTab = (id: string) => {
    setActiveId(id);
    if (!tabs.includes(id)) setTabs(t=>[...t,id]);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = tabs.filter(t=>t!==id);
    setTabs(next);
    if (activeId===id) setActiveId(next[next.length-1]??files[0].id);
  };

  const updateContent = useCallback((content: string) => {
    setFiles(fs=>fs.map(f=>f.id===activeId?{...f,content,modified:true}:f));
    onCodeChange?.(content);
  },[activeId,onCodeChange]);

  const saveFile = () => setFiles(fs=>fs.map(f=>f.id===activeId?{...f,modified:false}:f));

  const createFile = () => {
    if (!newName.trim()) return;
    const ext = newName.split('.').pop()??'txt';
    const id = Date.now().toString();
    setFiles(fs=>[...fs,{id,name:newName.trim(),lang:ext,content:'',hasErrors:false,modified:false}]);
    setTabs(t=>[...t,id]); setActiveId(id); setNewName(''); setShowNew(false);
  };

  const deleteFile = (id: string) => {
    if (files.length<=1) return;
    setFiles(fs=>fs.filter(f=>f.id!==id));
    closeTab(id,{stopPropagation:()=>{}} as React.MouseEvent);
  };

  const runBuild = async () => {
    setBuilding(true); setShowLogs(true);
    setBuildLogs([{type:'info',msg:`▶ Build started (${env})`,ts:new Date().toLocaleTimeString()}]);
    await new Promise(r=>setTimeout(r,400));
    setBuildLogs(l=>[...l,{type:'info',msg:'Resolving dependencies…',ts:new Date().toLocaleTimeString()}]);
    await new Promise(r=>setTimeout(r,600));
    if (errors>0) {
      setBuildLogs(l=>[...l,{type:'error',msg:`✗ ${errors} file(s) have errors — fix before building`,ts:new Date().toLocaleTimeString()}]);
    } else {
      setBuildLogs(l=>[...l,
        {type:'info',   msg:'Compiling TypeScript…',        ts:new Date().toLocaleTimeString()},
        {type:'info',   msg:'Bundling assets…',             ts:new Date().toLocaleTimeString()},
        {type:'success',msg:'✓ Build complete in 1.24s',    ts:new Date().toLocaleTimeString()},
      ]);
    }
    setBuilding(false);
  };

  const askAi = async () => {
    if (!aiQuery.trim()) return;
    setAiLoad(true);
    await new Promise(r=>setTimeout(r,1400));
    setAiReply(`Suggestion for "${aiQuery}": Consider using a custom hook to extract this logic into a reusable unit. Add error boundaries around async operations, and ensure you handle the loading/error/success states explicitly with TypeScript discriminated unions.`);
    setAiLoad(false);
  };

  const insertSnippet = (code: string) => {
    const ta = editorRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const next = active.content.slice(0,s)+'\n'+code+'\n'+active.content.slice(e);
    updateContent(next);
    setShowSnips(false);
  };

  const getLangColor = (lang: string) => {
    const map: Record<string,string> = {tsx:'#38bdf8',ts:'#38bdf8',jsx:'#facc15',js:'#facc15',css:'#f472b6',html:'#f97316',json:'#4ade80',md:'#a855f7',py:'#22d3ee',sh:'#94a3b8'};
    return map[lang]??'#94a3b8';
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100dvh - 52px)',overflow:'hidden'}}>

      {/* ── Toolbar ─────────────────────────────────── */}
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',
        background:'rgba(2,8,24,0.95)',borderBottom:'1px solid rgba(100,150,255,0.1)',flexShrink:0,flexWrap:'wrap'}}>
        <select value={env} onChange={e=>setEnv(e.target.value)}
          style={{...inp,padding:'5px 8px',fontSize:11}}>
          {ENVS.map(e=><option key={e}>{e}</option>)}
        </select>
        <DBtn label={building?'Building…':'▶ Build'} accent={A} small onClick={runBuild}/>
        <DBtn label="Save" icon="💾" accent={A} small ghost onClick={saveFile}/>
        <DBtn label="Snippets" icon="⚡" accent={A} small ghost onClick={()=>setShowSnips(v=>!v)}/>
        <DBtn label="⬇ Logs" accent={A} small ghost onClick={()=>setShowLogs(v=>!v)}/>
        {errors>0&&<span style={{fontSize:11,color:'#f87171',fontWeight:700}}>⚠ {errors} error{errors>1?'s':''}</span>}
        {modified>0&&<span style={{fontSize:10,color:'#facc15'}}>● {modified} unsaved</span>}
        <DBtn label="+ File" accent={A} small ghost onClick={()=>setShowNew(v=>!v)}/>
      </div>

      {/* ── New file input ───────────────────────────── */}
      {showNewFile&&(
        <div style={{display:'flex',gap:6,padding:'6px 12px',background:'rgba(56,189,248,0.05)',
          borderBottom:'1px solid rgba(100,150,255,0.1)',flexShrink:0}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&createFile()}
            placeholder="filename.tsx" autoFocus style={{...inp,flex:1,fontSize:11}}/>
          <DBtn label="Create" accent={A} small onClick={createFile}/>
          <DBtn label="Cancel" accent="#64748b" small ghost onClick={()=>setShowNew(false)}/>
        </div>
      )}

      {/* ── Snippet picker ───────────────────────────── */}
      {showSnippets&&(
        <div style={{padding:'8px 12px',background:'rgba(56,189,248,0.05)',
          borderBottom:'1px solid rgba(100,150,255,0.1)',flexShrink:0,display:'flex',gap:6,flexWrap:'wrap'}}>
          {SNIPPETS.map(s=>(
            <button key={s.label} type="button" onClick={()=>insertSnippet(s.code)}
              style={{padding:'5px 10px',borderRadius:10,fontSize:10,fontWeight:700,cursor:'pointer',
                background:`${A}15`,border:`1px solid ${A}33`,color:`${A}cc`}}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        {/* ── File tree ───────────────────────────────── */}
        <div style={{width:160,borderRight:'1px solid rgba(100,150,255,0.08)',
          background:'rgba(2,5,18,0.7)',overflowY:'auto',flexShrink:0}}>
          <div style={{padding:'8px 10px 4px',fontSize:9,fontWeight:700,
            letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(160,185,255,0.3)'}}>
            Files
          </div>
          {files.map(f=>(
            <div key={f.id}
              onClick={()=>openTab(f.id)}
              style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',cursor:'pointer',
                background:activeId===f.id?'rgba(56,189,248,0.08)':'transparent',
                borderLeft:`2px solid ${activeId===f.id?A:'transparent'}`}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:getLangColor(f.lang),flexShrink:0}}/>
              <span style={{flex:1,fontSize:11,color:activeId===f.id?'rgba(240,244,255,0.9)':'rgba(160,185,255,0.55)',
                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {f.name}
              </span>
              <div style={{display:'flex',gap:3}}>
                {f.hasErrors&&<span style={{fontSize:9,color:'#f87171'}}>!</span>}
                {f.modified&&<span style={{fontSize:9,color:'#facc15'}}>●</span>}
                {files.length>1&&(
                  <button type="button"
                    onClick={e=>{e.stopPropagation();deleteFile(f.id);}}
                    style={{background:'none',border:'none',cursor:'pointer',color:'rgba(160,185,255,0.2)',
                      fontSize:10,lineHeight:1,padding:0,opacity:0,transition:'opacity 0.15s'}}
                    onMouseEnter={e=>(e.currentTarget.style.opacity='1')}
                    onMouseLeave={e=>(e.currentTarget.style.opacity='0')}>
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Editor pane ─────────────────────────────── */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {/* Tab bar */}
          <div style={{display:'flex',overflowX:'auto',borderBottom:'1px solid rgba(100,150,255,0.08)',
            background:'rgba(2,5,18,0.5)',flexShrink:0}}>
            {tabs.map(id=>{
              const f=files.find(x=>x.id===id); if(!f) return null;
              return (
                <div key={id} onClick={()=>setActiveId(id)}
                  style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',cursor:'pointer',
                    flexShrink:0,borderRight:'1px solid rgba(100,150,255,0.06)',
                    background:activeId===id?'rgba(56,189,248,0.06)':'transparent',
                    borderBottom:activeId===id?`2px solid ${A}`:'2px solid transparent'}}>
                  <span style={{width:5,height:5,borderRadius:'50%',background:getLangColor(f.lang)}}/>
                  <span style={{fontSize:11,color:activeId===id?'rgba(240,244,255,0.85)':'rgba(160,185,255,0.4)'}}>
                    {f.name}{f.modified?'●':''}
                  </span>
                  {tabs.length>1&&(
                    <button type="button" onClick={e=>closeTab(id,e)}
                      style={{background:'none',border:'none',cursor:'pointer',color:'rgba(160,185,255,0.3)',
                        fontSize:11,lineHeight:1,padding:0,marginLeft:2}}>×</button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Code editor */}
          <div style={{flex:1,position:'relative',overflow:'hidden',display:'flex'}}>
            {/* Line numbers */}
            <div style={{width:36,background:'rgba(2,5,18,0.4)',borderRight:'1px solid rgba(100,150,255,0.06)',
              overflowY:'hidden',flexShrink:0,padding:'12px 0',userSelect:'none'}}>
              {active.content.split('\n').map((_,i)=>(
                <div key={i} style={{height:20,display:'flex',alignItems:'center',justifyContent:'flex-end',
                  paddingRight:8,fontSize:10,fontFamily:'monospace',color:'rgba(160,185,255,0.2)'}}>
                  {i+1}
                </div>
              ))}
            </div>
            <textarea
              ref={editorRef}
              value={active.content}
              onChange={e=>updateContent(e.target.value)}
              spellCheck={false}
              style={{flex:1,background:'rgba(2,8,24,0.6)',border:'none',outline:'none',
                color:'rgba(220,235,255,0.88)',fontSize:12,fontFamily:'"Fira Code","Cascadia Code","Courier New",monospace',
                lineHeight:'20px',padding:'12px 12px',resize:'none',
                tabSize:2,whiteSpace:'pre',overflowX:'auto'}}
              onKeyDown={e=>{
                if (e.key==='Tab') { e.preventDefault(); const s=e.currentTarget.selectionStart; const v=e.currentTarget.value; updateContent(v.slice(0,s)+'  '+v.slice(s)); setTimeout(()=>{ if(editorRef.current){ editorRef.current.selectionStart=editorRef.current.selectionEnd=s+2; }},0); }
                if ((e.metaKey||e.ctrlKey)&&e.key==='s') { e.preventDefault(); saveFile(); }
              }}
            />
            {active.hasErrors&&(
              <div style={{position:'absolute',bottom:8,right:8,padding:'4px 10px',borderRadius:8,
                background:'rgba(248,113,113,0.15)',border:'1px solid rgba(248,113,113,0.3)',
                fontSize:10,color:'#f87171',fontWeight:700}}>
                ⚠ Errors detected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Build log ───────────────────────────────── */}
      {showLogs&&(
        <div style={{height:120,borderTop:'1px solid rgba(100,150,255,0.1)',
          background:'rgba(2,5,18,0.9)',overflowY:'auto',flexShrink:0,padding:'8px 12px'}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:'0.12em',color:'rgba(160,185,255,0.3)',
            textTransform:'uppercase',marginBottom:6}}>Build Output</div>
          {buildLogs.length===0&&<div style={{fontSize:11,color:'rgba(160,185,255,0.25)'}}>No build output yet — click Build to compile</div>}
          {buildLogs.map((l,i)=>(
            <div key={i} style={{display:'flex',gap:8,marginBottom:3}}>
              <span style={{fontSize:9,fontFamily:'monospace',color:'rgba(160,185,255,0.25)',flexShrink:0}}>{l.ts}</span>
              <span style={{fontSize:11,fontFamily:'monospace',
                color:l.type==='error'?'#f87171':l.type==='warn'?'#facc15':l.type==='success'?'#4ade80':'rgba(160,185,255,0.6)'}}>
                {l.msg}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Dr. Eams AI ─────────────────────────────── */}
      <div style={{padding:'8px 12px',borderTop:'1px solid rgba(100,150,255,0.08)',
        background:'rgba(2,5,18,0.7)',flexShrink:0}}>
        <div style={{display:'flex',gap:6}}>
          <input value={aiQuery} onChange={e=>setAiQuery(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&askAi()}
            placeholder="Ask Dr. Eams about your code…"
            style={{...inp,flex:1,fontSize:11}}/>
          <DBtn label={aiLoading?'…':'⚡ Ask'} accent={A} small onClick={askAi}/>
        </div>
        {aiReply&&(
          <div style={{marginTop:6,padding:'8px 10px',borderRadius:8,background:`${A}08`,
            border:`1px solid ${A}22`,fontSize:11,color:'rgba(160,185,255,0.75)',lineHeight:1.5}}>
            💡 {aiReply}
          </div>
        )}
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {background:'rgba(100,150,255,0.08)',border:'1px solid rgba(100,150,255,0.15)',borderRadius:8,padding:'7px 10px',color:'rgba(240,244,255,0.85)',fontSize:12,outline:'none'};
