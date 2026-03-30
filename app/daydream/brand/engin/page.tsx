import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Redirect to the standalone BrandingEngin app. */
export default function BrandEnginRedirectPage() {
  redirect('/engines/brand');
}
