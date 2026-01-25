// lib/theme/fonts.ts
import { Inter, Sora, Outfit, Space_Grotesk, DM_Sans } from 'next/font/google';

export const inter  = Inter({ subsets: ['latin'], display: 'swap' });
export const sora   = Sora({ subsets: ['latin'], display: 'swap' });
export const outfit = Outfit({ subsets: ['latin'], display: 'swap' });
export const space  = Space_Grotesk({ subsets: ['latin'], display: 'swap' });
export const dmsans = DM_Sans({ subsets: ['latin'], display: 'swap' });

export const fontMap = { inter, sora, outfit, space, dmsans };
export const defaultFont: keyof typeof fontMap = 'inter';
