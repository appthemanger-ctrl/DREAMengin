// SURFACE: dreamsurface.Webgpu  (framework-mandated basename: page.tsx)
import type { Metadata } from 'next';
import WebGPUShowcase from '@/components/webgpu/dream.WebGPUShowcase';

export const metadata: Metadata = {
  title: 'WebGPU — DREAMengin',
  description: 'Top-line GPU performance. WebGPU-accelerated games, daydreams, engines and messaging.',
};

export default function WebGPUPage( {
  return <WebGPUShowcase />;
}
