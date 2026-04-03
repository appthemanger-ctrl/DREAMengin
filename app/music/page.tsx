import { redirect } from 'next/navigation';
import { connection } from 'next/server';

/**
 * Legacy music route — redirects to canonical Music Daydream.
 *
 * Per docs/ARCHITECTURE.md §2 and docs/PRODUCT_DEFINITION.md, the canonical
 * Music surface is the Music Daydream / StarMakerEngin pair at /daydream/music.
 * This route redirects to maintain backward compatibility.
 */

export default async function MusicLegacyPage() {
  await connection();
  redirect('/daydream/music');
}
