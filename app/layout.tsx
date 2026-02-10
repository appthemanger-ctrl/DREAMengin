import '@/styles/globals.css';
import '@/components/v1-ui/widget-feed-screen.css';
import type { Metadata, Viewport } from "next";
import NavBar from "@/components/NavBar";
import MobileNavBarEnhanced from "@/components/MobileNavBarEnhanced";
import AIAssistantEnhanced from "@/components/AIAssistantEnhanced";
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
  let session = null;
  let isAdmin = false;
  
  try {
    const supabase = await createServerClient();
    const { data } = await supabase.auth.getSession();
    session = data?.session ?? null;
    
    // Check if user is admin
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      isAdmin = session.user.user_metadata?.role === 'admin' || profile?.handle === 'admin';
    }
  } catch {
    // Supabase not configured - app will still render but without auth features
    console.warn('[v0] Supabase not configured or unavailable');
  }

  return (
    <html lang="en" className="scroll-smooth bg-background dark:bg-background" suppressHydrationWarning>
      <body className="font-sans bg-background text-foreground transition-colors antialiased dream-bg">
        {/* Desktop Nav */}
        <div className="hidden md:block">
          {session && <NavBar session={session} />}
        </div>
        {/* Mobile Nav */}
        <div className="md:hidden">
          {session && <MobileNavBarEnhanced session={session} />}
        </div>
        
        {/* Main content with proper spacing for nav bars */}
        <main className={session ? 'md:pt-0 pb-safe' : ''}>
          {children}
        </main>
        
        {/* AI Assistants - available when logged in */}
        {session && <AIAssistantEnhanced />}
        {session && <InnerDreamsButton isAdmin={isAdmin} />}
        {session && <AnchorWidgetOrchestrator />}
      </body>
    </html>
  );
}
