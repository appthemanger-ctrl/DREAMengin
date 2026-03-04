import Link from "next/link";
import { DreamEnginLogo } from "@/components/DreamEnginLogo";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 py-16">
      {/* Hero — animated logo */}
      <section className="flex flex-col items-center gap-8 text-center">
        <DreamEnginLogo width={480} height={240} />

        <div className="flex flex-col items-center gap-3">
          <p className="max-w-md text-base leading-7 text-zinc-400">
            Your customizable UI OS&nbsp;— widget space, social feed, and
            AI&nbsp;triad in one premium shell.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/home"
            className="inline-flex h-12 min-w-[140px] items-center justify-center rounded-full bg-amber-400 px-6 text-sm font-semibold text-black transition hover:bg-amber-300"
          >
            Enter&nbsp;DREAMengin
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex h-12 min-w-[140px] items-center justify-center rounded-full border border-white/10 px-6 text-sm font-medium text-zinc-300 transition hover:border-white/30 hover:text-white"
          >
            Marketplace
          </Link>
        </div>
      </section>
    </main>
  );
}

