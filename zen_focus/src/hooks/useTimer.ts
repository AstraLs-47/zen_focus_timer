'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type ActiveSessionData,
  saveActiveSession,
  clearActiveSession,
  getRemainingSeconds,
  getElapsedFocusSeconds,
  getBreakRemainingSeconds,
  pauseDbSession,
  resumeDbSession,
  completeDbSession,
  endEarlyDbSession,
} from '@/lib/session'

export type TimerPhase = 'focusing' | 'paused' | 'break' | 'completed' | 'break_done'

interface UseTimerReturn {
  phase: TimerPhase
  remainingSeconds: number
  elapsedSeconds: number
  breakRemainingSeconds: number
  pause: () => void
  resume: () => void
  endEarly: () => Promise<void>
  completeSession: () => Promise<void>
  skipBreak: () => void
}

export function useTimer(
  session: ActiveSessionData | null,
  onSessionComplete: () => void,
  onBreakComplete: () => void
): UseTimerReturn {
  const [phase, setPhase] = useState<TimerPhase>(() => {
    return session?.status === 'paused' ? 'paused' :
      session?.status === 'break'  ? 'break' :
      session?.status === 'completed' ? 'completed' : 'focusing'
  })

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (!session) return 0
    return getRemainingSeconds(session)
  })

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)

  const [breakRemaining, setBreakRemaining] = useState<number>(() => {
    return session ? session.breakDuration : 0
  })

  const sessionRef = useRef<ActiveSessionData | null>(session)
  const rafRef = useRef<number | null>(null)
  const phaseRef = useRef<TimerPhase>(phase)
  const dbSavedRef = useRef<boolean>(false)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { sessionRef.current = session }, [session])

  useEffect(() => {
    if (phase !== 'focusing' && phase !== 'break') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    const loop = () => {
      const s = sessionRef.current
      if (!s) return

      const currentPhase = phaseRef.current

      if (currentPhase === 'focusing') {
        const remaining = getRemainingSeconds(s)
        const elapsed   = getElapsedFocusSeconds(s)
        setRemainingSeconds(remaining)
        setElapsedSeconds(elapsed)

        if (remaining <= 0) {
          if (!dbSavedRef.current) {
            dbSavedRef.current = true
            completeDbSession(s.id, elapsed || s.plannedDuration, s.pausedDuration)
          }

          if (s.breakDuration > 0) {
            const updated: ActiveSessionData = {
              ...s,
              status: 'break',
              breakStartedAt: Date.now(),
            }
            sessionRef.current = updated
            saveActiveSession(updated)
            setBreakRemaining(s.breakDuration)
            setPhase('break')
            phaseRef.current = 'break'
            onSessionComplete()
          } else {
            setPhase('completed')
            phaseRef.current = 'completed'
            clearActiveSession(s.userId)
            onSessionComplete()
            return
          }
        }
      } else if (currentPhase === 'break') {
        const bRemaining = getBreakRemainingSeconds(s)
        setBreakRemaining(bRemaining)
        if (bRemaining <= 0) {
          setPhase('break_done')
          phaseRef.current = 'break_done'
          clearActiveSession(s.userId)
          onBreakComplete()
          return
        }
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [phase, onSessionComplete, onBreakComplete])

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && sessionRef.current) {
        const s = sessionRef.current
        if (phaseRef.current === 'focusing') {
          setRemainingSeconds(getRemainingSeconds(s))
          setElapsedSeconds(getElapsedFocusSeconds(s))
        } else if (phaseRef.current === 'break') {
          setBreakRemaining(getBreakRemainingSeconds(s))
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const pause = useCallback(() => {
    const s = sessionRef.current
    if (!s || phaseRef.current !== 'focusing') return
    const updated: ActiveSessionData = { ...s, status: 'paused', pausedAt: Date.now() }
    sessionRef.current = updated
    saveActiveSession(updated)
    setPhase('paused')
    pauseDbSession(s.id, s.pausedDuration)
  }, [])

  const resume = useCallback(() => {
    const s = sessionRef.current
    if (!s || phaseRef.current !== 'paused' || !s.pausedAt) return
    const additionalPaused = (Date.now() - s.pausedAt) / 1000
    const updated: ActiveSessionData = {
      ...s,
      status: 'focusing',
      pausedAt: null,
      pausedDuration: s.pausedDuration + additionalPaused,
    }
    sessionRef.current = updated
    saveActiveSession(updated)
    setPhase('focusing')
    resumeDbSession(s.id)
  }, [])

  const endEarly = useCallback(async () => {
    const s = sessionRef.current
    if (!s) return
    const elapsed = getElapsedFocusSeconds(s)
    const totalPaused = s.pausedDuration + (s.pausedAt ? (Date.now() - s.pausedAt) / 1000 : 0)
    await endEarlyDbSession(s.id, elapsed, totalPaused)
    clearActiveSession(s.userId)
  }, [])

  const completeSession = useCallback(async () => {
    const s = sessionRef.current
    if (!s) return
    if (!dbSavedRef.current) {
      dbSavedRef.current = true
      await completeDbSession(s.id, s.plannedDuration, s.pausedDuration)
    }
    clearActiveSession(s.userId)
  }, [])

  const skipBreak = useCallback(() => {
    const s = sessionRef.current
    setPhase('break_done')
    if (s) clearActiveSession(s.userId)
    onBreakComplete()
  }, [onBreakComplete])

  return {
    phase,
    remainingSeconds,
    elapsedSeconds,
    breakRemainingSeconds: breakRemaining,
    pause,
    resume,
    endEarly,
    completeSession,
    skipBreak,
  }
}
