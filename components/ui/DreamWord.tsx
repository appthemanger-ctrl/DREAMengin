/**
 * DreamWord — renders the word "Dream" with the platform's metallic gold
 * Cormorant-italic treatment (.de-dream-word).
 *
 * Usage:
 *   import DreamWord from '@/components/ui/DreamWord';
 *
 *   // Prefix: suffix keeps its own font
 *   <h1><DreamWord />DM</h1>
 *
 *   // Suffix: prefix keeps its own font
 *   <h1>Home<DreamWord /></h1>
 *
 *   // Stand-alone
 *   <h1><DreamWord />Shop</h1>
 *
 * Works in both server components and client components — no hooks, no state.
 */
export default function DreamWord() {
  return <span className="de-dream-word">Dream</span>;
}
