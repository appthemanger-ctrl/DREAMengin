'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log to console in dev; in production you can wire this to a monitoring tool.
    console.error('Route error:', error)
  }, [error])

  return (
    <div className="de-sky-bg min-h-[60vh] flex items-center justify-center px-6">
      <div className="de-widget w-full max-w-lg">
        <div className="de-widget-header">
          <span className="de-widget-title" style={{ color: '#dc4444' }}>Something cracked in the dream.</span>
        </div>
        <div className="de-widget-body">
          <p className="text-sm mb-4" style={{ color: 'var(--de-text-dim)' }}>
            The page hit an error. Your session and data are safe; this is just the UI tripping.
          </p>
          {error?.message && (
            <p className="text-xs font-mono break-all p-3 rounded-xl" style={{ background: 'rgba(220,68,68,0.06)', color: '#dc4444', border: '1px solid rgba(220,68,68,0.15)' }}>
              {error.message}
            </p>
          )}
        </div>
        <div className="de-widget-actions">
          <button
            onClick={() => reset()}
            className="de-btn de-btn-primary"
            style={{ minHeight: 44 }}
          >
            Try again
          </button>
          <button
            onClick={() => location.reload()}
            className="de-btn de-btn-ghost"
            style={{ minHeight: 44 }}
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  )
}
