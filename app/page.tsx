import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LandingHero from "@/components/LandingHero";

export default async function Home() {
  const supabase = await createServerClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      redirect("/home");
    }
  } catch {
    // Supabase not configured - show landing page
  }

  // Show the animated landing page for unauthenticated users
  return <LandingHero />;
}
