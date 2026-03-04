import Nav from '@/components/Nav'
import Image from 'next/image'
import Link from 'next/link'
import { Settings, Grid3X3 } from 'lucide-react'

export default function Profile() {
  return (
    <div className="min-h-screen bg-sky-gradient">
      <Nav />
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="de-card p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Image src="/logo-icon.png" alt="Avatar" width={88} height={88} className="rounded-full border-4 border-de-sky/40" />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">@your_handle</h1>
              <p className="text-slate-400 mt-1">Creator · Builder · Dreamer</p>
              <div className="flex gap-6 justify-center sm:justify-start mt-4 text-sm">
                <div><span className="font-bold text-de-sky">128</span> <span className="text-slate-500">Posts</span></div>
                <div><span className="font-bold text-de-sky">4.2K</span> <span className="text-slate-500">Followers</span></div>
                <div><span className="font-bold text-de-sky">312</span> <span className="text-slate-500">Following</span></div>
              </div>
            </div>
            <Link href="/settings" className="de-btn-ghost text-sm"><Settings size={14}/> Edit Profile</Link>
          </div>
        </div>
        {/* Grid */}
        <div className="flex items-center gap-2 mb-4 text-slate-400"><Grid3X3 size={16}/> Posts</div>
        <div className="grid grid-cols-3 gap-2">
          {['/images/hero3.PNG','/images/idari1.PNG','/images/Boogie1.PNG','/logo_DREAM_transparent.png','/logo_ENGIN_transparent.png','/sprite_2x_transparent.png'].map((src, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-de-card group cursor-pointer">
              <Image src={src} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-de-navy/0 group-hover:bg-de-navy/30 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
