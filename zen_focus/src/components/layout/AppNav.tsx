'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Clock, BarChart2, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import ZenLogo from '@/components/ui/ZenLogo'

const navItems = [
  { href: '/dashboard', icon: Home,     label: 'Home' },
  { href: '/focus',     icon: Clock,    label: 'Focus' },
  { href: '/stats',     icon: BarChart2, label: 'Stats' },
  { href: '/settings',  icon: Settings, label: 'Settings' },
]

export default function AppNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const supabase = createClient()

  async function handleSignOut() {
    try {
      setLoggingOut(true)
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <>
      <nav className="hidden md:flex flex-col items-center fixed left-0 top-0 h-full w-16 lg:w-20 bg-white/90 backdrop-blur-md border-r border-stone-200/80 z-40 py-6">
        <Link href="/" className="mb-10 group" title="ZEN Sanctuary Home">
          <div className="w-10 h-10 rounded-2xl bg-[#2C4436] flex items-center justify-center text-[#FAF8F5] shadow-xs group-hover:scale-105 transition-transform">
            <ZenLogo size={24} color="#FAF8F5" />
          </div>
        </Link>

        <div className="flex flex-col gap-3 flex-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`group relative flex flex-col items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 ${
                  active
                    ? 'bg-[#DDE7E1] text-[#2C4436]'
                    : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100/80'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                <span className="absolute left-14 px-2.5 py-1 bg-stone-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md z-50">
                  {label}
                </span>
                {active && (
                  <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-4 bg-[#2C4436] rounded-full" />
                )}
              </Link>
            )
          })}
        </div>

        <button
          onClick={handleSignOut}
          disabled={loggingOut}
          title="Sign Out"
          className="group relative flex items-center justify-center w-11 h-11 rounded-2xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          <LogOut size={18} strokeWidth={1.8} />
          <span className="absolute left-14 px-2.5 py-1 bg-stone-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md z-50">
            Sign Out
          </span>
        </button>
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-stone-200/80">
        <div className="flex items-center justify-around py-2 px-3">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all ${
                  active ? 'text-[#2C4436] font-semibold' : 'text-stone-400 hover:text-stone-700'
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
                <span className="text-[10px]">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
