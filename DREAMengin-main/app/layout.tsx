import { inter } from '@/lib/theme/fonts'

export const metadata = { title: 'DREAMengin' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
