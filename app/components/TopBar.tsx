'use client'
import Link from 'next/link'
import BrandLogo from './BrandLogo'

export default function TopBar() {
  return (
    <header className="sticky top-0 z-50">
      <div className="h-1 w-full html-gradient"></div>
      <div className="backdrop-blur bg-black/40 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <BrandLogo size={44} />
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/signup" className="hover:underline">Create account</Link>
            <Link href="/login" className="hover:underline">Log in</Link>
            <Link href="/admin" className="hover:underline">Admin</Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
