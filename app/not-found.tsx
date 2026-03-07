import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="de-sky-bg min-h-screen flex items-center justify-center px-4">
      <div className="de-sheet text-center" style={{ width: 'min(24rem, 92vw)', padding: '40px 32px' }}>
        {/* Infinity stamp */}
        <div style={{ fontSize: 48, marginBottom: 8, opacity: 0.15 }}>∞</div>
        <div style={{ fontSize: 56, fontWeight: 900, color: 'var(--de-heading)', lineHeight: 1 }}>404</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--de-heading)', marginTop: 8 }}>Page not found</div>
        <p style={{ fontSize: 13, color: 'var(--de-text-dim)', marginTop: 8, marginBottom: 24, lineHeight: 1.6 }}>
          This page doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href="/homedream" className="de-btn de-btn-primary" style={{ justifyContent: 'center' }}>Go to HomeDream</Link>
          <Link href="/discover" className="de-btn de-btn-ghost" style={{ justifyContent: 'center' }}>Search Profiles</Link>
        </div>
      </div>
    </div>
  )
}
