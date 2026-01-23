import { createServerClient } from '../../../lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name, bio')
    .eq('username', params.handle)
    .single()
  return {
    title: `${data?.full_name ?? params.handle} — DREAMengin`,
    description: data?.bio ?? '',
  }
}

export default async function ProfilePage({ params }) {
  const supabase = createServerClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.handle)
    .single()

  if (!profile) return <p className="p-8">Profile not found</p>

  const links = Array.isArray(profile.links_json) ? profile.links_json : []

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <section className="glass p-6 flex items-center gap-4 mb-6">
        <div className="rounded-full bg-brandA/20 flex items-center justify-center font-display text-brandA w-24 h-24">
          {(profile.username || 'me').slice(0,2).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-2xl">{profile.full_name}</h1>
          <p className="text-slate-300">@{profile.username}</p>
          {profile.bio && <p className="mt-2">{profile.bio}</p>}
        </div>
      </section>

      {links.length > 0 && (
        <section className="glass p-4 space-y-3">
          {links.map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              {l.title}
            </a>
          ))}
        </section>
      )}
    </main>
  )
}
