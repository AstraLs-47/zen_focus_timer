'use client'

import { formatDuration } from '@/lib/session'
import { getBackground } from '@/types'
import type { FocusSession } from '@/types'
import { format } from 'date-fns'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'

interface Props {
  sessions: FocusSession[]
}

export default function RecentSessions({ sessions }: Props) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-stone-200 rounded-2xl bg-[#FAF8F5]/50">
        <div className="text-3xl mb-2">🌱</div>
        <p className="text-stone-700 text-xs font-semibold">Your focus journey starts here.</p>
        <p className="text-stone-400 text-[11px] mt-0.5">No sessions yet — start your first one above.</p>
      </div>
    )
  }

  const now = new Date()
  const today = now.toLocaleDateString('en-CA')
  const yDate = new Date(now)
  yDate.setDate(yDate.getDate() - 1)
  const yesterday = yDate.toLocaleDateString('en-CA')

  const groups: Record<string, FocusSession[]> = {}
  for (const s of sessions) {
    const day = new Date(s.started_at).toLocaleDateString('en-CA')
    if (!groups[day]) groups[day] = []
    groups[day].push(s)
  }

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([day, daySessions]) => {
        const label = day === today ? 'Today' : day === yesterday ? 'Yesterday' : format(new Date(day), 'MMMM d')
        return (
          <div key={day}>
            <p className="text-stone-400 text-[11px] uppercase tracking-wider font-semibold mb-2">{label}</p>
            <div className="space-y-2">
              {daySessions.map(session => {
                const bg = getBackground(session.background)
                const completed = session.status === 'completed'
                const endedEarly = session.status === 'ended_early'
                const time = format(new Date(session.started_at), 'HH:mm')
                const duration = session.actual_duration ?? session.planned_duration

                return (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 bg-[#FAF8F5] border border-stone-200/80 rounded-2xl px-4 py-3 hover:border-stone-300 transition-colors shadow-2xs"
                  >
                    {bg.isColorTheme || !bg.file ? (
                      <div className="w-9 h-9 rounded-xl flex-shrink-0 bg-[#2C4436] flex items-center justify-center text-white text-xs">
                        🌲
                      </div>
                    ) : (
                      <div
                        className="w-9 h-9 rounded-xl flex-shrink-0 bg-cover bg-center border border-stone-200/50"
                        style={{ backgroundImage: `url(${bg.file})` }}
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-stone-900 text-xs sm:text-sm font-semibold truncate">{session.title || 'Focus session'}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-stone-500 text-[11px]">
                        <span>{time}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} className="text-stone-400" />
                          {formatDuration(duration)}
                        </span>
                        <span>·</span>
                        <span className="truncate">{bg.name}</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {completed && <CheckCircle2 size={16} className="text-[#2C4436]" />}
                      {endedEarly && <XCircle size={16} className="text-stone-400" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
