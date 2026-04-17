import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CartridgeLauncher from '@/components/gameengin/CartridgeLauncher';
import {
  CARTRIDGE_MANIFEST,
  getCartridgeManifest,
} from '@/engins/gameengin/cartridges/manifest';

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return CARTRIDGE_MANIFEST.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const manifest = getCartridgeManifest(id);
  if (!manifest) {
    return { title: 'Cartridge not found · GameEngin' };
  }
  return {
    title: `${manifest.label} · GameEngin Cartridge`,
    description: manifest.description,
  };
}

export default async function GameEnginCartridgePage({ params }: PageProps) {
  const { id } = await params;
  const manifest = getCartridgeManifest(id);
  if (!manifest) notFound();
  return <CartridgeLauncher manifest={manifest} />;
}
