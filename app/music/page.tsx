
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AudioPlayer from '@/components/AudioPlayer'
import Link from 'next/link'

export default function MusicPage(){
  const [tracks,setTracks]=useState<any[]>([])
  const supabase = createClient()
  useEffect(()=>{ supabase.from('tracks').select('*').order('created_at',{ascending:false}).then(({data})=>setTracks(data||[])) },[])
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Music</h1>
        <Link href="/music/upload" className="btn-primary">Upload track</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {tracks.map(t=>(
          <div key={t.id} className="glass p-4">
            <img src={t.artwork_url||'/placeholder.png'} alt={t.title} className="w-full h-40 object-cover rounded-lg mb-3" />
            <h3 className="font-semibold">{t.title}</h3>
            {t.artist?<p className="text-sm opacity-80">{t.artist}</p>:null}
            {t.mp3_url?<AudioPlayer src={t.mp3_url} />:null}
          </div>
        ))}
      </div>
    </main>
  )
}
