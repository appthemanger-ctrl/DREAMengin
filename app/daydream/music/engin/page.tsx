import { redirect } from 'next/navigation';
import { connection } from 'next/server';


/** Redirect to the standalone StarMakerEngin app. */
export default async function MusicEnginRedirectPage() {
  await connection();
  redirect('/engines/music');
}
