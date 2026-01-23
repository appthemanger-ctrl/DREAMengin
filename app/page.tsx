
import Link from "next/link";

export default function Landing(){
  return (
    <main className="min-h-[80vh] grid place-items-center p-6">
      <div className="glass w-full max-w-xl px-8 py-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
          <span className="block">Dreampage</span>
          <span className="block">— your home on the internet</span>
        </h1>
        <p className="opacity-80 mb-8">
          Private-by-default. Calm. Composable. Make it yours in minutes.
        </p>

        <div className="flex gap-3 justify-center">
          <Link href="/login" className="btn-outline">Create account</Link>
          <Link href="/home" className="btn">Continue as guest</Link>
        </div>

        <p className="text-xs opacity-70 mt-8">
          By continuing you accept our Terms &amp; Privacy.
        </p>
      </div>
    </main>
  );
}
