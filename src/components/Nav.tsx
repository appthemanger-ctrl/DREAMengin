'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const links = [
  { href: '/home',        label: 'Home' },
  { href: '/discover',    label: 'Discover' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/shop',        label: 'Shop' },
  { href: '/about',       label: 'About' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="de-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/logo-icon.png" alt="DREAMengin" width={36} height={36}
              className="rounded-lg group-hover:shadow-gold-glow transition-shadow" />
            <span className="font-bold text-lg de-gold-text">DREAMengin</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className="px-4 py-2 rounded-full text-sm font-medium text-slate-300
                           hover:text-de-sky hover:bg-white/5 transition-all">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login"  className="de-btn-ghost text-sm py-2 px-4">Log in</Link>
            <Link href="/join"   className="de-btn-primary text-sm py-2 px-4">Join Free</Link>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(o => !o)}
            className="md:hidden p-2 text-slate-300 hover:text-de-sky transition-colors">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-de-border bg-de-sheet/95 backdrop-blur-lg">
          <div className="px-4 py-4 flex flex-col gap-2">
            {links.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="py-2.5 px-4 rounded-xl text-slate-300 hover:text-de-sky hover:bg-white/5 transition-all">
                {l.label}
              </Link>
            ))}
            <hr className="border-de-border my-1" />
            <Link href="/login" onClick={() => setOpen(false)} className="de-btn-ghost text-sm justify-center">Log in</Link>
            <Link href="/join"  onClick={() => setOpen(false)} className="de-btn-gold  text-sm justify-center">Join Free</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
