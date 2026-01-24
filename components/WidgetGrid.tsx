
'use client'
import { useEffect, useState } from 'react'
import { Reorder, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

export default function WidgetGrid({ initial = [] as any[] }){
  const [widgets,setWidgets]=useState<any[]>(initial)
  const supabase = createClient()

  useEffect(()=>{
    if (initial.length) return
    supabase.from('widgets').select('*').order('position',{ascending:true}).then(({data})=>setWidgets(data||[]))
  },[])

  async function persistOrder(list:any[]){
    await supabase.from('widgets').upsert(list.map((w,i)=>({...w, position:i})), { onConflict: 'id' })
  }

  async function remove(id:string){ await supabase.from('widgets').delete().eq('id',id); setWidgets(widgets.filter(w=>w.id!==id)) }

  return (
    <Reorder.Group axis="y" values={widgets} onReorder={(l)=>{ setWidgets(l); persistOrder(l) }} className="grid gap-4 md:grid-cols-2">
      {widgets.map(w=>(
        <Reorder.Item key={w.id} value={w}>
          <motion.div whileHover={{scale:1.02}} whileDrag={{scale:1.05, rotate:1}} className="glass p-5 relative">
            <button onClick={()=>remove(w.id)} className="absolute top-2 right-2 text-white/60 hover:text-rose-400" title="Delete"><Trash2 size={18} /></button>
            <h3 className="text-lg font-semibold">{w.title}</h3>
            {w.body?<p className="opacity-80 mt-1 whitespace-pre-wrap">{w.body}</p>:null}
            {w.url?<a className="text-brandA underline mt-2 inline-block" href={w.url} target="_blank">Open</a>:null}
          </motion.div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  )
}
