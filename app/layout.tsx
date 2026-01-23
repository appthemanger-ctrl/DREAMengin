import "@/styles/globals.css";
import NavBar from "@/components/NavBar";
import type { CSSProperties, ReactNode } from "react";
import { inter } from "@/lib/theme/fonts";

export const metadata = {
  title: "DREAMengin",
  description: "Dream feed + widgets",
};

// Next 16: no need for @ts-expect-error before async/server components.
export default function RootLayout({ children }: { children: ReactNode }) {
  const htmlClass = "dark";
  const styleVars: CSSProperties = {
    // keep your CSS custom properties here
    ["--base" as any]: 1,
  } as CSSProperties;

  return (
    <html lang="en" className={htmlClass} style={styleVars} suppressHydrationWarning>
      <body className={inter?.className ?? ""}>
        <NavBar />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
