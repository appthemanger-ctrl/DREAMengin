import { redirect } from 'next/navigation';

/**
 * Legacy play daydream route — repurposed to the Music Daydream.
 *
 * Playback is a core capability of the Music Daydream / StarMakerEngin.
 * Per docs/ARCHITECTURE.md §9 and COPILOT_TOOLKIT.md: "Rename and repurpose
 * before rebuilding." This route now forwards traffic to /daydream/music.
 */
export default function PlayLegacyPage() {
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Play Daydream – Dreamengin', description: 'Your saved music and videos in one immersive space.' };

export default function PlayDaydreamLegacyPage() {
  // Play/listening is part of Music Daydream / StarMakerEngin (README §8.1).
  // Redirect to Music Daydream.
  redirect('/daydream/music');
}
