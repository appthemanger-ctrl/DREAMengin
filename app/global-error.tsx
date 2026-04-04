'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          background: 'linear-gradient(155deg, #070e1c 0%, #0c1829 45%, #0f2244 75%, #0a1628 100%)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(32px) saturate(170%)',
            WebkitBackdropFilter: 'blur(32px) saturate(170%)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 24,
            boxShadow: '0 8px 56px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Top accent bar */}
          <div
            style={{
              height: 2,
              background: 'linear-gradient(90deg, transparent, rgba(220,68,68,0.5) 30%, rgba(200,152,26,0.4) 70%, transparent)',
            }}
            aria-hidden="true"
          />

          <div style={{ padding: '28px 24px 8px' }}>
            {/* Error icon */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                background: 'rgba(220,68,68,0.10)',
                border: '1px solid rgba(220,68,68,0.20)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                fontSize: 20,
              }}
              aria-hidden="true"
            >
              ⚠
            </div>

            <h1
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: 'rgba(220,235,255,0.92)',
                letterSpacing: '-0.02em',
                marginBottom: 8,
                lineHeight: 1.3,
              }}
            >
              System hiccup.
            </h1>

            <p
              style={{
                fontSize: 14,
                color: 'rgba(165,195,235,0.60)',
                lineHeight: 1.7,
                marginBottom: 16,
              }}
            >
              DREAMengin hit an unexpected error. Try again &mdash; if it keeps happening, it&apos;s likely a deployment or env config issue.
            </p>

            {error?.message && (
              <div
                style={{
                  fontSize: 12,
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  wordBreak: 'break-all' as const,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(220,68,68,0.08)',
                  border: '1px solid rgba(220,68,68,0.18)',
                  color: '#f87171',
                  lineHeight: 1.6,
                  marginBottom: 20,
                }}
              >
                {error.message}
              </div>
            )}
          </div>

          <div style={{ padding: '10px 24px 24px', display: 'flex', gap: 10 }}>
            <button
              onClick={() => reset()}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                boxShadow: '0 4px 20px rgba(245,158,11,0.35)',
              }}
            >
              Try again
            </button>
            <button
              onClick={() => location.reload()}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(210,230,255,0.85)',
                border: '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
