// SURFACE: dreamsurface.GameenginCartridges  (framework-mandated basename: page.tsx)
import CartridgeBrowser from '@/components/gameengin/dream.cartridge.CartridgeBrowser';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GameEngin · Cartridges',
  description:
    'Every game in DREAMengin, packaged as a GameEngin cartridge running on the single console-class browser platform.',
};

export default function GameEnginCartridgesPage( ){
  return <CartridgeBrowser />;
}