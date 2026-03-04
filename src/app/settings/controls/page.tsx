import Nav from '@/components/Nav'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SettingsControls() {
  return (
    <div className="min-h-screen bg-sky-gradient">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/settings" className="flex items-center gap-2 text-slate-400 hover:text-de-sky text-sm mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Settings
        </Link>
        <h1 className="text-2xl font-bold mb-6">Controls</h1>
        <div className="de-card p-6 space-y-6">
          <div>
            <h2 className="font-semibold mb-1">Two-Factor Authentication</h2>
            <p className="text-sm text-slate-400 mb-4">Add an extra layer of security to your account.</p>
            <button className="de-btn-primary text-sm">Enable 2FA</button>
          </div>
          <div className="border-t border-de-border pt-6">
            <h2 className="font-semibold mb-1">Active Sessions</h2>
            <p className="text-sm text-slate-400 mb-4">Manage where you&apos;re logged in.</p>
            <div className="de-card p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Chrome · macOS</p>
                <p className="text-xs text-slate-500">Current session · San Francisco, CA</p>
              </div>
              <span className="de-badge de-badge-sky">Active</span>
            </div>
          </div>
          <div className="border-t border-de-border pt-6">
            <h2 className="font-semibold mb-1 text-red-400">Danger Zone</h2>
            <p className="text-sm text-slate-400 mb-4">Irreversible actions. Proceed with caution.</p>
            <div className="flex gap-3">
              <button className="text-sm px-4 py-2 rounded-full border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors">
                Deactivate Account
              </button>
              <button className="text-sm px-4 py-2 rounded-full border border-red-700/60 text-red-500 hover:bg-red-700/10 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
