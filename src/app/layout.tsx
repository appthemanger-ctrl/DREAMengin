import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'DREAMengin — Build Your Future',
  description: 'The decentralized creative platform for dreamers and builders.',
  icons: { icon: '/logo-icon.png', apple: '/logo-icon.png' },
  openGraph: {
    title: 'DREAMengin',
    description: 'The decentralized creative platform for dreamers and builders.',
    images: ['/logo.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-de-sheet text-slate-200 antialiased">
        {children}
      </body>
    </html>
  )
}
