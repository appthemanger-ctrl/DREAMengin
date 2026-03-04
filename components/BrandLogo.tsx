'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getRandomLogo, LOGO_PATHS } from '@/lib/branding/logos';

type Props = {
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
};

/**
 * BrandLogo — renders one of the three brand logos, chosen once per page load.
 *
 * SSR always renders the first logo (stable placeholder) so there is no
 * hydration mismatch. The client picks the randomised logo on mount.
 * Fixed width/height prevent layout shift.
 */
export default function BrandLogo({
  width = 40,
  height = 40,
  alt = 'DREAMengin',
  className = '',
}: Props) {
  // Stable SSR value – avoids hydration mismatch.
  const [src, setSrc] = useState<string>(LOGO_PATHS[0]);

  useEffect(() => {
    setSrc(getRandomLogo());
  }, []);

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ width, height, objectFit: 'contain' }}
      priority
    />
  );
}
