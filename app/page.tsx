import type { Metadata } from 'next';
import LandingHero from '@/components/LandingHero';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'DREAMengin — Your personal creative operating surface',
  description:
    'A spatial, privacy-first creative OS. Navigate your digital world as layered dreams. ' +
    'Powered by Dr. Eams, IDARi, and TheBoogieMan.Ai.',
  openGraph: {
    title: 'DREAMengin',
    description:
      'Navigate your digital world as layered dreams. A spatial, privacy-first creative OS.',
    siteName: 'DREAMengin',
    type: 'website',
  },
};

export default function Root() {
  return <LandingHero />;
}
