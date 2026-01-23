'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [showMascot, setShowMascot] = useState(false)
  const supabase = supabaseBrowser()

  async function handleMagicLink(formData: FormData) {
    const email = String(formData.get('email') || '')
    if (!email) return
    await supabase.auth.signInWithOtp({ email })
    alert('Magic link sent! Check your email 📬')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass p-10 w-full max-w-md">
        {showMascot && (
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className="text-6xl text-center mb-4"
          >
            {email.includes('@') ? '😍' : '🤔'}
          </motion.div>
        )}

        <h1 className="text-3xl font-extrabold mb-6">✨ Welcome to Your Dreampage</h1>

        <form action={handleMagicLink} className="space-y-4">
          <input
            name="email"
            type="email"
            required
            placeholder="your@email.com"
            onChange={(e) => {
              setEmail(e.target.value)
              setShowMascot(true)
            }}
            className="w-full p-3 rounded-2xl bg-white/10 placeholder-white/50"
          />
          <button type="submit" className="btn-primary w-full">
            Send Magic Link
          </button>
        </form>
      </div>
    </div>
  )
}
