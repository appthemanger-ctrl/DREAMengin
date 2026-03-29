// Canonical Side B (CodeEngin) entry point for the Code Daydream (spec §6).
// Redirects to /daydream/code?openEngin=1 so DaydreamShell auto-flips to Side B.
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'CodeEngin – DREAMengin', description: 'Code Daydream control layer.' };

export default function CodeEnginPage() {
  redirect('/daydream/code?openEngin=1');
}
