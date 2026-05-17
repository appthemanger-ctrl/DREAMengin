'use client';

// SURFACE: dream.shell.GlobalOverlays
//
// Client-side wrapper that lazy-loads the four global overlay surfaces that
// were previously declared inline in `app/layout.tsx`. In Next.js 16 the
// `ssr: false` option of `next/dynamic` is forbidden inside Server
// Components (App Router server boundary), so the dynamic() calls must live
// in a Client Component. This wrapper keeps the public-paint critical path
// light by deferring decorative / admin-only surfaces until after hydration,
// which preserves the H1 perf intent that the original inline imports had.

import dynamic from 'next/dynamic';

const GlobalCustomizeUI = dynamic(
  () => import('@/components/customize/dream.GlobalCustomizeUI'),
  { ssr: false, loading: () => null },
);

const GlobalDreamDragLayer = dynamic(
  () => import('@/components/dreams/dream.GlobalDragLayer'),
  { ssr: false, loading: () => null },
);

const PlatformErrorReporter = dynamic(
  () => import('@/components/dreams/dream.PlatformErrorReporter'),
  { ssr: false, loading: () => null },
);

const KonamiDream = dynamic(() => import('@/components/dream.KonamiDream'), {
  ssr: false,
  loading: () => null,
});

export default function GlobalOverlays( ){
  return (
    <>
      <GlobalCustomizeUI />
      <GlobalDreamDragLayer />
      <PlatformErrorReporter />
      <KonamiDream />
    </>
  );
}