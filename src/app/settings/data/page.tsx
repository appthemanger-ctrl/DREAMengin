import Nav from '@/components/Nav'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'

export default function SettingsData() {
  return (
    <div className="min-h-screen bg-sky-gradient">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/settings" className="flex items-center gap-2 text-slate-400 hover:text-de-sky text-sm mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Settings
        </Link>
        <h1 className="text-2xl font-bold mb-6">Data &amp; Privacy</h1>
        <div className="de-card p-6 space-y-6">
          <div>
            <h2 className="font-semibold mb-1">Export Your Data</h2>
            <p className="text-sm text-slate-400 mb-4">Download a copy of all your posts, messages, and account data.</p>
            <button className="de-btn-primary"><Download size={14}/> Request Export</button>
          </div>
          <div className="border-t border-de-border pt-6">
            <h2 className="font-semibold mb-1">Data Retention</h2>
            <p className="text-sm text-slate-400 mb-4">Choose how long we keep your activity data.</p>
            <select className="de-input max-w-xs">
              <option>Keep indefinitely</option>
              <option>1 year</option>
              <option>6 months</option>
              <option>3 months</option>
            </select>
          </div>
          <div className="border-t border-de-border pt-6">
            <h2 className="font-semibold mb-1">Analytics</h2>
            <p className="text-sm text-slate-400 mb-4">Help us improve by sharing anonymous usage data.</p>
            <div className="w-11 h-6 bg-de-sky-dark rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
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
