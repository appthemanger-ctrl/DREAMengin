// SURFACE: dreamsurface.DaydreamAnalytics  (framework-mandated basename: page.tsx)
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/dream.shell.DaydreamShell';
import AnalyticsDaydream from '@/components/daydream/dreamsurface.daydream.AnalyticsDaydream';
import AuthenticatedPageHeader from '@/components/ui/dream.AuthenticatedPageHeader';
import { isDevBypassActive } from '@/lib/dev-bypass';
import { createServerClient } from '@/lib/supabase/server';
import { BarChart2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

// Stream 8.3 — Bundle split: AnalyticsEngin only loads when Side B mounts.
const AnalyticsEngin = dynamic(() => import('@/engins/dream.panel.AnalyticsEngin'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366f1]" />
    </div>
  ),
});

export const metadata = {
  title: 'Analytics Daydream – DREAMengin',
  description: 'Your activity metrics, AQS, and platform insights.',
};

const ACCENT = '#6366f1';

const WIDGETS: DaydreamWidget[] = [
  { id: 'activity',    emoji: '⚡', label: 'My Activity',   desc: 'AQS · Activity points · Tier', color: '#6366f1' },
  { id: 'views',       emoji: '👁️', label: 'View Metrics',  desc: 'Total views · Views per post', color: '#38bdf8' },
  { id: 'real-shit',   emoji: '🔥', label: 'Real Shit Rate', desc: 'Verified content quality',     color: '#f59e0b' },
  { id: 'posts',       emoji: '📝', label: 'Posts',          desc: 'Total · Verified · Reach',     color: '#22c55e' },
  { id: 'create',      emoji: '✍️', label: 'Create',         desc: 'Post to boost your metrics',   color: '#ec4899', href: '/daydream/create' },
  { id: 'brand',       emoji: '🎨', label: 'Brand',          desc: 'View brand analytics',         color: '#f472b6', href: '/daydream/brand' },
  { id: 'profile',     emoji: '👤', label: 'Public Profile', desc: 'See what others see',          color: '#2a8ab8', href: '/view-profile' },
];

export default async function AnalyticsDaydreamPage( ){
  await connection();
  const supabase = await createServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch { /* Supabase not configured — treat as unauthenticated */ }
  if (!user && !isDevBypassActive()) redirect('/login');

  return (
    <DaydreamShell
      title="Analytics"
      enginName="AnalyticsEngin"
      accentColor={ACCENT}
      daydreamType="analytics"
      widgets={WIDGETS}
      sideBComponent={AnalyticsEngin}
    >
      <div className="de-sky-bg min-h-screen">
        <AuthenticatedPageHeader
          backHref="/homedream"
          title="Analytics"
          subtitle="Activity Quality Score · Real Shit Rate · verified views · 30-day insights."
          icon={<BarChart2 className="w-4 h-4" />}
          accentColor={ACCENT}
          badge="Analytics Daydream · Activity-First 2026"
        />

        <AnalyticsDaydream userId={user?.id ?? ''} />
      </div>
    </DaydreamShell>
  );
}