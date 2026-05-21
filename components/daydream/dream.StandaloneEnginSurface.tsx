'use client';

import ForgeEngin from '@/engins/dream.ForgeEngin';
import BrandingEngin from '@/engins/engin.BrandingEngin';
import CodeEngin from '@/engins/engin.CodeEngin';
import ContentEngin from '@/engins/engin.ContentEngin';
import GameEngin from '@/engins/engin.GameEngin';
import LabEngin from '@/engins/engin.LabEngin';
import StarMakerEngin from '@/engins/engin.StarMakerEngin';
import { useRouter } from 'next/navigation';

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
