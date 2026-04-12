'use client';

import { useRouter } from 'next/navigation';
import GameEngin from '@/engins/GameEngin';
import StarMakerEngin from '@/engins/StarMakerEngin';
import LabEngin from '@/engins/LabEngin';
import CodeEngin from '@/engins/CodeEngin';
import BrandingEngin from '@/engins/BrandingEngin';
import ContentEngin from '@/engins/ContentEngin';
import ForgeEngin from '@/engins/ForgeEngin';

const ENGIN_COMPONENTS = {
  StarMakerEngin,
  GameEngin,
  LabEngin,
  CodeEngin,
  BrandingEngin,
  ContentEngin,
  ForgeEngin,
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
