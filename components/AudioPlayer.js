'use client'
import { useRef, useState } from 'react'

export default function AudioPlayer({ src }) {
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)

  const toggle = () => {
    if (!ref.current) return
    if (playing) ref.current.pause()
    else ref.current.play()
    setPlaying((p) => !p)
  }

  if (!src) return null

  return (
    <div className="flex items-center gap-3 mt-3">
      <button onClick={toggle} className="bg-white/10 px-3 py-1 rounded text-sm">
        {playing ? 'Pause' : 'Play'}
      </button>
      <audio ref={ref} src={src} onEnded={() => setPlaying(false)} />
    </div>
  )
}
