// app/layout.tsx (drop-in replacement or manual diff)
// - Adds `import "@/styles/extra.css"`
// - Adds `colorflow` class to <html> so the animated gradient is enabled.

import "@/styles/globals.css";
import "@/styles/extra.css";
import NavBar from "@/components/NavBar";
import { supaServer } from "@/lib/supabase/server";
import type { ReactNode } from "react";

export const metadata = {
  title: "DREAMengin",
  description: "Dream feed + widgets",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const s = supaServer ? await supaServer() : null as any;
  let htmlClass = "dark"; // keep your dark by default; add 'colorflow' below

  return (
    <html lang="en" className={htmlClass + " colorflow"} suppressHydrationWarning>
      <body>
        {/* Server component navbar is fine in Next 16 */}
        {/* If you had a ts-expect-error here, remove it. */}
        <NavBar />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}