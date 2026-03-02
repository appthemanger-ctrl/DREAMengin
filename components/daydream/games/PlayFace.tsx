'use client';
import React, { useEffect, useRef, useState } from 'react';
import { DSection, DCard, DBtn, FACE_WRAPPER } from '../DayDreamShell';

const A = '#f97316';

const WORDS = ['dream','code','music','create','build','launch','design','brand','play','learn','flow','sync','pulse','loop','wave','spark','glow','rise','shift','prime','craft','merge','stack','push','cast','draw','forge','blend','print','remix'];

type Phase = 'menu'|'play'|'pause'|'end';
type SavedState = { score: number; best: number; gamesPlayed: number };

export default function PlayFace({ onExit }: { onExit?: () => void }) {
  const [phase,    setPhase]    = useState<Phase>('menu');
  const [wordList, setWordList] = useState<string[]>([]);
  const [current,  setCurrent]  = useState(0);
  const [input,    setInput]    = useState('');
  const [score,    setScore]    = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [duration, setDuration] = useState(30);
  const [saved,    setSaved]    = useState<SavedState>({score:0,best:0,gamesPlayed:0});
  const [audioVol, setAudioVol] = useState(80);
  const [showSettings,setShowSettings] = useState(false);
  const [fps,      setFps]      = useState(60);
  const [fpsVisible,setFpsVis] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const fpsRef   = useRef<ReturnType<typeof setInterval>|null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const frameCount = useRef(0);



  // FPS monitor
  useEffect(()=>{
    let last = performance.now();
    fpsRef.current = setInterval(()=>{
      const now = performance.now();
      setFps(Math.round(frameCount.current / ((now-last)/1000)));
      frameCount.current = 0;
      last = now;
    },1000);
    const raf = ()=>{ frameCount.current++; requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    return ()=>{ if(fpsRef.current) clearInterval(fpsRef.current); };
  },[]);

  function startGame() {
    const shuffled = [...WORDS].sort(()=>Math.random()-0.5);
    setWordList(shuffled);
    setCurrent(0); setInput(''); setScore(0); setTimeLeft(duration);
    setPhase('play');
    setTimeout(()=>inputRef.current?.focus(),100);
    timerRef.current = setInterval(()=>{
      setTimeLeft(t=>{
        if (t<=1) {
          clearInterval(timerRef.current!);
          setSaved(s=>({ score, best:Math.max(s.best,score), gamesPlayed:s.gamesPlayed+1 }));
          setPhase('end');
          return 0;
        }
        return t-1;
      });
    },1000);
  }

  function pauseGame() {
    clearInterval(timerRef.current!);
    setPhase('pause');
  }

  function resumeGame() {
    setPhase('play');
    timerRef.current = setInterval(()=>{
      setTimeLeft(t=>{
        if (t<=1) {
          clearInterval(timerRef.current!);
          setSaved(s=>({ score, best:Math.max(s.best,score), gamesPlayed:s.gamesPlayed+1 }));
          setPhase('end');
          return 0;
        }
        return t-1;
      });
    },1000);
    setTimeout(()=>inputRef.current?.focus(),50);
  }


  useEffect(()=>()=>{
    if(timerRef.current) clearInterval(timerRef.current);
    if(fpsRef.current) clearInterval(fpsRef.current);
  },[]);

  function handleType(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInput(val);
    if (val.trimEnd()===wordList[current]) {
      const newScore = score + val.trim().length;
      setScore(newScore);
      setCurrent(c=>(c+1)%wordList.length);
      setInput('');
    }
  }

  const timerPct = (timeLeft/duration)*100;
  const timerColor = timeLeft>10?'#4ade80':timeLeft>5?'#facc15':'#f87171';

  // Fullscreen (play mode fills the face)
  if (phase==='play'||phase==='pause') {
    return (
      <div style={{minHeight:'calc(100dvh - 52px)',background:'#020818',display:'flex',flexDirection:'column',position:'relative'}}>
        {/* HUD — sticky top */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'8px 14px',borderBottom:'1px solid rgba(100,150,255,0.1)',
          background:'rgba(2,8,24,0.95)',backdropFilter:'blur(8px)',position:'sticky',top:52,zIndex:10}}>
          <button type="button" onClick={()=>{clearInterval(timerRef.current!);setPhase('menu');}}
            style={{background:'none',border:'1px solid rgba(100,150,255,0.2)',cursor:'pointer',
              fontSize:11,color:'rgba(160,185,255,0.5)',padding:'4px 10px',borderRadius:20}}>
            ← Exit
          </button>
          <span style={{fontSize:10,fontWeight:700,color:'rgba(160,185,255,0.4)',letterSpacing:'0.1em'}}>WORD SPRINT</span>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {fpsVisible&&<span style={{fontSize:9,fontFamily:'monospace',color:'rgba(100,150,255,0.35)'}}>{fps}fps</span>}
            {phase==='play'
              ?<button type="button" onClick={pauseGame}
                style={{background:'none',border:'none',cursor:'pointer',fontSize:12,color:'rgba(160,185,255,0.5)'}}>⏸</button>
              :<button type="button" onClick={resumeGame}
                style={{background:`${A}22`,border:`1px solid ${A}44`,cursor:'pointer',
                  fontSize:11,color:'rgba(255,200,150,0.9)',padding:'4px 10px',borderRadius:20,fontWeight:700}}>
                ▶ Resume
              </button>
            }
          </div>
        </div>

        {/* Game area */}
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,gap:20}}>
          {phase==='pause' ? (
            <div style={{textAlign:'center',display:'flex',flexDirection:'column',gap:16,alignItems:'center'}}>
              <div style={{fontSize:36}}>⏸</div>
              <div style={{fontSize:20,fontWeight:800,color:'rgba(240,244,255,0.9)'}}>Paused</div>
              <div style={{fontSize:16,color:A,fontWeight:700}}>{score} pts</div>
              <div style={{fontSize:12,color:'rgba(160,185,255,0.4)'}}>{timeLeft}s remaining</div>
              <DBtn label="▶ Resume" accent={A} onClick={resumeGame}/>
              <DBtn label="↺ Restart" accent={A} ghost small onClick={startGame}/>
            </div>
          ) : (
            <>
              {/* Timer bar */}
              <div style={{width:'100%',maxWidth:400}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <span style={{fontSize:11,fontWeight:800,color:timerColor,fontVariantNumeric:'tabular-nums'}}>{timeLeft}s</span>
                  <span style={{fontSize:11,fontWeight:800,color:A}}>{score} pts</span>
                </div>
                <div style={{height:6,background:'rgba(100,150,255,0.12)',borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${timerPct}%`,background:timerColor,borderRadius:3,
                    transition:`width ${phase==='play'?'0.5s linear':'none'}`}}/>
                </div>
              </div>
              {/* Target word */}
              <div style={{fontSize:40,fontWeight:800,color:'rgba(240,244,255,0.95)',
                letterSpacing:'0.06em',textTransform:'lowercase',textAlign:'center'}}>
                {wordList[current]}
              </div>
              {/* Upcoming */}
              <div style={{display:'flex',gap:12,opacity:0.3}}>
                {[1,2,3].map(i=><span key={i} style={{fontSize:16,color:'rgba(160,185,255,0.7)'}}>{wordList[(current+i)%wordList.length]}</span>)}
              </div>
              {/* Input */}
              <input ref={inputRef} value={input} onChange={handleType}
                placeholder="Type here…"
                style={{width:'100%',maxWidth:400,padding:'14px 18px',borderRadius:16,fontSize:17,
                  fontWeight:700,outline:'none',textAlign:'center',
                  background:'rgba(100,150,255,0.1)',
                  border:`2px solid ${input&&wordList[current]?.startsWith(input)?'#4ade80':'rgba(100,150,255,0.2)'}`,
                  color:'rgba(240,244,255,0.95)'}}/>
              {/* Letter match indicator */}
              <div style={{display:'flex',gap:4}}>
                {wordList[current]?.split('').map((ch,i)=>(
                  <span key={i} style={{fontSize:14,fontWeight:700,
                    color:i<input.length?(input[i]===ch?'#4ade80':'#f87171'):'rgba(160,185,255,0.25)'}}>
                    {ch}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // End screen
  if (phase==='end') {
    return (
      <div style={{minHeight:'calc(100dvh - 52px)',background:'#020818',display:'flex',
        flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,gap:16}}>
        <div style={{fontSize:56}}>🏆</div>
        <div style={{fontSize:22,fontWeight:800,color:'rgba(240,244,255,0.95)'}}>Time's Up!</div>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:52,fontWeight:800,color:A,lineHeight:1}}>{score}</div>
          <div style={{fontSize:14,color:'rgba(160,185,255,0.45)',marginTop:4}}>points</div>
        </div>
        {saved.best>0&&(
          <div style={{fontSize:12,color:score>=saved.best?'#4ade80':'rgba(160,185,255,0.4)'}}>
            {score>=saved.best?'🎉 New Best!': `Best: ${saved.best} pts`}
          </div>
        )}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,width:'100%',maxWidth:340}}>
          {[['Games Played',saved.gamesPlayed+1],['All-Time Best',Math.max(saved.best,score)],['Words/Game',Math.round(score/Math.max(1,score>0?wordList.length:1))]].map(([l,v])=>(
            <div key={l as string} style={{textAlign:'center',padding:'8px',background:'rgba(100,150,255,0.06)',borderRadius:10}}>
              <div style={{fontSize:16,fontWeight:800,color:'rgba(240,244,255,0.85)'}}>{v as number}</div>
              <div style={{fontSize:9,color:'rgba(160,185,255,0.35)',textTransform:'uppercase'}}>{l as string}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:8}}>
          <DBtn label="▶ Play Again" accent={A} onClick={startGame}/>
          <DBtn label="← Library" accent={A} ghost small onClick={()=>setPhase('menu')}/>
        </div>
      </div>
    );
  }

  // Menu
  return (
    <div style={FACE_WRAPPER}>
      <DSection title="Play">
        <DCard accent={A} style={{textAlign:'center',padding:'24px 16px'}}>
          <div style={{fontSize:48,marginBottom:12}}>📝</div>
          <div style={{fontSize:20,fontWeight:800,color:'rgba(240,244,255,0.95)',marginBottom:6}}>Word Sprint</div>
          <div style={{fontSize:13,color:'rgba(160,185,255,0.5)',lineHeight:1.6,marginBottom:16}}>
            Type the words as fast as you can.<br/>Every character scores a point.
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:16}}>
            {[15,30,60].map(d=>(
              <button key={d} type="button" onClick={()=>setDuration(d)}
                style={{padding:'6px 16px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',
                  background:duration===d?`${A}22`:'rgba(100,150,255,0.06)',
                  border:duration===d?`1px solid ${A}55`:'1px solid rgba(100,150,255,0.1)',
                  color:duration===d?'rgba(255,200,150,0.95)':'rgba(160,185,255,0.4)'}}>
                {d}s
              </button>
            ))}
          </div>
          <button type="button" onClick={startGame}
            style={{padding:'14px 48px',borderRadius:30,fontSize:15,fontWeight:800,cursor:'pointer',
              background:`linear-gradient(135deg,${A},#fbbf24)`,border:'none',color:'#fff',
              boxShadow:`0 4px 20px ${A}55`}}>
            ▶ Start Game
          </button>
        </DCard>
      </DSection>

      {/* Stats */}
      {saved.gamesPlayed>0&&(
        <DSection title="Session Stats">
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {[['Best Score',saved.best,'#facc15'],['Games',saved.gamesPlayed,A],['Last Score',saved.score,'rgba(160,185,255,0.8)']].map(([l,v,c])=>(
              <div key={l as string} style={{padding:'10px',background:'rgba(100,150,255,0.06)',borderRadius:10,textAlign:'center'}}>
                <div style={{fontSize:18,fontWeight:800,color:c as string}}>{v as number}</div>
                <div style={{fontSize:9,color:'rgba(160,185,255,0.4)',textTransform:'uppercase'}}>{l as string}</div>
              </div>
            ))}
          </div>
        </DSection>
      )}

      {/* Settings */}
      <DSection title="Performance Settings"
        action={<button type="button" onClick={()=>setShowSettings(v=>!v)}
          style={{background:'none',border:'none',cursor:'pointer',fontSize:11,color:`${A}88`}}>
          {showSettings?'Hide':'Show'}
        </button>}>
        {showSettings&&(
          <DCard accent={A}>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:11,color:'rgba(160,185,255,0.6)'}}>Audio Volume</span>
                  <span style={{fontSize:11,color:A,fontWeight:700}}>{audioVol}%</span>
                </div>
                <input type="range" min={0} max={100} value={audioVol}
                  onChange={e=>setAudioVol(+e.target.value)}
                  style={{width:'100%',accentColor:A}}/>
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:11,color:'rgba(160,185,255,0.6)'}}>Show FPS Counter</span>
                <button type="button" onClick={()=>setFpsVis(v=>!v)}
                  style={{width:40,height:22,borderRadius:11,cursor:'pointer',transition:'background 0.2s',
                    background:fpsVisible?`${A}33`:'rgba(100,150,255,0.1)',
                    border:fpsVisible?`1px solid ${A}55`:'1px solid rgba(100,150,255,0.2)'}}>
                  <div style={{width:16,height:16,borderRadius:'50%',background:fpsVisible?A:'rgba(160,185,255,0.3)',
                    transform:`translateX(${fpsVisible?20:2}px)`,transition:'transform 0.2s, background 0.2s'}}/>
                </button>
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:11,color:'rgba(160,185,255,0.4)'}}>Controller mapping</span>
                <DBtn label="Configure" accent={A} small ghost/>
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:11,color:'rgba(160,185,255,0.4)'}}>Cloud save sync</span>
                <span style={{fontSize:10,color:'#4ade80',fontWeight:700}}>☁ Active</span>
              </div>
            </div>
          </DCard>
        )}
      </DSection>
    </div>
  );
}
