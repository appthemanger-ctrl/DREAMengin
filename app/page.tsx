import type { Metadata } from 'next';
import LandingHero from '@/components/LandingHero';

// ── No `force-dynamic` — this page has zero server-side data dependencies.
// Next.js will statically generate it at build time, allowing CDN caching and
// eliminating a full SSR round-trip on every visitor request.
// Architecture justification: ARCHITECTURE.md §10 (build/runtime assumptions —
// prefer static where possible); THEME.md (performance is a design value).

// Resolve the site origin from env so OG image URLs are absolute.
// Falls back to the production domain when the env var is absent (CI / prod).
// Use || (not ??) so an empty-string env var falls back to the default URL;
// new URL('') would otherwise throw a TypeError during server-side rendering.
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dreamengin.com';

export const metadata: Metadata = {
  // metadataBase makes relative OG/Twitter image paths resolve to absolute URLs.
  metadataBase: new URL(SITE_URL),

  title: 'DREAMengin — Your personal creative operating surface',
  description:
    'A spatial, privacy-first creative OS. Navigate your digital world as layered dreams. ' +
    'Powered by Dr. Eams, IDARi, and TheBoogieMan.Ai.',

  // Explicit robots directive — the public landing page should be fully indexed.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },

  // Canonical URL (avoids duplicate-content penalties if served on multiple origins).
  alternates: {
    canonical: '/',
  },

  openGraph: {
    title: 'DREAMengin — Your personal creative operating surface',
    description:
      'Navigate your digital world as layered dreams. A spatial, privacy-first creative OS.',
    siteName: 'DREAMengin',
    type: 'website',
    url: '/',
    // Add /og-image.png to /public when a branded share image is available.
  },

  // Twitter / X card — without this, X falls back to a plain link with no preview.
  twitter: {
    card: 'summary_large_image',
    title: 'DREAMengin — Your personal creative operating surface',
    description:
      'Navigate your digital world as layered dreams. A spatial, privacy-first creative OS.',
    // Add twitterImage: '/og-image.png' once the asset exists in /public.
  },
};

export default function Root() {
  return <LandingHero />;
}
