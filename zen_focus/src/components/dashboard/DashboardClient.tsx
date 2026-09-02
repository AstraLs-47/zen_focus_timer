'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Flame, Clock, Zap, ChevronRight, Play, Sparkles, Compass, Award } from 'lucide-react'
import type { Profile, FocusSession } from '@/types'
import { calculateStreak, formatDuration } from '@/lib/session'
import { requestNotificationPermission, fireNotification } from '@/lib/notifications'
import SessionSetupModal from '@/components/session/SessionSetupModal'
import RecentSessions from '@/components/dashboard/RecentSessions'

interface Props {
  profile: Profile
  sessions: FocusSession[]
  userEmail?: string
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getTodayStats(sessions: FocusSession[]) {
  const todayStr = new Date().toLocaleDateString('en-CA')
  const todaySessions = sessions.filter(s => {
    const d = new Date(s.started_at).toLocaleDateString('en-CA')
    return d === todayStr && (s.status === 'completed' || s.status === 'ended_early')
  })
  const totalSeconds = todaySessions.reduce((acc, s) => acc + (s.actual_duration ?? 0), 0)
  return { totalSeconds, count: todaySessions.length }
}

export default function DashboardClient({ profile, sessions, userEmail }: Props) {
  const [showSetup, setShowSetup] = useState(false)

  const streak = calculateStreak(sessions)
  const todayStats = getTodayStats(sessions)

  useEffect(() => {
    const storageKey = `zen_last_streak_${profile.user_id}`
    const lastStreakRaw = localStorage.getItem(storageKey)
    const lastStreak = lastStreakRaw !== null ? parseInt(lastStreakRaw, 10) : null

    if (lastStreak !== null && lastStreak > 0 && streak.current === 0) {
      requestNotificationPermission().then(() => {
        fireNotification(
          'ZEN noticed you disappeared. 👀',
          "Your streak has reset, but we've saved your spot. Ready for a comeback?"
        )
      })
    }

    localStorage.setItem(storageKey, String(streak.current))
  }, [])

  const rawName = (profile.name || userEmail?.split('@')[0] || 'Friend').trim()
  const firstName = rawName.split(/\s+/)[0] || 'Friend'
  const today = format(new Date(), 'EEEE, MMMM d')

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between pb-32 md:pb-24">
      <div className="w-full relative px-4 md:px-8 pt-4 md:pt-6">
        <div
          className="max-w-6xl mx-auto relative rounded-3xl overflow-hidden shadow-md border border-stone-200/80"
          style={{ height: 'clamp(260px, 34vh, 380px)' }}
        >
          <div
            className="absolute inset-0 transition-all duration-500"
            style={{
              backgroundColor: '#274435',
            }}
          />

          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_25%,_rgba(196,222,201,0.28)_0%,_transparent_55%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_90%,_rgba(44,72,56,0.65)_0%,_transparent_60%)] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none" />

          <div className="absolute -right-8 -top-12 bottom-0 w-[420px] md:w-[520px] pointer-events-none overflow-hidden select-none opacity-80">
            <svg
              className="w-full h-full text-[#C4DEC9]"
              viewBox="0 0 400 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="280" cy="190" r="170" stroke="currentColor" strokeWidth="1" strokeOpacity="0.08" strokeDasharray="6 6" />
              <circle cx="280" cy="190" r="125" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.13" />
              <circle cx="280" cy="190" r="80" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.18" />

              <path
                d="M 230 205 C 215 178 218 142 242 118 C 262 98 294 96 316 114 C 336 130 344 160 338 186"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeOpacity="0.25"
              />
              <circle cx="278" cy="165" r="4.5" fill="currentColor" fillOpacity="0.35" />
              <path d="M 278 165 V 130" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.3" />
              <path d="M 278 165 L 305 182" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.3" />
              <path
                d="M 200 220 C 225 220 245 208 270 205 C 300 201 325 214 350 210 C 325 220 300 216 272 213 C 246 210 222 224 200 220 Z"
                fill="currentColor"
                fillOpacity="0.22"
              />
            </svg>
          </div>

          <div className="absolute top-5 right-5 z-10">
            <span className="bg-black/40 backdrop-blur-md text-white text-xs font-medium px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/20">
              <Compass size={13} className="text-[#C4DEC9]" />
              <span>Forest Theme · Minimal Calm</span>
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2 text-[#C4DEC9]/90 text-[11px] sm:text-xs uppercase tracking-[0.2em] font-semibold mb-1.5 animate-fade-up">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{today}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-white tracking-tight mb-2 animate-fade-up">
                {getGreeting()}, <span className="italic font-normal text-[#C4DEC9]">{firstName}</span>
              </h1>
              <p className="text-stone-300/85 text-xs sm:text-sm font-light mb-4 max-w-md animate-fade-up hidden sm:block">
                Enter stillness and let your focus flow effortlessly today.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 animate-fade-up">
                {streak.current > 0 ? (
                  <div className="flex items-center gap-1.5 bg-[#FAF8F5]/90 text-[#9E6928] border border-[#F6E6D3] backdrop-blur-md rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-xs">
                    <Flame size={14} className="text-[#C87B28]" />
                    <span>{streak.current} day streak</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-black/40 text-white/90 border border-white/15 backdrop-blur-md rounded-full px-3.5 py-1.5 text-xs">
                    <Sparkles size={13} className="text-[#C4DEC9]" />
                    <span>Ready for your first session</span>
                  </div>
                )}

                {todayStats.totalSeconds > 0 && (
                  <div className="flex items-center gap-1.5 bg-black/40 text-white/90 border border-white/15 backdrop-blur-md rounded-full px-3.5 py-1.5 text-xs">
                    <Clock size={13} className="text-white/70" />
                    <span>{formatDuration(todayStats.totalSeconds)} focused today</span>
                  </div>
                )}

                {todayStats.count > 0 && (
                  <div className="flex items-center gap-1.5 bg-black/40 text-white/90 border border-white/15 backdrop-blur-md rounded-full px-3.5 py-1.5 text-xs">
                    <Zap size={13} className="text-white/70" />
                    <span>{todayStats.count} session{todayStats.count !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 mt-7 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200/70 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#2C4436] flex items-center gap-1.5">
                  <Sparkles size={13} /> Deep Focus Session
                </span>
                <span className="text-xs text-stone-400">21 Calming Themes</span>
              </div>

              <h2 className="text-xl md:text-2xl font-serif text-stone-900 mb-2 tracking-tight">
                Enter your focused flow state
              </h2>
              <p className="text-stone-500 text-xs md:text-sm mb-6 max-w-lg leading-relaxed font-sans">
                Choose your desired duration, pick a calming backdrop, and immerse yourself in distraction-free work.
              </p>

              <button
                id="start-focus-btn"
                onClick={() => setShowSetup(true)}
                className="w-full bg-[#2C4436] hover:bg-[#23382C] text-white font-semibold text-sm md:text-base rounded-2xl py-3.5 px-6 transition-all duration-200 shadow-md shadow-[#2C4436]/15 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Play size={17} fill="currentColor" />
                <span>Start Focus Session</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3.5">
              <div className="bg-white rounded-2xl p-4 md:p-5 text-center border border-stone-200/70 shadow-xs hover:border-[#2C4436]/40 transition-all">
                <div className="flex items-center justify-center text-[#C87B28] mb-1">
                  <Flame size={18} />
                </div>
                <p className="text-2xl md:text-3xl font-serif text-[#9E6928]">
                  {streak.current}
                </p>
                <p className="text-stone-500 text-xs font-medium mt-1">Current Streak</p>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-5 text-center border border-stone-200/70 shadow-xs hover:border-[#2C4436]/40 transition-all">
                <div className="flex items-center justify-center text-[#2C4436] mb-1">
                  <Award size={18} />
                </div>
                <p className="text-2xl md:text-3xl font-serif text-stone-900">
                  {streak.longest}
                </p>
                <p className="text-stone-500 text-xs font-medium mt-1">Longest Streak</p>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-5 text-center border border-stone-200/70 shadow-xs hover:border-[#2C4436]/40 transition-all">
                <div className="flex items-center justify-center text-[#2C4436] mb-1">
                  <Clock size={18} />
                </div>
                <p className="text-2xl md:text-3xl font-serif text-stone-900">
                  {streak.totalDays}
                </p>
                <p className="text-stone-500 text-xs font-medium mt-1">Total Days</p>
              </div>
            </div>

            <div className="bg-white border border-stone-200/70 rounded-2xl p-5 flex items-start gap-4 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-[#DDE7E1] text-[#2C4436] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                ✦
              </div>
              <div>
                <p className="text-stone-900 text-sm font-semibold">Consistency over intensity</p>
                <p className="text-stone-500 text-xs mt-1 leading-relaxed font-sans">
                  Even a single 25-minute session today keeps your focus habit alive and moves your goals forward.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-7 border border-stone-200/70 shadow-xs">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-[#2C4436]" />
                  <h2 className="text-stone-900 text-base font-semibold">Recent Sessions</h2>
                </div>
                <a
                  href="/stats"
                  className="text-[#2C4436] hover:text-[#1E3327] text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  View all <ChevronRight size={13} />
                </a>
              </div>

              <RecentSessions sessions={sessions.slice(0, 5)} />
            </div>
          </div>
        </div>
      </div>

      {showSetup && (
        <SessionSetupModal
          onClose={() => setShowSetup(false)}
        />
      )}
    </div>
  )
}
