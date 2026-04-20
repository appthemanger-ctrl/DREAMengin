'use client'

import { useEffect, useState } from 'react'
import { Bot, BotOff } from 'lucide-react'
import { getDrEamsMode, onDrEamsModeChange, setDrEamsMode } from '@/lib/agents/drEamsMode'
import { emitTeach } from '@/lib/agents/teachBus'

export default function DrEamsModeToggle() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    setEnabled(getDrEamsMode())
    const off = onDrEamsModeChange((v) => setEnabled(v))
    return () => off()
  }, [])

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    setDrEamsMode(next)
    // First-time coaching: explain what this toggle does.
    emitTeach({
      featureId: 'drEamsMode',
      title: 'Dr. Eams Full Experience',
      message:
        next
          ? 'Full Experience is ON. I’ll proactively explain features after you use them, and I can run safe UI actions (navigate, adjust theme, open tools) on request.'
          : 'Full Experience is OFF. I’ll stay quieter and only respond when you open me.'
    })
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label={enabled ? 'Turn off Dr. Eams Full Experience' : 'Turn on Dr. Eams Full Experience'}
      title={enabled ? 'Dr. Eams Full Experience: ON' : 'Dr. Eams Full Experience: OFF'}
    >
      {enabled ? (
        <Bot className="w-5 h-5 text-slate-600 dark:text-slate-200" />
      ) : (
        <BotOff className="w-5 h-5 text-slate-600 dark:text-slate-200" />
      )}
    </button>
  )
}
