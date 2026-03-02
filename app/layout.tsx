import '@/styles/globals.css';
import '@/components/v1-ui/widget-feed-screen.css';
import type { Metadata, Viewport } from 'next';
import { Space_Grotesk } from 'next/font/google';
import ThemeProvider from '@/components/providers/ThemeProvider';
import Link from 'next/link';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DREAMengin - Your Creative Platform',
  description: 'A living interface system that turns your digital life into a navigable universe of connected spaces.',
  icons: {
    icon: '/images/logo1.PNG',
    apple: '/images/logo1.PNG',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#dce8f8' },
    { media: '(prefers-color-scheme: dark)',  color: '#020818' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${spaceGrotesk.variable}`}
      data-theme="dream-ice"
      suppressHydrationWarning
    >
      <body
        className="antialiased dream-bg"
        style={{ fontFamily: 'var(--font-space-grotesk, "Space Grotesk", system-ui, sans-serif)' }}
      >
        <ThemeProvider>
          <main>{children}</main>
          {/* Permanent policy footer (req 10) — always accessible, no login required */}
          <footer
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 9,
              pointerEvents: 'none',
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '0 12px 8px',
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
