// Canonical Side B (BrandingEngin) entry point for the Brand Daydream (spec §6).
// Redirects to /daydream/brand?openEngin=1 so DaydreamShell auto-flips to Side B.
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'BrandingEngin – DREAMengin', description: 'Brand Daydream control layer.' };

export default function BrandEnginPage() {
  redirect('/daydream/brand?openEngin=1');
}
