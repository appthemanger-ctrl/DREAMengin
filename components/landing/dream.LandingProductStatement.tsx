'use client';

import Link from 'next/link';

/**
 * LandingProductStatement — single-screen product pitch.
 *
 * Just the things that matter to a first-time visitor:
 *   • Brand kicker
 *   • One-line headline
 *   • One-sentence product statement
 *   • Sign Up + Sign In CTAs
 *
 * No animated word ticker, no platform-stat grid, no feature strip — those
 * lived in the old monolithic LandingHero and were the heaviest layout cost.
 */
export default function LandingProductStatement() {
  return (
    <div className="flex w-full min-w-0 max-w-[36rem] flex-col items-center text-center lg:items-start lg:text-left lg:max-w-[52%] lg:py-16">
      <div
        className="de-kicker mb-6"
        style={{ color: '#d4a832' }}
        aria-label="DREAMengin — Creative OS"
      >
        Creative Operating Surface
      </div>

      <h1
        id="hero-heading"
        className="font-bold tracking-tight leading-[1.04] mb-5"
        style={{
          fontSize: 'clamp(2.6rem, 6.5vw, 5rem)',
          color: 'rgba(220,235,255,0.97)',
        }}
      >
        Space to{' '}
        <span
          style={{
            background:
              'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 40%, #c8981a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          dream
        </span>
        .
      </h1>

      <p
        className="text-base md:text-lg leading-relaxed mb-8 max-w-md"
        style={{ color: 'rgba(165,195,235,0.78)' }}
      >
        A privacy-first creative browser based OS. Your world — youre rules, your dreams, and
        entirely yours.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs sm:max-w-none lg:justify-start">
        <Link
          href="/join"
          className="w-full sm:w-auto font-semibold rounded-full text-white text-center"
          style={{
            padding: '14px 32px',
            fontSize: '0.975rem',
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            boxShadow: '0 6px 28px rgba(245,158,11,0.40)',
            letterSpacing: '0.01em',
            textDecoration: 'none',
            boxSizing: 'border-box',
          }}
        >
          Sign Up and start dreaming again!. 
        </Link>
        <Link
          href="/login"
          className="w-full sm:w-auto font-medium rounded-full text-center"
          style={{
            padding: '14px 32px',
            fontSize: '0.975rem',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(200,220,255,0.88)',
            letterSpacing: '0.01em',
            textDecoration: 'none',
            boxSizing: 'border-box',
          }}
        >
          Welcome Back! 
          
        </Link>
      </div>
    </div>
  );
}
