
import './globals.css'
import type { Metadata } from 'next'
export const metadata: Metadata = { title:'DREAMengin', description:'Your calm home on the internet' }
export default function RootLayout({ children }:{ children: React.ReactNode }){ return (<html lang="en"><body>{children}</body></html>) }
