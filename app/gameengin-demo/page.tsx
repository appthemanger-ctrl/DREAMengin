import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GameEnginDemo from '@/components/gameengin/GameEnginDemo';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'GameEngin Demo – DREAMengin',
  description: 'WebGPU-powered game engine with DualSense support',
};

/**
 * GameEngin demo page
 *
 * Showcases the new WebGPU-based game engine with:
 * - High-performance WebGPU rendering
 * - DualSense controller support (Bluetooth + USB)
 * - Two demo games: Neon Drift and Echo Arena
 * - TensorFlow.js learning engine
 */
export default async function GameEnginDemoPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Link
        href="/daydream/games"
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: 'rgba(0,0,0,0.8)',
          color: '#0ff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        <ArrowLeft size={18} />
        Back to Games
      </Link>
      <GameEnginDemo />
    </div>
  );
}
