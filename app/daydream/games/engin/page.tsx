import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Redirect to the standalone GameEngin app. */
export default function GamesEnginRedirectPage() {
  redirect('/engines/games');
}
