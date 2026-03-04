import Image from 'next/image'
import Link from 'next/link'
import { UserPlus, Check } from 'lucide-react'

const perks = ['Free forever plan','AI tools included','Real revenue share','No lock-in']

export default function Join() {
  return (
    <div className="min-h-screen bg-sky-gradient flex items-center justify-center px-4">
      <div className="de-card p-8 w-full max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <Image src="/logo_transparent.png" alt="DREAMengin" width={120} height={40} className="object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-1">Create your account</h1>
        <p className="text-slate-400 text-center text-sm mb-6">Join 50K+ creators building their dream</p>
        <ul className="flex flex-wrap gap-2 justify-center mb-6">
          {perks.map(p => (
            <li key={p} className="flex items-center gap-1 text-xs text-de-sky"><Check size={12}/> {p}</li>
          ))}
        </ul>
        <div className="space-y-4">
          <input type="text"     className="de-input" placeholder="Username" />
          <input type="email"    className="de-input" placeholder="Email" />
          <input type="password" className="de-input" placeholder="Password" />
          <button type="button" className="de-btn-gold w-full justify-center py-3">
            <UserPlus size={16}/> Create Account
          </button>
        </div>
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-de-sky hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
