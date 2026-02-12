import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function Root() {
  // Redirect all requests to the new Dreamengin experience.
  redirect('/dreamengin');
}
