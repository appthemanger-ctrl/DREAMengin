import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Play Daydream – Dreamengin', description: 'Your saved music and videos in one immersive space.' };

export default function PlayDaydreamLegacyPage() {
  // Play/listening is part of Music Daydream / StarMakerEngin (README §8.1).
  // Redirect to Music Daydream.
  redirect('/daydream/music');
}
