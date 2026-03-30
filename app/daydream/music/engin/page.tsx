import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Redirect to the standalone StarMakerEngin app. */
export default function MusicEnginRedirectPage() {
  redirect('/engines/music');
}
