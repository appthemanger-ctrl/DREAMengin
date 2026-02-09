'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Layers, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRendererBackend } from '@/lib/webgpu';

/* Lazy-load the R3F scene so the heavy Three.js bundle is only pulled
   when the user actually visits this page. SSR is disabled because
   Three.js / WebGL need the browser's <canvas>. */
const DreamScene = dynamic(
  () => import('@/components/three/DreamScene').then((m) => m.DreamScene),
  { ssr: false },
);

/* ------------------------------------------------------------------ */
/*  Feature cards shown below the 3-D scene                            */
/* ------------------------------------------------------------------ */
const features = [
  {
    icon: Sparkles,
    title: 'GLSL Shaders',
    desc: 'Custom vertex & fragment shaders running directly on the GPU for neon glows, lightning arcs, and refraction effects – no heavy video files needed.',
  },
  {
    icon: Layers,
    title: 'React Three Fiber',
    desc: 'Declarative Three.js via React components.  The scene graph, shaders and post-processing are all expressed as JSX.',
  },
  {
    icon: Zap,
    title: 'Framer Motion',
    desc: 'Buttery-smooth entrance animations, hover states and layout transitions powered by spring physics.',
  },
  {
    icon: Monitor,
    title: 'WebGPU Ready',
    desc: 'Automatic detection of the best available GPU backend – WebGPU, WebGL 2, or WebGL – for maximum performance.',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 * i, type: 'spring', stiffness: 80, damping: 14 },
  }),
};

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */
export default function DreamEffectsPage() {
  const [backend, setBackend] = useState<string>('detecting…');

  useEffect(() => {
    getRendererBackend().then((b) => setBackend(b));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white">
      {/* Hero section */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center pt-16 pb-4 px-4"
      >
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
          Dream Effects Engine
        </h1>
        <p className="mt-3 text-gray-400 max-w-xl mx-auto">
          GLSL shaders, React Three Fiber, Refractor distortion, Framer Motion
          animations &amp; WebGPU — all running in your browser.
        </p>
        <span className="inline-block mt-3 text-xs font-mono text-gray-500 border border-gray-800 rounded-full px-3 py-1">
          GPU backend: <span className="text-cyan-400">{backend}</span>
        </span>
      </motion.header>

      {/* 3-D Canvas */}
      <motion.section
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mx-auto max-w-4xl px-4"
      >
        <div className="relative rounded-2xl overflow-hidden border border-gray-800 shadow-glow-lg bg-black/40 backdrop-blur-sm">
          <DreamScene className="h-[420px] md:h-[520px]" />
          {/* Corner label */}
          <div className="absolute top-3 right-3 text-[10px] font-mono text-gray-500 bg-black/60 rounded px-2 py-0.5">
            R3F + GLSL
          </div>
        </div>
      </motion.section>

      {/* Feature cards */}
      <section className="max-w-5xl mx-auto px-4 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={cardVariants}
            whileHover={{ y: -4, boxShadow: '0 0 30px rgba(0,255,255,0.15)' }}
            className={cn(
              'rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur p-5',
              'transition-colors hover:border-cyan-700/50',
            )}
          >
            <f.icon className="w-7 h-7 text-cyan-400 mb-3" />
            <h3 className="font-semibold text-white mb-1">{f.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
