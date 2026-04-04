import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background: 'linear-gradient(155deg, #070e1c 0%, #0c1829 45%, #0f2244 75%, #0a1628 100%)',
      }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          style={{
            position: 'absolute', top: '20%', left: '50%',
            transform: 'translateX(-50%)',
            width: '500px', height: '400px',
            background: 'radial-gradient(ellipse, rgba(56,189,248,0.10) 0%, transparent 65%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: '-60px', left: '30%',
            width: '400px', height: '400px',
            background: 'radial-gradient(circle, rgba(200,152,26,0.08) 0%, transparent 60%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div
        style={{
          position: 'relative',
          width: 'min(28rem, 92vw)',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(32px) saturate(170%)',
          WebkitBackdropFilter: 'blur(32px) saturate(170%)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 28,
          padding: '48px 32px 40px',
          boxShadow: '0 8px 56px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Top accent */}
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(200,152,26,0.55) 40%, rgba(56,189,248,0.35) 70%, transparent)',
          }}
          aria-hidden="true"
        />

        {/* Large 404 */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            background: 'linear-gradient(135deg, rgba(220,235,255,0.25) 0%, rgba(220,235,255,0.10) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 8,
          }}
        >
          404
        </div>

        <h1
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: 'rgba(220,235,255,0.92)',
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          Page not found
        </h1>

        <p
          style={{
            fontSize: 14,
            color: 'rgba(165,195,235,0.55)',
            lineHeight: 1.7,
            marginBottom: 32,
            maxWidth: 280,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          This page doesn&apos;t exist or has been moved. Let&apos;s get you back to your space.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '13px 28px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(245,158,11,0.35)',
              transition: 'box-shadow 0.15s ease, transform 0.1s ease',
            }}
          >
            Go Home
          </Link>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '13px 28px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(210,230,255,0.85)',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              transition: 'background 0.15s ease',
            }}
          >
            Sign In
          </Link>
        </div>

        {/* Wordmark at bottom */}
        <div
          style={{
            marginTop: 32,
            fontFamily: 'var(--font-cormorant, Georgia, serif)',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 16,
            letterSpacing: '-0.01em',
            opacity: 0.5,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              background: 'linear-gradient(135deg, #e8d090, #c8981a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            dream
          </span>
          <span style={{ color: 'rgba(220,235,255,0.45)' }}>engin</span>
        </div>
      </div>
    </div>
  )
}
