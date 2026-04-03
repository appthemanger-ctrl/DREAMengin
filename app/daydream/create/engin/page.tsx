import { redirect } from 'next/navigation';
import { connection } from 'next/server';


/** Redirect to the standalone ContentEngin app. */
export default async function CreateEnginRedirectPage() {
  await connection();
  redirect('/engines/create');
}
