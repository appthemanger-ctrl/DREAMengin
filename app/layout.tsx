// SURFACE: dream.shell.RootLayout  (framework-mandated basename: layout.tsx)
import '@/styles/globals.css';
// Stream 5.1 — View Transitions API for surface switching
import '@/styles/view-transitions.css';
// Stream 5.2 — CSS Container Queries for Dream Windows
import '@/styles/dream-shell.css';
// HomeDream surface styles: gold-button, dream-widget-card, dream-widget-empty
import '@/styles/home-dream.css';
import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Space_Grotesk, Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import ThemeProvider from '@/components/providers/dream.ThemeProvider';
import ThemeApplicator from '@/components/dream.ThemeApplicator';
import Link from 'next/link';
import { DreamSystemProvider } from '@/lib/dreamdm/DreamSystemContext';
import DualRuntimeContainer from '@/components/runtime/dream.DualRuntimeContainer';
import GlobalDreamBar from '@/components/home/dream.bar.GlobalDreamBar';
import PersistentDreamBar from '@/components/home/dream.bar.PersistentDreamBar';
import { CustomizeModeProvider } from '@/lib/ui/CustomizeModeContext';
import GodTierProvider from '@/components/providers/dream.GodTierProvider';
// CommandPalette is statically imported because tests/integration-wiring.test.ts
// pins both the import statement and the <CommandPalette /> JSX usage in this
// file. Other heavy globals are lazy-loaded below via next/dynamic to keep
// public surfaces (/, /login, /policy) light on first paint.
import CommandPalette from '@/components/dream.CommandPalette';
import GlobalOverlays from '@/components/dream.GlobalOverlays';
import OSShellActivator from '@/components/dream.OSShellActivator';
import { OSProvider } from '@/lib/dreamenginOS/OSContext';

// ── Lazy-loaded global overlays ──
// The four `ssr: false` dynamic() imports live in `@/components/dream.GlobalOverlays`
// (a Client Component) because Next.js 16 disallows `ssr: false` in Server
// Components. The wrapper preserves the original H1 intent: each overlay is
// decorative or admin-only and never required for first paint.

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
  // Stream 6.1 — Web App Manifest (PWA support)
  manifest: '/manifest.webmanifest',
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
          <OSProvider>
            <CustomizeModeProvider>
              <DreamSystemProvider>
                <DualRuntimeContainer>
                  <main role="main" aria-label="Main content">{children}</main>
                  <Suspense><GlobalDreamBar /></Suspense>
                  <Suspense><PersistentDreamBar /></Suspense>
                  <Suspense><OSShellActivator /></Suspense>
                  <GlobalOverlays />
                  <Suspense><CommandPalette /></Suspense>
                </DualRuntimeContainer>
              </DreamSystemProvider>
            </CustomizeModeProvider>
          </OSProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
