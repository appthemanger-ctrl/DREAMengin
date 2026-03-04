import Nav from '@/components/Nav'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SettingsAccount() {
  return (
    <div className="min-h-screen bg-sky-gradient">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/settings" className="flex items-center gap-2 text-slate-400 hover:text-de-sky text-sm mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Settings
        </Link>
        <h1 className="text-2xl font-bold mb-6">Account</h1>
        <div className="de-card p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input className="de-input" defaultValue="your_handle" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" className="de-input" defaultValue="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea className="de-input h-24 resize-none" defaultValue="Creator · Builder · Dreamer" />
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
