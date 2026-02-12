import '@/styles/globals.css';
import '@/components/v1-ui/widget-feed-screen.css';
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "DREAMengin - Your Creative Platform",
  description: "A living interface system that turns your digital life into a navigable universe of connected spaces.",
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050507" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="scroll-smooth bg-background dark:bg-background"
      suppressHydrationWarning
    >
      <body className="font-sans bg-background text-foreground transition-colors antialiased dream-bg">
        <main>{children}</main>
      </body>
    </html>
  );
}
