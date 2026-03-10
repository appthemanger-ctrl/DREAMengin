'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "'Space Grotesk', system-ui, sans-serif", background: 'linear-gradient(160deg, #dce8f8 0%, #c5d8f0 50%, #b8ceec 100%)' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{
            width: '100%', maxWidth: 480,
            background: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(160,195,240,0.45)',
            boxShadow: '0 2px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
            borderRadius: 24,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(160,195,240,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#dc4444' }}>System hiccup.</span>
            </div>
            <div style={{ padding: '16px 18px 12px' }}>
              <p style={{ fontSize: 13, color: 'rgba(60,100,160,0.75)', marginBottom: 12 }}>
                Dreamengin hit an unexpected error. Try again — if it keeps happening, it’s likely a deployment or env config issue.
              </p>
              {error?.message && (
                <p style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all', padding: '8px 12px', borderRadius: 10, background: 'rgba(220,68,68,0.06)', color: '#dc4444', border: '1px solid rgba(220,68,68,0.15)', marginBottom: 12 }}>
                  {error.message}
                </p>
              )}
            </div>
            <div style={{ padding: '10px 18px 16px', display: 'flex', gap: 10 }}>
              <button
                onClick={() => reset()}
                style={{ flex: 1, minHeight: 44, borderRadius: 9999, background: '#2a8ab8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                Try again
              </button>
              <button
                onClick={() => location.reload()}
                style={{ flex: 1, minHeight: 44, borderRadius: 9999, background: 'rgba(42,138,184,0.1)', color: '#2a8ab8', border: '1px solid rgba(42,138,184,0.25)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
