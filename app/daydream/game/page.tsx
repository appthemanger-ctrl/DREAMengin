import ImmersiveGameShell from './ImmersiveGameShell';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Game Session – DREAMengin',
  description: 'Dedicated full-screen game session with the shared DREAMengin remote.',
};

export default function GamePage() {
  return <ImmersiveGameShell />;
}
