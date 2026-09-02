'use client'

import { useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { FocusSession } from '@/types'
import { calculateStreak, formatDuration } from '@/lib/session'
import RecentSessions from '@/components/dashboard/RecentSessions'
import { Clock, CheckCircle2, Flame, Award, Calendar, BarChart2 } from 'lucide-react'

interface Props {
  sessions: FocusSession[]
}

const QUALIFYING = (s: FocusSession) =>
  (s.status === 'completed' || s.status === 'ended_early') && (s.actual_duration ?? 0) >= 30

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const secs = payload[0].value
    return (
      <div className="bg-white px-3 py-2 rounded-xl text-xs shadow-md border border-stone-200">
        <p className="text-stone-600 font-medium">{label}</p>
        <p className="text-[#2C4436] font-semibold">{secs ? formatDuration(secs) : 'No focus recorded'}</p>
      </div>
    )
  }
  return null
}

export default function StatsClient({ sessions }: Props) {
  const qualifiedSessions = useMemo(() => sessions.filter(QUALIFYING), [sessions])
  const streak = useMemo(() => calculateStreak(sessions), [sessions])

  const totalSeconds = useMemo(
    () => qualifiedSessions.reduce((acc, s) => acc + (s.actual_duration ?? 0), 0),
    [qualifiedSessions]
  )

  const weekData = useMemo(() => {
    const days: { label: string; seconds: number; isToday: boolean }[] = []
    const todayStr = new Date().toLocaleDateString('en-CA')
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = date.toLocaleDateString('en-CA')
      const daySeconds = qualifiedSessions
        .filter(s => new Date(s.started_at).toLocaleDateString('en-CA') === dateStr)
        .reduce((acc, s) => acc + (s.actual_duration ?? 0), 0)
      days.push({
        label: format(date, 'EEE'),
        seconds: daySeconds,
        isToday: dateStr === todayStr,
      })
    }
    return days
  }, [qualifiedSessions])

  const calendarData = useMemo(() => {
    const days: { date: string; seconds: number }[] = []
    for (let i = 83; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = date.toLocaleDateString('en-CA')
      const daySeconds = qualifiedSessions
        .filter(s => new Date(s.started_at).toLocaleDateString('en-CA') === dateStr)
        .reduce((acc, s) => acc + (s.actual_duration ?? 0), 0)
      days.push({ date: dateStr, seconds: daySeconds })
    }
    return days
  }, [qualifiedSessions])

  const maxDaySeconds = Math.max(...calendarData.map(d => d.seconds), 1)

  function calColor(seconds: number) {
    if (seconds === 0) return 'bg-stone-200/60'
    const ratio = seconds / maxDaySeconds
    if (ratio < 0.25) return 'bg-[#DDE7E1]'
    if (ratio < 0.5)  return 'bg-[#A8C7B5]'
    if (ratio < 0.75) return 'bg-[#5C896F]'
    return 'bg-[#2C4436]'
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] w-full pb-32 md:pb-24">
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8 md:pt-10">
        <div className="mb-7">
          <h1 className="text-2xl md:text-3xl font-serif text-stone-900 mb-1.5 tracking-tight">
            Your Statistics & Consistency
          </h1>
          <p className="text-stone-500 text-xs md:text-sm font-sans">
            Track your focus history, daily habits, and productivity momentum over time.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
          <StatCard
            icon={<Clock size={18} className="text-[#2C4436]" />}
            label="Total Focus Time"
            value={totalSeconds ? formatDuration(totalSeconds) : '0m'}
          />
          <StatCard
            icon={<CheckCircle2 size={18} className="text-[#2C4436]" />}
            label="Completed Sessions"
            value={qualifiedSessions.length || 0}
          />
          <StatCard
            icon={<Flame size={18} className="text-[#C87B28]" />}
            label="Current Streak"
            value={streak.current ? `${streak.current} days` : '0 days'}
            accent
          />
          <StatCard
            icon={<Award size={18} className="text-[#2C4436]" />}
            label="Longest Streak"
            value={streak.longest ? `${streak.longest} days` : '0 days'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-7">
          <div className="bg-white rounded-3xl p-6 md:p-7 border border-stone-200/70 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <BarChart2 size={17} className="text-[#2C4436]" />
                <h2 className="text-stone-900 text-base font-semibold">This Week&apos;s Focus</h2>
              </div>
              <span className="text-xs text-stone-400">Daily hours</span>
            </div>

            {weekData.every(d => d.seconds === 0) ? (
              <div className="text-center py-12">
                <p className="text-stone-400 text-xs font-sans">No focus sessions recorded this week yet.</p>
              </div>
            ) : (
              <div className="h-48 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekData} barSize={26}>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#78716c', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide tickFormatter={v => formatDuration(v)} />
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                    <Bar dataKey="seconds" radius={[6, 6, 0, 0]}>
                      {weekData.map((d, i) => (
                        <Cell
                          key={i}
                          fill={d.isToday ? '#2C4436' : d.seconds > 0 ? '#5C896F' : '#EBE7DF'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 md:p-7 border border-stone-200/70 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar size={17} className="text-[#2C4436]" />
                  <h2 className="text-stone-900 text-base font-semibold">Activity Map</h2>
                </div>
                <span className="text-xs text-stone-400">Last 12 weeks</span>
              </div>
              <p className="text-stone-500 text-xs mb-4 font-sans">Each square represents your daily focus consistency.</p>
            </div>

            <div className="flex gap-1.5 flex-wrap pt-1">
              {calendarData.map((d, i) => (
                <div
                  key={i}
                  className={`rounded-xs ${calColor(d.seconds)}`}
                  title={`${d.date}: ${d.seconds ? formatDuration(d.seconds) : 'No sessions'}`}
                  style={{ width: '13px', height: '13px' }}
                />
              ))}
            </div>

            <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-stone-100 text-xs text-stone-500 font-sans">
              <span>{calendarData.filter(d => d.seconds > 0).length} active days</span>
              <div className="flex items-center gap-1.5">
                <span>Less</span>
                {['bg-stone-200/60', 'bg-[#DDE7E1]', 'bg-[#A8C7B5]', 'bg-[#5C896F]', 'bg-[#2C4436]'].map(c => (
                  <div key={c} className={`w-3 h-3 rounded-xs ${c}`} />
                ))}
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200/70 shadow-xs">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-stone-100">
            <h2 className="text-stone-900 text-base font-semibold">All Session Records</h2>
            <span className="text-xs text-stone-400">{sessions.length} total logged</span>
          </div>
          <RecentSessions sessions={sessions.slice(0, 20)} />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-200/70 shadow-xs hover:border-[#2C4436]/40 transition-all">
      <div className="mb-2">{icon}</div>
      <p className={`text-2xl md:text-3xl font-serif mb-1 tracking-tight ${accent ? 'text-[#9E6928]' : 'text-stone-900'}`}>
        {value}
      </p>
      <p className="text-stone-500 text-xs font-medium font-sans">{label}</p>
    </div>
  )
}
