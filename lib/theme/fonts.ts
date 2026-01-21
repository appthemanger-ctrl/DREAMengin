
import { Inter, Sora, Outfit, Space_Grotesk, DM_Sans } from 'next/font/google';
export const fonts = {
  inter: Inter({ subsets: ['latin'] }),
  sora: Sora({ subsets: ['latin'] }),
  outfit: Outfit({ subsets: ['latin'] }),
  space: Space_Grotesk({ subsets: ['latin'] }),
  dmsans: DM_Sans({ subsets: ['latin'] }),
};
export type FontKey = keyof typeof fonts;
export const defaultFont: FontKey = 'inter';
export function fontClass(key?: string) {
  const k = (key || '').toLowerCase();
  return (fonts as any)[k]?.className || fonts[defaultFont].className;
}
