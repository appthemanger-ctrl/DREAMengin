import "../styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Dynamic Dream Fusion",
  description: "Converted to Next.js 16.1.4"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
