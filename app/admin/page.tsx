import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Bot, Send, CircleCheck, ArrowLeft, Shield, Activity, Database, Users } from 'lucide-react';
import InnerDreams from '@/components/InnerDreams';
import Link from 'next/link';

export default async function AdminPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const isAdmin = user.user_metadata?.role === 'admin' || profile?.handle === 'admin';

  if (!isAdmin) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <Bot className="w-6 h-6 text-purple-500" />
          <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-sm text-muted-foreground">Users</span>
            </div>
            <p className="text-2xl font-bold text-foreground">—</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">Status</span>
            </div>
            <p className="text-2xl font-bold text-green-500">Online</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-sm text-muted-foreground">Database</span>
            </div>
            <p className="text-2xl font-bold text-foreground">Supabase</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-sm text-muted-foreground">RLS</span>
            </div>
            <p className="text-2xl font-bold text-green-500">Active</p>
          </div>
        </div>

        {/* InnerDreams Auto-Updater */}
        <div>
          <InnerDreams userId={user.id} isAdmin={isAdmin} />
        </div>

        {/* Traditional AI Update Request */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Manual AI Update Request</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Submit a prompt describing the changes you want to make to the site. 
            The AI will generate the code changes for review.
          </p>

          <form action="/api/admin/ai-request" method="POST">
            <div className="mb-4">
              <label htmlFor="prompt" className="block text-sm font-medium text-foreground mb-2">
                Describe the changes:
              </label>
              <textarea
                id="prompt"
                name="prompt"
                rows={4}
                placeholder="Example: Add a dark mode toggle to the navbar..."
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <CircleCheck className="w-4 h-4 text-green-500" />
                Request will be logged for review
              </p>
              <button
                type="submit"
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors min-h-[44px]"
              >
                <Send className="w-4 h-4" />
                Submit Request
              </button>
            </div>
          </form>
        </div>

        {/* Recent Requests */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Requests</h2>
          <div className="space-y-3">
            <div className="border border-border rounded-xl p-4">
              <p className="text-sm text-foreground mb-2">
                &ldquo;Add a physics simulation widget to the lab page using PhET embeds&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">2 hours ago</span>
                <span className="px-2.5 py-1 text-xs bg-yellow-500/10 text-yellow-500 rounded-full font-medium">
                  Pending Review
                </span>
              </div>
            </div>
            <div className="border border-border rounded-xl p-4">
              <p className="text-sm text-foreground mb-2">
                &ldquo;Update the navbar to include a messages icon with unread count badge&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">1 day ago</span>
                <span className="px-2.5 py-1 text-xs bg-green-500/10 text-green-500 rounded-full font-medium">
                  Completed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
