import Image from 'next/image'
import Link from 'next/link'
import { LogIn } from 'lucide-react'

export default function Login() {
  return (
    <div className="min-h-screen bg-sky-gradient flex items-center justify-center px-4">
      <div className="de-card p-8 w-full max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <Image src="/logo_transparent.png" alt="DREAMengin" width={120} height={40} className="object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-1">Welcome back</h1>
        <p className="text-slate-400 text-center text-sm mb-8">Sign in to your account</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" className="de-input" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" className="de-input" placeholder="••••••••" />
          </div>
          <button type="button" className="de-btn-primary w-full justify-center py-3">
            <LogIn size={16} /> Sign In
          </button>
        </div>
        <p className="text-center text-sm text-slate-500 mt-6">
          No account?{' '}
          <Link href="/join" className="text-de-sky hover:underline">Join free</Link>
        </p>
      </div>
    </div>
  )
}
