import { redirect } from 'next/navigation';

/**
 * /dreamdmbar — canonical entry point.
 * Redirects immediately to the HomeDream surface so navigating
 * directly to the bar route always lands on the live home surface.
 */
export default function DreamDMBarPage( ){
  redirect('/dreamdmbar/homedream');
}