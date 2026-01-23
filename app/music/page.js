import { createClient } from '../../lib/supabase/client'
'use client'
import { useEffect, useState } from 'react'
import AudioPlayer from '../../components/AudioPlayer'

export default function MusicPage() {
  const [tracks, setTracks] = useState([])
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('tracks')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setTracks(data || []))
  }, [])

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Music</h1>
        <a href="/music/upload" className="bg-brandB px-4 py-2 rounded-lg text-sm">
          Upload track
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tracks.map((t) => (
          <div key={t.id} className="glass p-4">
            <img
              src={t.artwork_url || '/placeholder.png'}
              alt={t.title}
              className="w-full h-40 object-cover rounded-lg mb-3"
            />
            <h3 className="font-semibold">{t.title}</h3>
            <p className="text-sm text-slate-300">{t.artist}</p>
            {t.mp3_url && <AudioPlayer src={t.mp3_url} />}
          </div>
        ))}
      </div>
    </main>
  )
}
