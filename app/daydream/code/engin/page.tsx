import { redirect } from 'next/navigation';
import { connection } from 'next/server';


/** Redirect to the standalone CodeEngin app. */
export default async function CodeEnginRedirectPage() {
  await connection();
  redirect('/engines/code');
}
