import Nav from '@/components/Nav'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SettingsAppearance() {
  return (
    <div className="min-h-screen bg-sky-gradient">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/settings" className="flex items-center gap-2 text-slate-400 hover:text-de-sky text-sm mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Settings
        </Link>
        <h1 className="text-2xl font-bold mb-6">Appearance</h1>
        <div className="de-card p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <select className="de-input">
              <option value="dark">Dark (Default)</option>
              <option value="darker">Midnight</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Accent Colour</label>
            <div className="flex gap-3">
              {['#7DD3FC','#F59E0B','#A78BFA','#34D399'].map(c => (
                <button key={c} className="w-8 h-8 rounded-full border-2 border-transparent hover:border-white transition-all"
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Font Size</label>
            <select className="de-input" defaultValue="medium">
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div className="pt-2 flex gap-3">
            <button className="de-btn-primary">Save Changes</button>
            <Link href="/settings" className="de-btn-ghost">Cancel</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
