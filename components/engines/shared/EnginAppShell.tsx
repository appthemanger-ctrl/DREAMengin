'use client';

/**
 * EnginAppShell — Full-screen immersive shell for all six DREAMengin engines.
 *
 * Each engine is a standalone app-within-the-app: full viewport, dedicated nav,
 * isolated context, escape hatch back to the main platform.
 *
 * Design tokens:
 *   accentColor  → used for the top accent stripe, active links, glow effects
 *   engineName   → displayed in the header bar
 *   engineEmoji  → visual identity in the header
 */

import { type ReactNode, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, ChevronLeft } from 'lucide-react';

export interface EnginAppShellProps {
  engineName: string;
  engineEmoji: string;
  accentColor: string;
  backHref: string;
  backLabel?: string;
  nav?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function EnginAppShell({
  engineName,
  engineEmoji,
  accentColor,
  backHref,
  backLabel = 'Daydream',
  nav,
  children,
  className = '',
}: EnginAppShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);

  // Suppress main app scroll / footer while engine is mounted
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const footer = document.querySelector('footer') as HTMLElement | null;
    const prevFooterDisplay = footer?.style.display ?? '';
    if (footer) footer.style.display = 'none';
    const header = document.querySelector('header') as HTMLElement | null;
    const prevHeaderDisplay = header?.style.display ?? '';
    if (header) header.style.display = 'none';
    return () => {
      document.body.style.overflow = prevOverflow;
      if (footer) footer.style.display = prevFooterDisplay;
      if (header) header.style.display = prevHeaderDisplay;
    };
  }, []);

  return (
    <div
      ref={shellRef}
      className={`fixed inset-0 z-[200] flex flex-col bg-[#0a0a0f] text-white ${className}`}
      style={{ '--engin-accent': accentColor } as React.CSSProperties}
    >
      {/* Accent stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
      />

      {/* Top bar */}
      <header className="de-engin-shell-header relative z-10 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#0e0e18]/90 backdrop-blur-sm">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          <ChevronLeft size={14} />
          {backLabel}
        </Link>

        <div className="flex items-center gap-2 ml-2">
          <span className="text-xl leading-none">{engineEmoji}</span>
          <span
            className="text-sm font-bold tracking-widest uppercase"
            style={{ color: accentColor }}
          >
            {engineName}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {nav}
          <Link
            href={backHref}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            title={`Exit ${engineName}`}
          >
            <X size={14} className="text-white/60" />
          </Link>
        </div>
      </header>

      {/* Engine content */}
      <main className="relative flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
