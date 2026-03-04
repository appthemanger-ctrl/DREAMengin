import Nav from '@/components/Nav'
import Image from 'next/image'
import { Send } from 'lucide-react'

const convos = [
  { user: 'dreamr_jay',    last: 'Yo check the new drop 🔥', time: '2m', unread: 2 },
  { user: 'idari_builds',  last: 'Build is looking clean',   time: '1h', unread: 0 },
  { user: 'boogie_street', last: 'Streets are talking 👀',   time: '3h', unread: 1 },
]

export default function Messages() {
  return (
    <div className="min-h-screen bg-sky-gradient">
      <Nav />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold de-gradient-text mb-6">Messages</h1>
        <div className="de-card divide-y divide-de-border">
          {convos.map(c => (
            <div key={c.user} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer">
              <Image src="/logo-icon.png" alt="" width={44} height={44} className="rounded-full" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">@{c.user}</p>
                  <span className="text-xs text-slate-500">{c.time}</span>
                </div>
                <p className="text-sm text-slate-400 truncate">{c.last}</p>
              </div>
              {c.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-de-sky-dark text-white text-xs flex items-center justify-center font-bold">
                  {c.unread}
                </span>
              )}
            </div>
          ))}
        </div>
        {/* Composer */}
        <div className="de-card mt-4 p-4 flex gap-3">
          <input className="de-input flex-1" placeholder="Type a message…" />
          <button className="de-btn-primary px-4"><Send size={16}/></button>
        </div>
      </div>
    </div>
  )
}
