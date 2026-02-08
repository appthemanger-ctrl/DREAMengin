import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Shield, 
  Plug, 
  Sliders, 
  LogOut,
  ChevronRight,
  Crown,
  Bot,
  ArrowLeft
} from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check admin status
  let isAdmin = false;
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    isAdmin = user.user_metadata?.role === 'admin' || profile?.handle === 'admin';
  } catch {
    // Not admin
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="space-y-4">

          {/* Admin Section - Only visible to admins */}
          {isAdmin && (
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl border border-purple-500/20 overflow-hidden">
              <div className="px-4 py-3 border-b border-purple-500/10">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Crown className="w-5 h-5 text-purple-500" />
                  Admin Access
                </h2>
              </div>
              <div className="p-2">
                <Link
                  href="/admin"
                  className="flex items-center justify-between py-3 px-3 hover:bg-purple-500/10 rounded-xl transition-colors min-h-[48px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-foreground font-medium">Admin Dashboard</span>
                      <p className="text-xs text-muted-foreground">InnerDreams AI, system management</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              </div>
            </div>
          )}

          {/* Account Section */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Account
              </h2>
            </div>
            <div className="p-2">
              <Link
                href="/edit-profile"
                className="flex items-center justify-between py-3 px-3 hover:bg-muted rounded-xl transition-colors min-h-[48px]"
              >
                <span className="text-foreground">Edit Profile</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link
                href="/settings/account"
                className="flex items-center justify-between py-3 px-3 hover:bg-muted rounded-xl transition-colors min-h-[48px]"
              >
                <span className="text-foreground">Account Information</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                Privacy & Security
              </h2>
            </div>
            <div className="p-2">
              <Link
                href="/settings/privacy"
                className="flex items-center justify-between py-3 px-3 hover:bg-muted rounded-xl transition-colors min-h-[48px]"
              >
                <span className="text-foreground">Privacy Settings</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link
                href="/settings/security"
                className="flex items-center justify-between py-3 px-3 hover:bg-muted rounded-xl transition-colors min-h-[48px]"
              >
                <span className="text-foreground">Security</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* Connectors Section */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Plug className="w-5 h-5 text-blue-500" />
                Connectors
              </h2>
            </div>
            <div className="p-2">
              <Link
                href="/connectors"
                className="flex items-center justify-between py-3 px-3 hover:bg-muted rounded-xl transition-colors min-h-[48px]"
              >
                <span className="text-foreground">Manage Connections</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link
                href="/feed-settings"
                className="flex items-center justify-between py-3 px-3 hover:bg-muted rounded-xl transition-colors min-h-[48px]"
              >
                <span className="text-foreground">Feed Rules</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Sliders className="w-5 h-5 text-orange-500" />
                Preferences
              </h2>
            </div>
            <div className="p-2">
              <Link
                href="/settings/notifications"
                className="flex items-center justify-between py-3 px-3 hover:bg-muted rounded-xl transition-colors min-h-[48px]"
              >
                <span className="text-foreground">Notifications</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link
                href="/settings/appearance"
                className="flex items-center justify-between py-3 px-3 hover:bg-muted rounded-xl transition-colors min-h-[48px]"
              >
                <span className="text-foreground">Appearance</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* Logout */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-2">
              <Link
                href="/api/auth/logout"
                className="flex items-center w-full py-3 px-3 text-destructive hover:bg-destructive/10 rounded-xl transition-colors min-h-[48px]"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
