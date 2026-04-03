import { redirect } from 'next/navigation';
import { connection } from 'next/server';


/** Redirect to the standalone GameEngin app. */
export default async function GamesEnginRedirectPage() {
  await connection();
  redirect('/engines/games');
}
