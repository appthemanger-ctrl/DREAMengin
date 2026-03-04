import Nav from '@/components/Nav'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'

const services = [
  { name: 'Twitter / X',   status: 'connected',    desc: 'Cross-post and import followers' },
  { name: 'Spotify',       status: 'not connected', desc: 'Share your music activity' },
  { name: 'GitHub',        status: 'not connected', desc: 'Showcase your open-source work' },
  { name: 'Discord',       status: 'not connected', desc: 'Connect your community' },
]

export default function SettingsConnectors() {
  return (
    <div className="min-h-screen bg-sky-gradient">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/settings" className="flex items-center gap-2 text-slate-400 hover:text-de-sky text-sm mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Settings
        </Link>
        <h1 className="text-2xl font-bold mb-6">Connectors</h1>
        <div className="de-card p-6 space-y-4">
          {services.map(s => (
            <div key={s.name} className="flex items-center justify-between py-3 border-b border-de-border last:border-0">
              <div>
                <p className="font-medium text-sm">{s.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
              </div>
              <button className={`text-xs px-4 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1
                ${s.status === 'connected'
                  ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                  : 'de-btn-ghost py-1.5'}`}>
                {s.status === 'connected' ? 'Connected' : <><ExternalLink size={11}/> Connect</>}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
