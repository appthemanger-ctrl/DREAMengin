
'use client'
import { useRef, useState } from 'react'
export default function AudioPlayer({ src }:{ src:string }){
  const ref = useRef<HTMLAudioElement>(null)
  const [playing,setPlaying] = useState(false)
  const toggle=()=>{ if(!ref.current) return; playing?ref.current.pause():ref.current.play(); setPlaying(p=>!p) }
  return (
    <div className="flex items-center gap-3 mt-3">
      <button onClick={toggle} className="bg-white/10 px-3 py-1 rounded text-sm">{playing?'Pause':'Play'}</button>
      <audio ref={ref} src={src} onEnded={()=>setPlaying(false)} />
    </div>
  )
}
