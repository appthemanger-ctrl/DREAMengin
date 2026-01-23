import './globals.css'
import { Inter, Sora } from 'next/font/google'
import Providers from '../components/Providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const sora = Sora({ subsets: ['latin'], variable: '--font-sora' })

export const metadata = {
  title: 'DREAMengin',
  description: 'Your home on the internet.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-ink text-white p-2 rounded">
          Skip to main
        </a>
        <Providers>
          <div id="main">{children}</div>
        </Providers>
      </body>
    </html>
  )
}
