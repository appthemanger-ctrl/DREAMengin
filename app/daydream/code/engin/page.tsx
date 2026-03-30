import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Redirect to the standalone CodeEngin app. */
export default function CodeEnginRedirectPage() {
  redirect('/engines/code');
}
