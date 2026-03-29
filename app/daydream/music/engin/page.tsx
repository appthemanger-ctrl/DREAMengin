// Canonical Side B (StarMakerEngin) entry point for the Music Daydream (spec §6).
// Redirects to /daydream/music?openEngin=1 so DaydreamShell auto-flips to Side B.
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'StarMakerEngin – DREAMengin', description: 'Music Daydream control layer.' };

export default function MusicEnginPage() {
  redirect('/daydream/music?openEngin=1');
}
