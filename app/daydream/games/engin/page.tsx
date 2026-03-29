// Canonical Side B (GameEngin) entry point for the Games Daydream (spec §6).
// Redirects to /daydream/games?openEngin=1 so DaydreamShell auto-flips to Side B.
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'GameEngin – DREAMengin', description: 'Games Daydream control layer.' };

export default function GamesEnginPage() {
  redirect('/daydream/games?openEngin=1');
}
