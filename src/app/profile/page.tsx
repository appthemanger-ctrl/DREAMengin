import Link from "next/link";

export default function ProfilePage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-black px-4 py-8">
      <header className="mb-8 w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-white">Profile Dream</h1>
        <p className="text-sm text-zinc-500">Private editing surface</p>
      </header>

      <section className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <h2 className="mb-4 text-lg font-semibold text-white">Edit Profile</h2>
        <p className="text-zinc-400 mb-6">
          Changes saved here are mirrored to your{" "}
          <Link href="/u/me" className="underline text-amber-400">
            public profile
          </Link>
          .
        </p>
        <button
          type="button"
          className="rounded-full bg-amber-400 px-6 py-2 text-sm font-semibold text-black hover:bg-amber-300"
        >
          Save &amp; Publish
        </button>
      </section>
    </main>
  );
}
