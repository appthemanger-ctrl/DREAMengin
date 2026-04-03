import { redirect } from 'next/navigation';
import { connection } from 'next/server';


/** Redirect to the standalone BrandingEngin app. */
export default async function BrandEnginRedirectPage() {
  await connection();
  redirect('/engines/brand');
}
