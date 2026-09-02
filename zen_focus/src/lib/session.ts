import { createClient } from '@/lib/supabase/client'
import type { FocusSession } from '@/types'

const ACTIVE_SESSION_KEY = 'ZEN_active_session'

export interface ActiveSessionData {
  id: string
  title: string
  plannedDuration: number
  breakDuration: number
  background: string
  startedAt: number
  pausedAt: number | null
  pausedDuration: number
  status: 'focusing' | 'paused' | 'break' | 'completed'
  breakStartedAt: number | null
  userId?: string
}

function getActiveKey(userId?: string) {
  return userId ? `${ACTIVE_SESSION_KEY}_${userId}` : ACTIVE_SESSION_KEY
}

export function saveActiveSession(data: ActiveSessionData) {
  if (typeof window === 'undefined') return
  try {
    const key = getActiveKey(data.userId)
    localStorage.setItem(key, JSON.stringify(data))
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(data))
  } catch {}
}

export function loadActiveSession(userId?: string): ActiveSessionData | null {
  if (typeof window === 'undefined') return null
  try {
    const key = getActiveKey(userId)
    const raw = localStorage.getItem(key) || localStorage.getItem(ACTIVE_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ActiveSessionData
    if (userId && parsed.userId && parsed.userId !== userId) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearActiveSession(userId?: string) {
  if (typeof window === 'undefined') return
  try {
    if (userId) {
      localStorage.removeItem(getActiveKey(userId))
    }
    localStorage.removeItem(ACTIVE_SESSION_KEY)
  } catch {}
}

export function getRemainingSeconds(session: ActiveSessionData): number {
  const now = Date.now()
  const elapsed = (now - session.startedAt) / 1000
  const focusing = elapsed - session.pausedDuration
  const remaining = session.plannedDuration - focusing
  return Math.max(0, remaining)
}

export function getElapsedFocusSeconds(session: ActiveSessionData): number {
  const now = Date.now()
  const elapsed = (now - session.startedAt) / 1000
  return Math.min(session.plannedDuration, Math.max(0, elapsed - session.pausedDuration))
}

export function getBreakRemainingSeconds(session: ActiveSessionData): number {
  if (!session.breakStartedAt) return session.breakDuration
  const elapsed = (Date.now() - session.breakStartedAt) / 1000
  return Math.max(0, session.breakDuration - elapsed)
}

export async function createDbSession(params: {
  title: string
  plannedDuration: number
  breakDuration: number
  background: string
  startedAt: Date
}): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : null
    }

    const { data, error } = await supabase
      .from('focus_sessions')
      .insert({
        user_id: user.id,
        title: params.title,
        planned_duration: params.plannedDuration,
        break_duration: params.breakDuration,
        background: params.background,
        started_at: params.startedAt.toISOString(),
        status: 'active',
        paused_duration: 0,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating database focus session:', error)
      return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : null
    }

    return data?.id ?? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : null)
  } catch (err) {
    console.error('Exception in createDbSession:', err)
    return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : null
  }
}

export async function pauseDbSession(id: string, pausedDuration: number) {
  try {
    const supabase = createClient()
    await supabase
      .from('focus_sessions')
      .update({
        status: 'paused',
        paused_duration: Math.round(pausedDuration),
      })
      .eq('id', id)
  } catch {}
}

export async function resumeDbSession(id: string) {
  try {
    const supabase = createClient()
    await supabase
      .from('focus_sessions')
      .update({
        status: 'active',
      })
      .eq('id', id)
  } catch {}
}

export async function completeDbSession(id: string, actualDuration: number, pausedDuration: number) {
  const roundedActual = Math.round(actualDuration)
  const roundedPaused = Math.round(pausedDuration)
  const nowStr = new Date().toISOString()

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('focus_sessions')
      .update({
        status: 'completed',
        actual_duration: roundedActual,
        paused_duration: roundedPaused,
        ended_at: nowStr,
      })
      .eq('id', id)
      .select('id')

    if (error || !data || data.length === 0) {
      await supabase.from('focus_sessions').insert({
        id,
        user_id: user.id,
        title: 'Focus Session',
        planned_duration: roundedActual,
        actual_duration: roundedActual,
        break_duration: 0,
        background: 'bg4',
        started_at: nowStr,
        ended_at: nowStr,
        status: 'completed',
        paused_duration: roundedPaused,
      })
    }
  } catch (err) {
    console.error('Exception in completeDbSession:', err)
  }
}

export async function endEarlyDbSession(id: string, actualDuration: number, pausedDuration: number) {
  const roundedActual = Math.round(actualDuration)
  const roundedPaused = Math.round(pausedDuration)
  const nowStr = new Date().toISOString()

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('focus_sessions')
      .update({
        status: 'ended_early',
        actual_duration: roundedActual,
        paused_duration: roundedPaused,
        ended_at: nowStr,
      })
      .eq('id', id)
      .select('id')

    if (error || !data || data.length === 0) {
      await supabase.from('focus_sessions').insert({
        id,
        user_id: user.id,
        title: 'Focus Session',
        planned_duration: roundedActual,
        actual_duration: roundedActual,
        break_duration: 0,
        background: 'bg4',
        started_at: nowStr,
        ended_at: nowStr,
        status: 'ended_early',
        paused_duration: roundedPaused,
      })
    }
  } catch (err) {
    console.error('Exception in endEarlyDbSession:', err)
  }
}

export function calculateStreak(sessions: FocusSession[]): { current: number; longest: number; totalDays: number } {
  const completedSessions = sessions.filter(
    s => (s.status === 'completed' || s.status === 'ended_early') &&
      ((s.actual_duration ?? s.planned_duration ?? 0) > 0)
  )

  if (completedSessions.length === 0) {
    return { current: 0, longest: 0, totalDays: 0 }
  }

  const daySet = new Set<string>()
  for (const s of completedSessions) {
    const localDate = new Date(s.started_at).toLocaleDateString('en-CA')
    daySet.add(localDate)
  }

  const days = Array.from(daySet).sort()
  const totalDays = days.length

  let longest = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1])
    const curr = new Date(days[i])
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000)
    if (diff === 1) {
      run++
      longest = Math.max(longest, run)
    } else {
      run = 1
    }
  }

  const todayStr = new Date().toLocaleDateString('en-CA')
  const yDate = new Date()
  yDate.setDate(yDate.getDate() - 1)
  const yesterdayStr = yDate.toLocaleDateString('en-CA')

  let current = 0
  const lastDay = days[days.length - 1]

  if (lastDay === todayStr || lastDay === yesterdayStr) {
    current = 1
    for (let i = days.length - 2; i >= 0; i--) {
      const next = new Date(days[i + 1])
      const curr2 = new Date(days[i])
      const diff = Math.round((next.getTime() - curr2.getTime()) / 86400000)
      if (diff === 1) {
        current++
      } else {
        break
      }
    }
  }

  return { current, longest, totalDays }
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) {
    return `${h}h ${m}m`
  }
  if (m > 0) {
    return `${m}m`
  }
  return `${s}s`
}

export function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
