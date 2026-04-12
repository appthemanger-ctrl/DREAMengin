import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Space_Grotesk, Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import ThemeProvider from '@/components/providers/ThemeProvider';
import ThemeApplicator from '@/components/ThemeApplicator';
import Link from 'next/link';
import { DreamSystemProvider } from '@/lib/dreamdm/DreamSystemContext';
import GlobalDreamBar from '@/components/home/GlobalDreamBar';
import PersistentDreamBar from '@/components/home/PersistentDreamBar';
import { CustomizeModeProvider } from '@/lib/ui/CustomizeModeContext';
import GlobalCustomizeUI from '@/components/customize/GlobalCustomizeUI';
import WarpCanvas from '@/components/warp/WarpCanvas';
import GodTierProvider from '@/components/providers/GodTierProvider';
import KonamiDream from '@/components/KonamiDream';
import CommandPalette from '@/components/CommandPalette';

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

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-dreamr',
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
      className={`scroll-smooth ${spaceGrotesk.variable} ${cormorant.variable} ${plusJakarta.variable}`}
      data-theme="dream-ice"
      suppressHydrationWarning
    >
      <body
        className="antialiased dream-bg"
        style={{ fontFamily: 'var(--font-space-grotesk, "Space Grotesk", system-ui, sans-serif)' }}
      >
        <ThemeProvider>
          <ThemeApplicator />
          <Suspense><GodTierProvider /></Suspense>
          <WarpCanvas effect="flow" maxParticles={200} spawnRate={25} opacity={0.35} />
          <CustomizeModeProvider>
            <DreamSystemProvider>
              <main role="main" aria-label="Main content">{children}</main>
              <Suspense><GlobalDreamBar /></Suspense>
              <Suspense><PersistentDreamBar /></Suspense>
              <GlobalCustomizeUI />
              <KonamiDream />
              <Suspense><CommandPalette /></Suspense>
            </DreamSystemProvider>
          </CustomizeModeProvider>

        </ThemeProvider>
      </body>
    </html>
  );
}
