import Nav from '@/components/Nav'
import Image from 'next/image'
import { UserPlus } from 'lucide-react'

export default async function UserProfile({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  return (
    <div className="min-h-screen bg-sky-gradient">
      <Nav />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="de-card p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Image src="/logo-icon.png" alt="Avatar" width={88} height={88} className="rounded-full border-4 border-de-gold/40" />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">@{handle}</h1>
              <p className="text-slate-400 mt-1">Creator on DREAMengin</p>
              <div className="flex gap-6 justify-center sm:justify-start mt-4 text-sm">
                <div><span className="font-bold text-de-gold-light">—</span> <span className="text-slate-500">Posts</span></div>
                <div><span className="font-bold text-de-gold-light">—</span> <span className="text-slate-500">Followers</span></div>
              </div>
            </div>
            <button className="de-btn-gold"><UserPlus size={14}/> Follow</button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['/images/hero3.PNG','/images/idari1.PNG','/images/Boogie1.PNG'].map((src, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-de-card">
              <Image src={src} alt="" fill className="object-cover hover:scale-105 transition-transform duration-300" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
