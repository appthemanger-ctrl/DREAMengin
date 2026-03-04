import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-black px-4 py-8">
      <header className="mb-8 w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-amber-400">DREAMengin</h1>
        <p className="text-sm text-zinc-500">Home Dream — Widget Space</p>
      </header>

      <section className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <h2 className="mb-4 text-lg font-semibold text-white">Home Feed</h2>
        <p className="text-zinc-400">
          Your personalised feed appears here. Connect sources in{" "}
          <Link href="/settings/feed" className="underline text-amber-400">
            Settings → Feed
          </Link>
          .
        </p>
      </section>

      <nav className="mt-8 flex flex-wrap gap-3">
        <Link href="/profile" className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:text-white">
          Profile
        </Link>
        <Link href="/marketplace" className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:text-white">
          Marketplace
        </Link>
        <Link href="/shop" className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:text-white">
          Shop
        </Link>
        <Link href="/settings" className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:text-white">
          Settings
        </Link>
      </nav>
    </main>
  );
}
