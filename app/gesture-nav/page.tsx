import type { Metadata } from 'next';
import GestureNavigationDemo from '@/components/GestureNavigationDemo';

export const metadata: Metadata = {
  title: 'Gesture Navigation Demo | DREAMengin',
  description: 'Mobile-optimized gesture-driven spatial navigation',
};

export default function GestureNavPage() {
  return <GestureNavigationDemo />;
}
