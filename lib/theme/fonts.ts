import { Inter, Sora, Outfit, Space_Grotesk, DM_Sans } from 'next/font/google';

// Next/font requires calling the loaders at module scope and assigning to consts
export const inter = Inter({ subsets: ['latin'] });
export const sora = Sora({ subsets: ['latin'] });
export const outfit = Outfit({ subsets: ['latin'] });
export const space = Space_Grotesk({ subsets: ['latin'] });
export const dmsans = DM_Sans({ subsets: ['latin'] });

export const fonts = {
  inter,
  sora,
  outfit,
  space,
  dmsans,
} as const;

export type FontKey = keyof typeof fonts;
export const defaultFont: FontKey = 'inter';
