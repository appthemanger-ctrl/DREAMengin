'use client';

import { Suspense, useEffect, useState } from 'react';
import ThemeProvider from '@/components/providers/dream.ThemeProvider';
import ThemeApplicator from '@/components/dream.ThemeApplicator';
import { DreamSystemProvider } from '@/lib/dreamdm/DreamSystemContext';
import DualRuntimeContainer from '@/components/runtime/dream.DualRuntimeContainer';
import { CustomizeModeProvider } from '@/lib/ui/CustomizeModeContext';
import GodTierProvider from '@/components/providers/dream.GodTierProvider';
import CommandPalette from '@/components/dream.CommandPalette';
import GlobalOverlays from '@/components/dream.GlobalOverlays';
import { OSProvider } from '@/lib/dreamenginOS/OSContext';
import { isPublicSurfacePath } from '@/lib/routing/surfaces';

export default function AppSurfaceShell() { children }: { children: React.ReactNode } {
  const [pathname, setPathname] = useState<string | null>(null);

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  if (isPublicSurfacePath(pathname)) {
    return <main role="main" aria-label="Main content">{children}</main>;
  }

  return (
    <ThemeProvider>
      <ThemeApplicator />
      <Suspense><GodTierProvider /></Suspense>
      <OSProvider>
        <CustomizeModeProvider>
          <DreamSystemProvider>
            <DualRuntimeContainer>
              <main role="main" aria-label="Main content">{children}</main>
              <GlobalOverlays />
              <Suspense><CommandPalette /></Suspense>
            </DualRuntimeContainer>
          </DreamSystemProvider>
        </CustomizeModeProvider>
      </OSProvider>
    </ThemeProvider>
  );
}
