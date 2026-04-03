import { redirect } from 'next/navigation';
import { connection } from 'next/server';


export default async function EditProfileLegacyRoutePage() {
  await connection();
  redirect('/edit-profiledream');
}
