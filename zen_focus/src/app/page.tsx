import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Clock, Compass } from 'lucide-react'
import ZenLogo from '@/components/ui/ZenLogo'

export const metadata = {
  title: 'ZEN — Your Personal Focus Sanctuary',
  description: 'Enter a calm focus session, stay productive with immersive natural environments, and build a daily deep work habit.',
}

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div
      className="min-h-screen relative flex flex-col justify-between p-6 sm:p-10 select-none overflow-x-hidden"
      style={{
        backgroundImage: 'url(/backgrounds/bg10.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-[0.5px]" />

      <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#C4DEC9] shadow-md group-hover:scale-105 transition-transform backdrop-blur-md">
            <ZenLogo size={22} color="#C4DEC9" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">ZEN</span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-stone-200 hover:text-white text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-full hover:bg-white/10 transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="bg-[#2C4436] hover:bg-[#23382C] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 border border-white/10"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="relative z-10 w-full max-w-3xl mx-auto text-center my-auto px-4 py-12">
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-6 animate-fade-up leading-[1.12]">
          Focus deeply. <br />
          <span className="font-serif italic font-normal text-[#C4DEC9]">
            Work in peace.
          </span>
        </h1>

        <p
          className="text-stone-200/90 text-sm sm:text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed animate-fade-up font-light"
          style={{ animationDelay: '0.1s' }}
        >
          Your personal sanctuary for deep work. Set custom focus timers, enjoy soothing natural backgrounds, and build an intentional daily habit.
        </p>

        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto animate-fade-up"
          style={{ animationDelay: '0.15s' }}
        >
          <Link
            href="/register"
            className="w-full sm:flex-1 bg-[#2C4436] hover:bg-[#23382C] text-white font-semibold py-3.5 px-7 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/30 cursor-pointer active:scale-98 hover:translate-y-[-1px]"
          >
            <span>Get Started</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="w-full sm:flex-1 bg-white/15 hover:bg-white/25 text-white border border-white/25 font-medium py-3.5 px-7 rounded-2xl text-sm transition-all backdrop-blur-md text-center cursor-pointer active:scale-98 hover:translate-y-[-1px]"
          >
            Sign In
          </Link>
        </div>

        {user && (
          <div className="mt-8 animate-fade-up">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs text-stone-300 hover:text-white bg-black/40 hover:bg-black/60 border border-white/15 px-4 py-2 rounded-full backdrop-blur-md transition-all shadow-sm group"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>You are signed in — <strong>Go to Dashboard</strong></span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-14 text-left max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white">
            <Clock size={18} className="text-[#C4DEC9] mb-2" />
            <h3 className="text-xs font-semibold text-white mb-1">Custom Timers</h3>
            <p className="text-[11px] text-stone-300 leading-normal">Tailor your focus and break intervals to match your personal rhythm.</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white">
            <Compass size={18} className="text-[#C4DEC9] mb-2" />
            <h3 className="text-xs font-semibold text-white mb-1">Calming Themes</h3>
            <p className="text-[11px] text-stone-300 leading-normal">Explore high-res nature backdrops that help you create a peaceful space for focused work.</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white">
            <ShieldCheck size={18} className="text-[#C4DEC9] mb-2" />
            <h3 className="text-xs font-semibold text-white mb-1">Habit Tracking</h3>
            <p className="text-[11px] text-stone-300 leading-normal">Track daily streaks, and historical statistics.</p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full text-center text-stone-400 text-xs py-3 flex flex-col sm:flex-row items-center justify-between max-w-5xl mx-auto border-t border-white/10 mt-6">
        <p>© {new Date().getFullYear()} ZEN. Distraction-free focus sanctuary.</p>
        <div className="flex items-center gap-4 mt-2 sm:mt-0 text-stone-300 text-xs">
          <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          <span>•</span>
          <Link href="/register" className="hover:text-white transition-colors">Get Started</Link>
        </div>
      </footer>
    </div>
  )
}
