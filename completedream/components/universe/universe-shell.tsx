'use client';

import { ReactNode } from 'react';
import { StarField } from './star-field';
import { cn } from '@/lib/utils';

interface UniverseShellProps {
  children: ReactNode;
  showStars?: boolean;
  className?: string;
}

export function UniverseShell({ 
  children, 
  showStars = true,
  className 
}: UniverseShellProps) {
  return (
    <div className={cn('relative min-h-screen', className)}>
      {/* Star field background - only in dark mode */}
      {showStars && (
        <div className="hidden dark:block">
          <StarField density="sparse" speed="slow" />
        </div>
      )}

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
