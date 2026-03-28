import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Cormorant_Garamond } from 'next/font/google';
import ThemeProvider from '@/components/providers/ThemeProvider';
import ThemeApplicator from '@/components/ThemeApplicator';
import Link from 'next/link';
import { DreamSystemProvider } from '@/lib/dreamdm/DreamSystemContext';
import GlobalDreamBar from '@/components/home/GlobalDreamBar';
import { CustomizeModeProvider } from '@/lib/ui/CustomizeModeContext';
import GlobalCustomizeUI from '@/components/customize/GlobalCustomizeUI';
import WarpCanvas from '@/components/warp/WarpCanvas';
import GodTierProvider from '@/components/providers/GodTierProvider';
import KonamiDream from '@/components/KonamiDream';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DREAMengin - Your Creative Platform',
  description: 'A living interface system that turns your digital life into a navigable universe of connected spaces.',
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#dce8f8' },
    { media: '(prefers-color-scheme: dark)',  color: '#020818' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${spaceGrotesk.variable} ${cormorant.variable}`}
      data-theme="dream-ice"
      suppressHydrationWarning
    >
      <body
        className="antialiased dream-bg"
        style={{ fontFamily: 'var(--font-space-grotesk, "Space Grotesk", system-ui, sans-serif)' }}
      >
        <ThemeProvider>
          <ThemeApplicator />
          <GodTierProvider />
          <WarpCanvas effect="flow" maxParticles={200} spawnRate={25} opacity={0.35} />
          <CustomizeModeProvider>
            <DreamSystemProvider>
              <main role="main" aria-label="Main content">{children}</main>
              <GlobalDreamBar />
              <GlobalCustomizeUI />
              <KonamiDream />
            </DreamSystemProvider>
          </CustomizeModeProvider>
          {/* Permanent policy footer (req 10) — always accessible, no login required */}
          {/* z-index 110: sits above DreamDMBar (100/102) so the link is always tappable */}
          <footer
            style={{
              position: 'fixed',
              bottom: 90,
              left: 0,
              right: 0,
              zIndex: 110,
              pointerEvents: 'none',
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '0 12px 0',
            }}
          >
            <Link
              href="/policy"
              style={{
                pointerEvents: 'auto',
                fontSize: 11,
                color: 'var(--de-text-dim, rgba(80,100,130,0.7))',
                textDecoration: 'none',
                padding: '3px 8px',
                borderRadius: 20,
                background: 'rgba(220,232,248,0.55)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(160,195,240,0.2)',
              }}
            >
              Policy
            </Link>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
