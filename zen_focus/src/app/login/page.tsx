'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import ZenLogo from '@/components/ui/ZenLogo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()
    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative p-4 select-none"
      style={{
        backgroundImage: 'url(/backgrounds/bg10.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-[0.5px]" />

      <Link
        href="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 text-white/90 hover:text-white text-xs font-semibold bg-black/40 hover:bg-black/60 border border-white/20 px-4 py-2 rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer hover:scale-105"
        title="Back to Home"
      >
        <ArrowLeft size={15} />
        <span>Back to Home</span>
      </Link>

      <div className="relative z-10 w-full max-w-md my-8">
        <div className="text-center mb-6 animate-fade-up">
          <div className="inline-flex items-center gap-2.5 mb-3 bg-black/40 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full shadow-md">
            <ZenLogo size={20} color="#C4DEC9" />
            <span className="text-white text-xs font-semibold tracking-tight">ZEN</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif text-white tracking-tight font-normal">
            Welcome back
          </h1>
          <p className="text-stone-300/90 text-xs sm:text-sm mt-1 font-sans">
            Your personal focus sanctuary is waiting.
          </p>
        </div>

        <div className="bg-stone-950/40 backdrop-blur-2xl rounded-3xl p-7 sm:p-9 border border-white/15 shadow-2xl shadow-black/50 animate-scale-in text-white">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-950/60 border border-red-500/30 rounded-2xl px-4 py-3 text-red-200 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-stone-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-white/[0.08] hover:bg-white/[0.12] border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-stone-400 text-sm focus:outline-none focus:bg-white/[0.15] focus:border-[#C4DEC9] focus:ring-1 focus:ring-[#C4DEC9]/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-stone-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/[0.08] hover:bg-white/[0.12] border border-white/20 rounded-2xl px-4 py-3 pr-12 text-white placeholder-stone-400 text-sm focus:outline-none focus:bg-white/[0.15] focus:border-[#C4DEC9] focus:ring-1 focus:ring-[#C4DEC9]/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-[#2C4436] hover:bg-[#23382C] text-white font-semibold rounded-2xl py-3.5 text-sm transition-all duration-200 shadow-xl shadow-black/40 border border-white/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2 active:scale-98"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{loading ? 'Signing in…' : 'Sign in'}</span>
            </button>
          </form>

          <p className="text-center text-stone-300 text-xs sm:text-sm mt-6">
            No account yet?{' '}
            <Link
              href="/register"
              className="text-[#C4DEC9] hover:text-white font-semibold underline underline-offset-2 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
