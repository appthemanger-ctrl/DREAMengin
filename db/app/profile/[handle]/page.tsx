
import { createServerSupabase } from '@/lib/supabase/server'
export const revalidate = 0
export default async function Profile({ params }:{ params:{ handle:string } }){
  const supabase = createServerSupabase()
  const { data: profile } = await supabase.from('profiles').select('*').eq('username', params.handle).single()
  if (!profile) return <main className="p-8">Profile not found</main>
  const links = (profile.links_json as any[]) || []
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <section className="glass p-6 flex items-center gap-4 mb-6">
        <div className="w-24 h-24 rounded-full bg-white/20 grid place-items-center text-2xl">{(profile.full_name||'U').slice(0,1)}</div>
        <div>
          <h1 className="text-2xl font-semibold">{profile.full_name || profile.username}</h1>
          <p className="opacity-80">@{profile.username}</p>
          {profile.bio?<p className="mt-2">{profile.bio}</p>:null}
        </div>
      </section>
      {links.length>0 && (
        <section className="glass p-4 space-y-3">
          {links.map((l:any,i:number)=>(
            <a key={i} href={l.url} target="_blank" rel="noreferrer" className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition">{l.title}</a>
          ))}
        </section>
      )}
    </main>
  )
}
