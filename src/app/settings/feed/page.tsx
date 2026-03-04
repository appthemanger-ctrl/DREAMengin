import Nav from '@/components/Nav'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const toggles = [
  { label: 'Show recommended creators', desc: 'Discover new creators based on your activity' },
  { label: 'Show trending posts',        desc: 'Posts that are gaining traction on the platform' },
  { label: 'Email digest',               desc: 'Weekly summary of what you missed' },
  { label: 'Push notifications',         desc: 'Get notified about new content from people you follow' },
]

export default function SettingsFeed() {
  return (
    <div className="min-h-screen bg-sky-gradient">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/settings" className="flex items-center gap-2 text-slate-400 hover:text-de-sky text-sm mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Settings
        </Link>
        <h1 className="text-2xl font-bold mb-6">Feed</h1>
        <div className="de-card p-6 space-y-4">
          {toggles.map(t => (
            <div key={t.label} className="flex items-center justify-between py-2 border-b border-de-border last:border-0">
              <div>
                <p className="font-medium text-sm">{t.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
              </div>
              <div className="w-11 h-6 bg-de-sky-dark rounded-full relative cursor-pointer flex-shrink-0 ml-4">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
          ))}
          <div className="pt-2 flex gap-3">
            <button className="de-btn-primary">Save Changes</button>
            <Link href="/settings" className="de-btn-ghost">Cancel</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
