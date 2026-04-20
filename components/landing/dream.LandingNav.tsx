'use client';

import Link from 'next/link';

/**
 * LandingNav — minimal top bar for the landing page.
 * Wordmark on the left, Sign In on the right. No mid-nav links.
 */
export default function LandingNav() {
  return (
    <nav
      className="relative z-20 flex items-center justify-between px-6 md:px-10"
      style={{
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        paddingBottom: 16,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
      aria-label="Site navigation"
    >
      <Link
        href="/"
        className="select-none flex items-baseline gap-0"
        aria-label="DREAMengin — home"
        style={{
          fontFamily: 'var(--font-cormorant, Georgia, serif)',
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 24,
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        <span
          style={{
            background: 'linear-gradient(135deg, #e8d090 0%, #c8981a 60%, #a07820 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          dream
        </span>
        <span style={{ color: 'rgba(220,235,255,0.65)' }}>engin</span>
      </Link>

      <Link
        href="/login"
        className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold rounded-full"
        style={{
          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
          color: 'white',
          boxShadow: '0 4px 20px rgba(245,158,11,0.35)',
          letterSpacing: '0.01em',
          textDecoration: 'none',
        }}
      >
        Sign In
      </Link>
    </nav>
  );
}
