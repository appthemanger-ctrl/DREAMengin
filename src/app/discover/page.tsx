import Nav from '@/components/Nav'
import Image from 'next/image'
import Link from 'next/link'
import { Search } from 'lucide-react'

const creators = [
  { handle: 'dreamr_jay',    img: '/images/hero3.PNG',    bio: 'Creative director & AI artist' },
  { handle: 'idari_builds',  img: '/images/idari1.PNG',   bio: 'Platform architect' },
  { handle: 'boogie_street', img: '/images/Boogie1.PNG',  bio: 'Street culture curator' },
]

export default function Discover() {
  return (
    <div className="min-h-screen bg-sky-gradient">
      <Nav />
      <div className="de-section">
        <h1 className="text-4xl font-bold de-gradient-text mb-2">Discover</h1>
        <p className="text-slate-400 mb-8">Find creators, collections, and content you love.</p>
        {/* Search */}
        <div className="relative max-w-xl mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input className="de-input pl-11" placeholder="Search creators, tags, collections…" />
        </div>
        {/* Creator grid */}
        <h2 className="text-xl font-semibold mb-6">Trending Creators</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {creators.map(c => (
            <Link key={c.handle} href={`/u/${c.handle}`}
              className="de-card overflow-hidden group hover:shadow-sky-glow transition-all">
              <div className="relative h-44">
                <Image src={c.img} alt={c.handle} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-de-card to-transparent" />
              </div>
              <div className="p-4">
                <p className="font-semibold group-hover:text-de-sky transition-colors">@{c.handle}</p>
                <p className="text-sm text-slate-400">{c.bio}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
