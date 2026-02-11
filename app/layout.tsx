import '@/styles/globals.css';
import '@/components/v1-ui/widget-feed-screen.css';
import type { Metadata, Viewport } from "next";
import HomeRadialNav from "@/components/HomeRadialNav";
import InnerDreamsButton from "@/components/InnerDreamsButton";
import { AnchorWidgetOrchestrator } from "@/components/AnchorWidgetOrchestrator";
import { createServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "DREAMengin - Your Creative Platform",
  description: "A living interface system that turns your digital life into a navigable universe of connected spaces.",
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050507" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gracefully handle missing Supabase config at build time
  let user = null;
  let isAdmin = false;
  
  try {
    const supabase = await createServerClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;
    
    // Check if user is admin from DB-backed user_roles table
    if (user) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      isAdmin = roleData?.role === 'admin';
    }
  } catch {
    // Supabase not configured - app will still render but without auth features
    console.warn('[v0] Supabase not configured or unavailable');
  }

  return (
    <html lang="en" className="scroll-smooth bg-background dark:bg-background" suppressHydrationWarning>
      <body className="font-sans bg-background text-foreground transition-colors antialiased dream-bg">
        <main>
          {children}
        </main>
        
        <HomeRadialNav user={user} />
        {user && <InnerDreamsButton isAdmin={isAdmin} />}
        {user && <AnchorWidgetOrchestrator />}
      </body>
    </html>
  );
}
