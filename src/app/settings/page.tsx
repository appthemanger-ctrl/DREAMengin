import Nav from '@/components/Nav'
import Link from 'next/link'
import { User, Palette, Bell, Database, Link2, Sliders } from 'lucide-react'

const sections = [
  { href: '/settings/account',    icon: User,     label: 'Account',    desc: 'Update your profile, username, and email.' },
  { href: '/settings/appearance', icon: Palette,  label: 'Appearance', desc: 'Theme, font size, and display options.' },
  { href: '/settings/feed',       icon: Bell,     label: 'Feed',       desc: 'Customise what shows in your feed.' },
  { href: '/settings/data',       icon: Database, label: 'Data',       desc: 'Export data and manage privacy.' },
  { href: '/settings/connectors', icon: Link2,    label: 'Connectors', desc: 'Connect third-party apps and services.' },
  { href: '/settings/controls',   icon: Sliders,  label: 'Controls',   desc: 'Advanced account controls.' },
]

export default function Settings() {
  return (
    <div className="min-h-screen bg-sky-gradient">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold de-gradient-text mb-2">Settings</h1>
        <p className="text-slate-400 mb-8">Manage your account and preferences.</p>
        <div className="flex flex-col gap-3">
          {sections.map(s => (
            <Link key={s.href} href={s.href}
              className="de-card p-5 flex items-center gap-4 hover:shadow-sky-glow transition-all group">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-de-sky group-hover:bg-sky-500/20 transition-colors">
                <s.icon size={18} />
              </div>
              <div>
                <p className="font-semibold group-hover:text-de-sky transition-colors">{s.label}</p>
                <p className="text-sm text-slate-400">{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
