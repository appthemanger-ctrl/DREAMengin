import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Redirect to the standalone LabEngin app. */
export default function LabEnginRedirectPage() {
  redirect('/engines/lab');
}
