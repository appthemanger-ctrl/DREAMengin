'use client';

import { useRouter } from 'next/navigation';
import GameEngin from '@/components/daydream/GameEngin';
import StarMakerEngin from '@/components/daydream/StarMakerEngin';
import LabEngin from '@/components/daydream/LabEngin';
import CodeEngin from '@/components/daydream/CodeEngin';
import BrandingEngin from '@/components/daydream/BrandingEngin';
import ContentEngin from '@/components/daydream/ContentEngin';

const ENGIN_COMPONENTS = {
  StarMakerEngin,
  GameEngin,
  LabEngin,
  CodeEngin,
  BrandingEngin,
  ContentEngin,
} as const;

export type StandaloneEnginName = keyof typeof ENGIN_COMPONENTS;

type Props = {
  engin: StandaloneEnginName;
  backHref: string;
};

export default function StandaloneEnginSurface({ engin, backHref }: Props) {
  const router = useRouter();
  const EnginComponent = ENGIN_COMPONENTS[engin];

  return <EnginComponent onBack={() => router.push(backHref)} />;
}
