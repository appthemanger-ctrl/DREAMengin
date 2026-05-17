'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface UniverseShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * UniverseShell — neutral surface wrapper for universe-mode pages.
 *
 * The starfield background was deliberately removed: only the public landing
 * page renders the universe field (see components/landing/dream.scene.UniverseField.tsx).
 * Inner surfaces stay quiet so user content reads cleanly.
 */
export function UniverseShell(){
  children,
  className,
}: UniverseShellProps) {
  return (
    <div className={cn('relative min-h-screen', className)}>
      {/* Subtle grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export default UniverseShell;