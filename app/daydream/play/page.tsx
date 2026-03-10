import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function PlayDaydreamLegacyPage() {
  // Play/listening is part of Music Daydream / StarMakerEngin (README §8.1).
  // Redirect to Music Daydream.
  redirect('/daydream/music');
}
