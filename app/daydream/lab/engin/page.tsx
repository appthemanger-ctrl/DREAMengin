// Canonical Side B (LabEngin) entry point for the Lab Daydream (spec §6).
// Redirects to /daydream/lab?openEngin=1 so DaydreamShell auto-flips to Side B.
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'LabEngin – DREAMengin', description: 'Lab Daydream control layer.' };

export default function LabEnginPage() {
  redirect('/daydream/lab?openEngin=1');
}
