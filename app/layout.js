import './globals.css';
import { Inter, Space_Grotesk } from 'next/font/google';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] });
const space = Space_Grotesk({ subsets: ['latin'] });

export const metadata = { title: 'DREAMengin', description: 'Your home on the internet' };

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur">
      <nav className="container h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="logo" className="h-6 w-auto animate-hue" />
          <span className="font-semibold tracking-wide">DREAMengin</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn">Login</Link>
          <Link href="/home" className="btn">Enter</Link>
        </div>
      </nav>
    </header>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.className}`}>
      <body>
        <Nav />
        <main className="container py-8">{children}</main>
        <footer className="container py-12 text-sm opacity-80">
          <div>© {new Date().getFullYear()} DREAMengin — privacy-first</div>
        </footer>
      </body>
    </html>
  );
}
