'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import ThemeProvider from '@/components/providers/dream.ThemeProvider';
import ThemeApplicator from '@/components/dream.ThemeApplicator';
import { DreamSystemProvider } from '@/lib/dreamdm/DreamSystemContext';
import DualRuntimeContainer from '@/components/runtime/dream.DualRuntimeContainer';
import GlobalDreamBar from '@/components/home/dream.bar.GlobalDreamBar';
import PersistentDreamBar from '@/components/home/dream.bar.PersistentDreamBar';
import { CustomizeModeProvider } from '@/lib/ui/CustomizeModeContext';
import GodTierProvider from '@/components/providers/dream.GodTierProvider';
import CommandPalette from '@/components/dream.CommandPalette';
import GlobalOverlays from '@/components/dream.GlobalOverlays';
import OSShellActivator from '@/components/dream.OSShellActivator';
import { OSProvider } from '@/lib/dreamenginOS/OSContext';
import { isPublicSurfacePath } from '@/lib/routing/surfaces';

export default function AppSurfaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
              <Suspense><GlobalDreamBar /></Suspense>
              <Suspense><PersistentDreamBar /></Suspense>
              <Suspense><OSShellActivator /></Suspense>
              <GlobalOverlays />
              <Suspense><CommandPalette /></Suspense>
            </DualRuntimeContainer>
          </DreamSystemProvider>
        </CustomizeModeProvider>
      </OSProvider>
    </ThemeProvider>
  );
}
