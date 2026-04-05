import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Palette } from 'lucide-react';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import BrandingEngin from '@/components/daydream/BrandingEngin';
import BrandDaydreamDashboard from '@/components/daydream/BrandDaydreamDashboard';
import AuthenticatedPageHeader from '@/components/ui/AuthenticatedPageHeader';
import { connection } from 'next/server';

export const metadata = { title: 'Brand Daydream – Dreamengin', description: 'Build and manage your personal brand identity.' };

const ACCENT = '#ec4899';

const WIDGETS: DaydreamWidget[] = [
  { id: 'post',      emoji: '📢', label: 'New Post',     desc: 'Create and share content',    color: '#ec4899', href: '/daydream/create' },
  { id: 'profile',   emoji: '👤', label: 'Edit ProfileDream', desc: 'Update your public presence', color: '#2a8ab8', href: '/edit-profiledream' },
  { id: 'analytics', emoji: '📊', label: 'Analytics',    desc: 'Track your reach and growth', color: '#6366f1', href: '/daydream/analytics' },
  { id: 'appearance',emoji: '🎨', label: 'Appearance',   desc: 'Gradient theme and style',    color: '#f59e0b', href: '/settings/appearance' },
  { id: 'connectors',emoji: '🔌', label: 'Social Links', desc: 'Connect your platforms',      color: '#0ea5e9', href: '/connectors' },
  { id: 'view',      emoji: '🌐', label: 'View Profile', desc: 'See what visitors see',       color: '#22c55e', href: '/view-profile' },
  { id: 'shop',      emoji: '🛍️', label: 'Your Shop',    desc: 'Sell products and services',  color: '#c8981a', href: '/shop' },
  { id: 'music',     emoji: '🎵', label: 'Music Studio', desc: 'Your artist side',            color: '#8b5cf6', href: '/daydream/music' },
];

export default async function BrandDaydreamPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <DaydreamShell
      title="Brand"
      enginName="BrandingEngin"
      accentColor={ACCENT}
      daydreamType="brand"
      widgets={WIDGETS}
      sideBComponent={BrandingEngin}
    >
    <div className="de-sky-bg min-h-screen">
      <AuthenticatedPageHeader
        backHref="/homedream"
        title="Brand"
        subtitle="Identity, profile projection, scheduling, and visual polish in one premium brand surface."
        icon={<Palette className="w-4 h-4" />}
        accentColor="#ec4899"
        badge="Daydream"
      />

      <BrandDaydreamDashboard />

    </div>
    </DaydreamShell>
  );
}
