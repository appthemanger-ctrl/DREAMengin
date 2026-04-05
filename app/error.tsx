'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Route error:', error)
  }, [error])

  return (
    <div
      className="min-h-[70vh] flex items-center justify-center px-6"
      style={{
        background: 'linear-gradient(148deg, var(--de-theme-from, #e9ecf1) 0%, var(--de-theme-mid, #f0f2f6) 55%, var(--de-theme-to, #f7f3ec) 100%)',
      }}
    >
      <div
        style={{
          width: 'min(28rem, 92vw)',
          background: 'var(--de-glass, rgba(255,255,255,0.60))',
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          border: '1px solid var(--de-border, rgba(180,185,200,0.35))',
          borderRadius: 24,
          padding: '32px 28px',
          boxShadow: '0 12px 40px rgba(19,29,44,0.10), inset 0 1px 0 rgba(255,255,255,0.84)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Red accent top */}
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: 'linear-gradient(90deg, transparent, rgba(220,68,68,0.5) 30%, rgba(200,152,26,0.4) 70%, transparent)',
          }}
          aria-hidden="true"
        />

        {/* Error icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'rgba(220,68,68,0.08)',
            border: '1px solid rgba(220,68,68,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            fontSize: 22,
          }}
          aria-hidden="true"
        >
          ⚠
        </div>

        <h2
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--de-heading, #0f1e34)',
            letterSpacing: '-0.02em',
            marginBottom: 8,
            lineHeight: 1.3,
          }}
        >
          Something cracked in the dream.
        </h2>

        <p
          style={{
            fontSize: 14,
            color: 'var(--de-text-dim)',
            lineHeight: 1.7,
            marginBottom: 16,
          }}
        >
          The page hit an error. Your session and data are safe — this is just the UI tripping.
        </p>

        {error?.message && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(220,68,68,0.05)',
              border: '1px solid rgba(220,68,68,0.14)',
              color: '#b91c1c',
              fontSize: 12,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              lineHeight: 1.6,
              wordBreak: 'break-all',
              marginBottom: 20,
            }}
          >
            {error.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => reset()}
            className="de-btn de-btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="de-btn de-btn-ghost"
            style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
