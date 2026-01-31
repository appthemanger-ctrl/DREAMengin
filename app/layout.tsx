import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals-enhanced.css";
import NavBar from "@/components/NavBar";
import AIAssistantEnhanced from "@/components/AIAssistantEnhanced";
import InnerDreamsButton from "@/components/InnerDreamsButton";
import { createServerClient } from "@/lib/supabase/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DREAMengin - Your Creative Platform",
  description: "A unified creator platform for social feed, content aggregation, monetization, and scientific collaboration",
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check if user is admin
  let isAdmin = false;
  if (session?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    isAdmin = session.user.user_metadata?.role === 'admin' || profile?.handle === 'admin';
  }

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-slate-50 dark:bg-slate-950 transition-colors`}>
        <NavBar session={session} />
        {children}
        {session && <AIAssistantEnhanced />}
        {session && <InnerDreamsButton isAdmin={isAdmin} />}
      </body>
    </html>
  );
}
