'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DSection, DCard, DBtn, FACE_WRAPPER } from '../DayDreamShell';

const A = '#22d3ee';

type Param = { id: string; label: string; unit: string; min: number; max: number; value: number; step: number };
type RunResult = { id: string; label: string; params: Record<string,number>; output: number[]; ts: string };

const INITIAL_PARAMS: Param[] = [
  {id:'mass',    label:'Mass',     unit:'kg',  min:0.1,  max:100,  value:10,  step:0.1},
  {id:'force',   label:'Force',    unit:'N',   min:0,    max:1000, value:50,  step:1},
  {id:'friction',label:'Friction', unit:'μ',   min:0,    max:1,    value:0.3, step:0.01},
  {id:'gravity', label:'Gravity',  unit:'m/s²',min:0,    max:30,   value:9.81,step:0.01},
  {id:'time',    label:'Duration', unit:'s',   min:1,    max:60,   value:10,  step:1},
  {id:'damping', label:'Damping',  unit:'',    min:0,    max:1,    value:0.1, step:0.01},
];

function simulate(params: Record<string,number>): number[] {
  const {mass,force,friction,gravity,damping,time} = params;
  const steps = Math.min(Math.round(time*10),200);
  const a = (force - friction*mass*gravity) / mass;
  const points: number[] = [];
  let v=0, pos=0;
  for (let i=0;i<=steps;i++) {
    const dt=time/steps;
    v += (a - damping*v)*dt;
    pos += v*dt;
    points.push(Math.max(0,pos));
  }
  return points;
}

export default function SimulatorFace() {
  const [params,  setParams]  = useState<Param[]>(INITIAL_PARAMS);
  const [running, setRunning] = useState(false);
  const [progress,setProgress]= useState(0);
  const [output,  setOutput]  = useState<number[]>([]);
  const [runs,    setRuns]    = useState<RunResult[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [tab,     setTab]     = useState<'controls'|'graph'|'runs'>('controls');
  const [aiAlert, setAiAlert] = useState<string|null>(null);
  const runRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const paramMap = Object.fromEntries(params.map(p=>[p.id,p.value]));

  const runSim = useCallback(() => {
    if (running) return;
    setRunning(true); setProgress(0); setAiAlert(null);
    let p=0;
    runRef.current = setInterval(()=>{
      p+=5;
      setProgress(p);
      if (p>=100) {
        clearInterval(runRef.current!);
        const result = simulate(paramMap);
        setOutput(result);
        const runId = Date.now().toString();
        const snap: RunResult = {
          id:runId, label:`Run ${runs.length+1}`,
          params:{...paramMap}, output:result,
          ts:new Date().toLocaleTimeString()
        };
        setRuns(rs=>[snap,...rs.slice(0,4)]);
        setRunning(false); setProgress(100);
        const max=Math.max(...result);
        if (max>500) setAiAlert('⚠️ AI: Position exceeds 500m — check mass/force ratio.');
        else if (paramMap.friction===0) setAiAlert('💡 AI: Zero friction detected — consider physical validity.');
      }
    },40);
  },[running,paramMap,runs.length]);

  useEffect(()=>()=>{if(runRef.current)clearInterval(runRef.current);},[]);

  const setVal = (id: string, v: number) =>
    setParams(ps=>ps.map(p=>p.id===id?{...p,value:v}:p));

  const exportCSV = () => {
    if (!output.length) return;
    const n=output.length>1?output.length-1:1;
    const csv='t,position\n'+output.map((v,i)=>`${(i/n*paramMap.time).toFixed(2)},${v.toFixed(4)}`).join('\n');
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download='simulation.csv'; a.click();
  };

  const maxOutput = output.length>0 ? Math.max(...output,1) : 1;
  const graphH = 120;

  const compareRuns = compare.length===2
    ? runs.filter(r=>compare.includes(r.id))
    : [];

  return (
    <div style={FACE_WRAPPER}>

      <div style={{display:'flex',gap:4,marginBottom:14,background:'rgba(100,150,255,0.06)',
        border:'1px solid rgba(100,150,255,0.12)',borderRadius:20,padding:3}}>
        {([['controls','⚙️ Controls'],['graph','📈 Output'],['runs','🗂 Runs']] as const).map(([t,lbl])=>(
          <button key={t} type="button" onClick={()=>setTab(t)}
            style={{flex:1,padding:'7px 0',borderRadius:16,fontSize:11,fontWeight:700,cursor:'pointer',
              background:tab===t?`${A}22`:'transparent',border:tab===t?`1px solid ${A}55`:'1px solid transparent',
              color:tab===t?'rgba(200,240,255,0.95)':'rgba(160,185,255,0.4)'}}>
            {lbl}
          </button>
        ))}
      </div>

      {tab==='controls' && (
        <DSection title="Simulation Parameters"
          action={
            <button type="button" onClick={()=>setParams(INITIAL_PARAMS)}
              style={{fontSize:10,color:'rgba(160,185,255,0.4)',background:'none',border:'none',cursor:'pointer'}}>
              ↺ Reset
            </button>
          }>
          <DCard accent={A}>
            {params.map(p=>(
              <div key={p.id} style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:11,fontWeight:700,color:'rgba(200,240,255,0.8)'}}>{p.label}</span>
                  <span style={{fontSize:11,fontFamily:'monospace',color:A}}>
                    {p.value.toFixed(p.step<0.1?2:p.step<1?2:1)} {p.unit}
                  </span>
                </div>
                <input type="range" min={p.min} max={p.max} step={p.step} value={p.value}
                  onChange={e=>setVal(p.id,+e.target.value)}
                  style={{width:'100%',cursor:'pointer',accentColor:A}}/>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:2}}>
                  <span style={{fontSize:9,color:'rgba(160,185,255,0.3)'}}>{p.min} {p.unit}</span>
                  <span style={{fontSize:9,color:'rgba(160,185,255,0.3)'}}>{p.max} {p.unit}</span>
                </div>
              </div>
            ))}
          </DCard>
        </DSection>
      )}

      <DSection title="Run">
        <DCard accent={A} style={{padding:'12px 14px'}}>
          {running && (
            <div style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:11,color:'rgba(160,185,255,0.6)'}}>Simulating…</span>
                <span style={{fontSize:11,color:A,fontWeight:700}}>{progress}%</span>
              </div>
              <div style={{height:4,background:'rgba(100,150,255,0.12)',borderRadius:2}}>
                <div style={{height:'100%',width:`${progress}%`,background:`linear-gradient(90deg,${A},#0ea5e9)`,borderRadius:2,transition:'width 0.1s'}}/>
              </div>
            </div>
          )}
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <DBtn label={running?'Running…':'▶ Run Simulation'} accent={A}
              onClick={runSim}/>
            {output.length>0&&<DBtn label="Export CSV" icon="⬇" accent={A} small ghost onClick={exportCSV}/>}
            {output.length>0&&<DBtn label="📸 Snapshot" accent={A} small ghost
              onClick={()=>setRuns(rs=>[{id:'snap-'+Date.now(),label:`Snapshot ${rs.length+1}`,params:{...paramMap},output:[...output],ts:'Just now'},...rs.slice(0,4)])}/>}
          </div>
          {aiAlert && (
            <div style={{marginTop:10,padding:'8px 10px',borderRadius:8,
              background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.25)',
              fontSize:11,color:'#facc15'}}>
              {aiAlert}
            </div>
          )}
        </DCard>
      </DSection>

      {tab==='graph' && (
        <DSection title="Position vs Time">
          <DCard accent={A} style={{padding:'12px 14px'}}>
            {output.length===0 ? (
              <div style={{height:graphH,display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:12,color:'rgba(160,185,255,0.35)'}}>
                Run a simulation to see output
              </div>
            ) : (
              <>
                <svg viewBox={`0 0 400 ${graphH}`} style={{width:'100%',height:graphH}}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={A} stopOpacity="0.3"/>
                      <stop offset="100%" stopColor={A} stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {[0.25,0.5,0.75].map(y=>(
                    <line key={y} x1="0" y1={y*graphH} x2="400" y2={y*graphH}
                      stroke="rgba(100,150,255,0.08)" strokeWidth="1"/>
                  ))}
                  <polygon
                    points={[
                      '0,'+graphH,
                      ...output.map((v,i)=>`${(output.length>1?i/(output.length-1):0)*400},${graphH-(v/maxOutput)*(graphH-10)}`),
                      '400,'+graphH
                    ].join(' ')}
                    fill="url(#g1)"/>
                  <polyline
                    points={output.map((v,i)=>`${(output.length>1?i/(output.length-1):0)*400},${graphH-(v/maxOutput)*(graphH-10)}`).join(' ')}
                    fill="none" stroke={A} strokeWidth="2" strokeLinejoin="round"/>
                  {compareRuns[1] && compareRuns[1].output.length>1 && (
                    <polyline
                      points={compareRuns[1].output.map((v,i)=>`${(i/(compareRuns[1].output.length-1))*400},${graphH-(v/Math.max(...compareRuns[1].output,1))*(graphH-10)}`).join(' ')}
                      fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="4 2" strokeLinejoin="round"/>
                  )}
                </svg>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                  <span style={{fontSize:9,color:'rgba(160,185,255,0.3)'}}>0s</span>
                  <span style={{fontSize:9,color:'rgba(160,185,255,0.3)'}}>{paramMap.time}s</span>
                </div>
                <div style={{marginTop:6,display:'flex',gap:12}}>
                  <div style={{fontSize:10,color:'rgba(160,185,255,0.5)'}}>Max: <span style={{color:A,fontWeight:700}}>{maxOutput.toFixed(2)}m</span></div>
                  <div style={{fontSize:10,color:'rgba(160,185,255,0.5)'}}>Final: <span style={{color:'rgba(240,244,255,0.8)',fontWeight:700}}>{(output[output.length-1]??0).toFixed(2)}m</span></div>
                </div>
              </>
            )}
          </DCard>
        </DSection>
      )}

      {tab==='runs' && (
        <DSection title={`Saved Runs (${runs.length})`}>
          {runs.length===0&&<div style={{fontSize:12,color:'rgba(160,185,255,0.3)',textAlign:'center',padding:'20px 0'}}>No runs yet</div>}
          {runs.map(r=>(
            <DCard key={r.id} accent={A} style={{marginBottom:6}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,color:'rgba(240,244,255,0.85)'}}>{r.label}</div>
                  <div style={{fontSize:9,color:'rgba(160,185,255,0.35)'}}>{r.ts}</div>
                </div>
                <div style={{display:'flex',gap:4}}>
                  <button type="button"
                    onClick={()=>setCompare(c=>c.includes(r.id)?c.filter(x=>x!==r.id):[...c.slice(-1),r.id])}
                    style={{fontSize:9,padding:'4px 8px',borderRadius:10,cursor:'pointer',fontWeight:700,
                      background:compare.includes(r.id)?`${A}22`:'rgba(100,150,255,0.06)',
                      border:compare.includes(r.id)?`1px solid ${A}55`:'1px solid rgba(100,150,255,0.1)',
                      color:compare.includes(r.id)?A:'rgba(160,185,255,0.4)'}}>
                    {compare.includes(r.id)?'✓ Selected':'Compare'}
                  </button>
                  <DBtn label="Load" accent={A} small ghost onClick={()=>setOutput(r.output)}/>
                </div>
              </div>
              <div style={{display:'flex',gap:1,alignItems:'flex-end',height:16,marginTop:6}}>
                {r.output.filter((_,i)=>{const step=Math.ceil(r.output.length/30)||1;return i%step===0;}).map((v,i)=>(
                  <div key={i} style={{flex:1,background:A,opacity:0.5,
                    height:`${Math.max(2,(v/Math.max(...r.output,1))*100)}%`,borderRadius:1}}/>
                ))}
              </div>
            </DCard>
          ))}
          {compare.length===2&&(
            <DCard accent="#f97316" style={{marginTop:8}}>
              <div style={{fontSize:11,color:'rgba(240,244,255,0.7)'}}>
                Comparing: <strong>{compareRuns.map(r=>r.label).join(' vs ')}</strong>
              </div>
              <div style={{display:'flex',gap:8,marginTop:8}}>
                {compareRuns.map(r=>(
                  <div key={r.id} style={{flex:1,fontSize:10,color:'rgba(160,185,255,0.6)'}}>
                    {r.label}: max {Math.max(...r.output,0).toFixed(1)}m
                  </div>
                ))}
              </div>
              <button type="button" onClick={()=>setCompare([])}
                style={{marginTop:8,fontSize:10,color:'rgba(160,185,255,0.4)',background:'none',border:'none',cursor:'pointer'}}>
                Clear comparison
              </button>
            </DCard>
          )}
        </DSection>
      )}
    </div>
  );
}
