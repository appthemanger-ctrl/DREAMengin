import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'DREAMengin — Dreampage',
  description: 'Your home on the internet',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
