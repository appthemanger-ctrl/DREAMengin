'use client';

import Link from 'next/link';

/**
 * LandingNav — minimal top bar for the landing page.
 * Wordmark on the left, Sign In on the right. No mid-nav links.
 */
export default function LandingNav( {
  return (
    <nav
      className="relative z-20 flex w-full min-w-0 items-center justify-between gap-4 px-6 md:px-10"
      style={{
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        paddingBottom: 16,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxSizing: 'border-box',
      }}
      aria-label="Site navigation"
    >
      <Link
        href="/"
        className="select-none flex min-w-0 items-baseline gap-0"
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
            background:
              'linear-gradient(135deg, #f8f1df 0%, #8fd8f2 38%, #d7a62a 72%, #f2d37a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 18px rgba(143,216,242,0.18)',
          }}
        >
          dream
        </span>
        <span
          style={{
            background:
              'linear-gradient(135deg, #f8f1df 0%, #bfefff 36%, #d7a62a 76%, #fff4c7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 18px rgba(215,166,42,0.16)',
          }}
        >
          engin
        </span>
      </Link>

      <Link
        href="/login"
        className="inline-flex shrink-0 items-center justify-center px-5 py-2 text-sm font-semibold rounded-full"
        style={{
          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
          color: 'white',
          boxShadow: '0 4px 20px rgba(245,158,11,0.35)',
          letterSpacing: '0.01em',
          textDecoration: 'none',
          boxSizing: 'border-box',
        }}
      >
        Sign In
      </Link>
    </nav>
  );
}
