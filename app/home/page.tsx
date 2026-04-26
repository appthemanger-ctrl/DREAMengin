// SURFACE: dreamsurface.Home  (framework-mandated basename: page.tsx)
//
// /home is the canonical entry point for authenticated users. It renders the
// full DreamBarDataBridge (auth + data) so PersistentDreamBar activates the
// three critical surfaces in order of importance:
//   1. DreamDMBar  — the seam / primary interactive surface
//   2. HomeDream   — the top Surface Space runtime
//   3. DreamSpace  — the bottom runtime
//
// Implementation: re-exports the homedream page component so both /home and
// /homedream share identical server-side logic without duplication.
export { default } from '@/app/homedream/page';
