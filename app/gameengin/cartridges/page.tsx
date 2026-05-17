// SURFACE: dreamsurface.GameenginCartridges  (framework-mandated basename: page.tsx)
import type { Metadata } from 'next';
import CartridgeBrowser from '@/components/gameengin/dream.cartridge.CartridgeBrowser';

export const metadata: Metadata = {
  title: 'GameEngin · Cartridges',
  description:
    'Every game in DREAMengin, packaged as a GameEngin cartridge running on the single console-class browser platform.',
};

export default function GameEnginCartridgesPage() {
  return <CartridgeBrowser />;
}
