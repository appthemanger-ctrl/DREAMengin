// SURFACE: dreamsurface.GameenginCartridgesId  (framework-mandated basename: page.tsx)
import CartridgeLauncher from '@/components/gameengin/dream.cartridge.CartridgeLauncher';
import { getCartridgeManifest } from '@/lib/gameengin/cartridges/manifest';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Cartridge launcher trees pull in client-only game modules whose SSR
// paths are non-deterministic (Math.random in audio engines, particle
// seeds, id generators, etc.). Under Next.js 16 Cache Components, that
// fails the strict prerender check on this route. We render this route
// on demand instead of at build time by reading request data via
// `connection()` inside the page — the same dynamic-route pattern used
// elsewhere in the repo (see app/lab/[id]/page.tsx). Static metadata is
// provided by the parent /gameengin/cartridges page and refined per
// cartridge at runtime by the launcher itself; we intentionally do not
// implement `generateMetadata` here, because exporting one would force
// Next to prerender a metadata shell for the dynamic [id] segment and
// re-trigger the Math.random violation surfaced from `Next.MetadataOutlet`.

export default async function GameEnginCartridgePage({ params }: PageProps) {
  // Mark this render as request-only so the strict Cache-Components
  // prerender check is bypassed for the client-component subtree below.
  await connection();
  const { id } = await params;
  const manifest = getCartridgeManifest(id);
  if (!manifest) notFound();
  return <CartridgeLauncher manifest={manifest} />;
}
