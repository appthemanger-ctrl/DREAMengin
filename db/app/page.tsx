
import Link from 'next/link'
export default function Landing(){
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="glass p-10 max-w-xl w-full text-center">
        <h1 className="text-4xl font-bold mb-3">Dreampage — your home on the internet</h1>
        <p className="opacity-80 mb-6">Private-by-default. Calm. Composable. Make it yours in minutes.</p>
        <div className="flex gap-3 justify-center">
          <Link className="btn-primary" href="/login">Create account</Link>
          <Link className="btn" href="/home">Continue as guest</Link>
        </div>
        <p className="text-xs opacity-70 mt-6">By continuing you accept our Terms & Privacy.</p>
      </div>
    </main>
  )
}
