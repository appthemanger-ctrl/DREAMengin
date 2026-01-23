export default function Landing() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="glass p-10 w-full max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-extrabold">✨ DREAMengin</h1>
        <p className="text-white/80">Your dreampage — paste links, drag widgets, pick colors. No complexity.</p>
        <div className="flex items-center justify-center gap-4">
          <a href="/login" className="btn-primary">Login / Sign up</a>
          <a href="/home" className="btn bg-white/10">Enter Home</a>
        </div>
      </div>
    </main>
  )
}
