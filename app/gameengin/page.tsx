// SURFACE: dreamsurface.Gameengin  (framework-mandated basename: page.tsx)
import { redirect } from 'next/navigation';

/**
 * /gameengin → /gameengin/cartridges
 *
 * The root of the GameEngin URL family routes straight into the cartridge
 * catalogue so users discover the platform's library in one click.
 */
export default function GameEnginIndexPage(: never) {
  redirect('/gameengin/cartridges');
}
