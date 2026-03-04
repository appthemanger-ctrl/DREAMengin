import Nav from '@/components/Nav'
import Image from 'next/image'
import { Heart, MessageCircle, Share2, PlusCircle } from 'lucide-react'

const posts = [
  { id: 1, user: 'dreamr_jay',    avatar: '/logo-icon.png', img: '/images/hero3.PNG',    title: 'New drop incoming 🔥', likes: 312, comments: 48 },
  { id: 2, user: 'idari_builds',  avatar: '/logo-icon.png', img: '/images/idari1.PNG',   title: 'AI can do THIS now?',  likes: 889, comments: 120 },
  { id: 3, user: 'boogie_street', avatar: '/logo-icon.png', img: '/images/Boogie1.PNG',  title: 'Street culture ×AI',   likes: 421, comments: 77 },
]

export default function HomeFeed() {
  return (
    <div className="min-h-screen bg-sky-gradient">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Composer */}
        <div className="de-card p-4 flex items-center gap-3 mb-6 cursor-pointer hover:shadow-sky-glow transition-all">
          <Image src="/logo-icon.png" alt="" width={36} height={36} className="rounded-full" />
          <span className="text-slate-500 flex-1">What are you building today?</span>
          <button className="de-btn-primary text-sm py-1.5 px-4"><PlusCircle size={14} /> Post</button>
        </div>
        {/* Posts */}
        {posts.map(p => (
          <div key={p.id} className="de-card mb-4 overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <Image src={p.avatar} alt="" width={36} height={36} className="rounded-full" />
              <div>
                <p className="font-semibold text-sm">{p.user}</p>
                <p className="text-xs text-slate-500">2h ago</p>
              </div>
            </div>
            <div className="relative w-full h-56">
              <Image src={p.img} alt={p.title} fill className="object-cover" />
            </div>
            <div className="p-4">
              <p className="font-medium mb-3">{p.title}</p>
              <div className="flex gap-4 text-slate-400 text-sm">
                <button className="flex items-center gap-1 hover:text-de-gold transition-colors"><Heart size={16}/> {p.likes}</button>
                <button className="flex items-center gap-1 hover:text-de-sky transition-colors"><MessageCircle size={16}/> {p.comments}</button>
                <button className="flex items-center gap-1 hover:text-de-sky transition-colors ml-auto"><Share2 size={16}/> Share</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
