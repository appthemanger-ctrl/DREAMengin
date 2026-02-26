import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, Trophy, Users, Swords } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Games Daydream – DREAMengin',
  description: 'Play, challenge, and compete within your DREAMengin space.',
};

export default async function GamesDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const capabilities = [
    { icon: Gamepad2, label: 'Arcade', description: 'Browser-native mini-games, no installs.' },
    { icon: Swords, label: 'Challenges', description: 'Head-to-head challenges with other users.' },
    { icon: Trophy, label: 'Leaderboards', description: 'Track your scores and achievements.' },
    { icon: Users, label: 'Co-op', description: 'Invite friends into shared game spaces.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Games</h1>
          <span className="ml-auto text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
            Daydream
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8">
        {/* Hero */}
        <div className="mb-8 rounded-2xl border border-border bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Games Daydream</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Play, compete, and build gaming experiences directly inside your space.
            No separate app required.
          </p>
        </div>

        {/* Capabilities */}
        <div className="space-y-3">
          {capabilities.map(({ icon: Icon, label, description }) => (
            <div
              key={label}
              className="bg-card rounded-2xl border border-border p-4 flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full shrink-0 self-center">
                Coming soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
