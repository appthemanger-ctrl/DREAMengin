'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log to console in dev; in production you can wire this to a monitoring tool.
    console.error('Route error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Something cracked in the dream.</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          The page hit an error. Your session and data are safe; this is just the UI tripping.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => location.reload()}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            Reload
          </button>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 break-all">
          {error?.message}
        </p>
      </div>
    </div>
  )
}
