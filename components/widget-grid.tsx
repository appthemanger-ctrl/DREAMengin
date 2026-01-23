'use client'
import { motion, Reorder } from 'framer-motion'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase'
import { Trash2 } from 'lucide-react'

export function WidgetGrid() {
  const [widgets, setWidgets] = useState<any[]>([])
  const supabase = supabaseBrowser()

  useEffect(() => {
    supabase
      .from('widgets')
      .select('*')
      .order('position')
      .then(({ data, error }) => {
        if (!error && data) setWidgets(data)
      })
  }, [])

  async function deleteWidget(id: string) {
    await supabase.from('widgets').delete().eq('id', id)
    setWidgets(prev => prev.filter(w => w.id !== id))
  }

  return (
    <Reorder.Group axis="y" values={widgets} onReorder={setWidgets} className="grid gap-4 md:grid-cols-2">
      {widgets.map((w) => (
        <Reorder.Item key={w.id} value={w}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileDrag={{ scale: 1.05, rotate: 2 }}
            className="glass p-5 cursor-move relative"
          >
            <button
              onClick={() => deleteWidget(w.id)}
              className="absolute top-2 right-2 text-white/60 hover:text-red-400"
              aria-label="Delete widget"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
            <h3 className="text-xl font-bold mb-2">{w.title}</h3>
            <p className="text-white/80">{w.body}</p>
          </motion.div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  )
}
