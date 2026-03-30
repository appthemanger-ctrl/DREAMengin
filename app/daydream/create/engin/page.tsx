import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Redirect to the standalone ContentEngin app. */
export default function CreateEnginRedirectPage() {
  redirect('/engines/create');
}
