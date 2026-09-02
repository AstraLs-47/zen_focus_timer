'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  loadActiveSession,
  saveActiveSession,
  clearActiveSession,
  createDbSession,
  type ActiveSessionData,
  formatTimer,
  formatDuration,
  getElapsedFocusSeconds,
} from '@/lib/session'
import { useTimer } from '@/hooks/useTimer'
import { requestNotificationPermission, fireNotification } from '@/lib/notifications'
import { BACKGROUNDS, getBackground } from '@/types'
import {
  Pause,
  Play,
  SkipForward,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Clock,
  Coffee,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

const FOCUS_PRESETS = [
  { label: '15m', seconds: 900 },
  { label: '25m', seconds: 1500 },
  { label: '45m', seconds: 2700 },
  { label: '1h', seconds: 3600 },
  { label: '90m', seconds: 5400 },
  { label: '2h', seconds: 7200 },
]

const BREAK_PRESETS = [
  { label: 'None', seconds: 0 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '15m', seconds: 900 },
]

export default function FocusPage() {
  const router = useRouter()
  const [session, setSession] = useState<ActiveSessionData | null>(() => {
    if (typeof window === 'undefined') return null
    const s = loadActiveSession()
    return s && s.status !== 'completed' ? s : null
  })
  const [loaded] = useState(true)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [showBreakDone, setShowBreakDone] = useState(false)
  const [savedElapsed, setSavedElapsed] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [title, setTitle] = useState('')
  const [selectedDuration, setSelectedDuration] = useState(1500)
  const [selectedBreak, setSelectedBreak] = useState(300)
  const [selectedBg, setSelectedBg] = useState<string>(() => {
    if (typeof window === 'undefined') return 'forest'
    const s = loadActiveSession()
    return (s && s.status !== 'completed' && s.background) ? s.background : 'forest'
  })
  const [customMinutes, setCustomMinutes] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch {}
  }, [])

  const handleSessionComplete = useCallback(() => {
    setSavedElapsed(session ? getElapsedFocusSeconds(session) : 0)
    if (!session?.breakDuration || session.breakDuration === 0) {
      setShowCompletion(true)
    }
  }, [session])

  const handleBreakComplete = useCallback(() => {
    setShowBreakDone(true)
  }, [])

  const {
    phase,
    remainingSeconds,
    elapsedSeconds,
    breakRemainingSeconds,
    pause,
    resume,
    endEarly,
    skipBreak,
  } = useTimer(session, handleSessionComplete, handleBreakComplete)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const beepedSecondsRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (phase !== 'focusing') {
      beepedSecondsRef.current.clear()
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'focusing') return

    const ceil = Math.ceil(remainingSeconds)
    if (ceil < 1 || ceil > 5 || beepedSecondsRef.current.has(ceil)) return

    beepedSecondsRef.current.add(ceil)

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    const ctx = audioCtxRef.current

    const freq = ceil === 1 ? 1200 : 760 + (ceil - 1) * 40

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)

    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 0.01)
    gain.gain.setValueAtTime(0.45, ctx.currentTime + 0.12)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.36)
  }, [phase, remainingSeconds])


  useEffect(() => {
    requestNotificationPermission()
  }, [])

  useEffect(() => {
    if (phase !== 'paused') return

    const FIFTEEN_MINUTES = 15 * 60 * 1000
    const timer = setTimeout(() => {
      fireNotification(
        'Still with us? 🌿',
        'Your focus session has been paused for 15 minutes. Ready to get back in the zone?'
      )
    }, FIFTEEN_MINUTES)

    return () => clearTimeout(timer)
  }, [phase])


  async function handleLaunchFocus() {
    setStarting(true)
    const duration = showCustom && Number(customMinutes) > 0 ? Number(customMinutes) * 60 : selectedDuration
    const now = new Date()

    const id = await createDbSession({
      title: title.trim() || 'Focus session',
      plannedDuration: duration,
      breakDuration: selectedBreak,
      background: selectedBg,
      startedAt: now,
    })

    const sessionId = id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-000000000000')

    const newSessionData: ActiveSessionData = {
      id: sessionId,
      title: title.trim() || 'Focus session',
      plannedDuration: duration,
      breakDuration: selectedBreak,
      background: selectedBg,
      startedAt: now.getTime(),
      pausedAt: null,
      pausedDuration: 0,
      status: 'focusing',
      breakStartedAt: null,
    }

    saveActiveSession(newSessionData)
    setSession(newSessionData)
    setStarting(false)
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-[#2C4436] rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] pb-28 pt-8 md:pt-12 px-4 sm:px-6">
        <div className="max-w-xl mx-auto space-y-6 animate-scale-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-stone-600 hover:text-stone-900 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </button>

            <span className="bg-[#DDE7E1] text-[#2C4436] text-xs font-semibold px-3 py-1 rounded-full">
              Focus Sanctuary
            </span>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/60 shadow-xs space-y-6">
            <div>
              <h1 className="text-2xl font-serif text-stone-900 tracking-tight">
                New Focus Session
              </h1>
              <p className="text-xs text-stone-500 mt-1 font-sans">
                Configure your focused time block and enter your flow state.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
                What are you working on?
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Deep Work, Study session, Writing…"
                maxLength={80}
                className="w-full bg-[#FAF8F5] border border-stone-200 rounded-2xl px-4 py-3 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-[#2C4436] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Clock size={13} className="text-[#2C4436]" /> Focus Duration
              </label>
              <div className="flex flex-wrap gap-2">
                {FOCUS_PRESETS.map(p => (
                  <button
                    key={p.seconds}
                    type="button"
                    onClick={() => {
                      setSelectedDuration(p.seconds)
                      setShowCustom(false)
                    }}
                    className={`flex-1 min-w-[65px] py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${selectedDuration === p.seconds && !showCustom
                      ? 'bg-[#2C4436] text-white font-semibold shadow-xs'
                      : 'bg-[#FAF8F5] text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/60'
                      }`}
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowCustom(!showCustom)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${showCustom
                    ? 'bg-[#2C4436] text-white font-semibold shadow-xs'
                    : 'bg-[#FAF8F5] text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/60'
                    }`}
                >
                  Custom
                </button>
              </div>

              {showCustom && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={480}
                    placeholder="Enter minutes (e.g. 50)"
                    value={customMinutes}
                    onChange={e => setCustomMinutes(e.target.value)}
                    className="w-44 bg-[#FAF8F5] border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 text-sm focus:outline-none focus:border-[#2C4436]"
                  />
                  <span className="text-stone-500 text-xs">minutes</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Coffee size={13} className="text-[#2C4436]" /> Break Afterwards
              </label>
              <div className="flex flex-wrap gap-2">
                {BREAK_PRESETS.map(p => (
                  <button
                    key={p.seconds}
                    type="button"
                    onClick={() => setSelectedBreak(p.seconds)}
                    className={`flex-1 min-w-[65px] py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${selectedBreak === p.seconds
                      ? 'bg-[#DDE7E1] text-[#2C4436] font-semibold'
                      : 'bg-[#FAF8F5] text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/60'
                      }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#2C4436]" /> Focus Environment
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {BACKGROUNDS.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBg(b.id)}
                    title={b.name}
                    className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${selectedBg === b.id
                      ? 'border-[#2C4436] shadow-sm scale-[1.02]'
                      : 'border-transparent hover:border-stone-300 opacity-80 hover:opacity-100'
                      }`}
                  >
                    {b.isColorTheme ? (
                      <div className="absolute inset-0 bg-[#253B2F] flex items-center justify-center">
                        <span className="text-white text-xs">🌲</span>
                      </div>
                    ) : (
                      <>
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${b.file})` }}
                        />
                        <div className="absolute inset-0 bg-black/30" />
                      </>
                    )}
                    <p className="absolute bottom-1 left-0 right-0 text-center text-white text-[9px] font-medium leading-tight px-0.5 drop-shadow">
                      {b.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleLaunchFocus}
              disabled={starting}
              className="w-full bg-[#2C4436] hover:bg-[#23382C] text-white font-semibold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-[#2C4436]/20 cursor-pointer disabled:opacity-60"
            >
              {starting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Start session</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentBg = getBackground(session.background)
  const isForestTheme = currentBg.id === 'forest' || !currentBg.file
  const elapsed = phase === 'focusing' || phase === 'paused' ? elapsedSeconds : savedElapsed

  if (showCompletion) {
    return (
      <CompletionScreen
        session={session}
        elapsedSeconds={elapsed || session.plannedDuration}
        onDone={() => {
          clearActiveSession()
          setSession(null)
          router.push('/dashboard')
          router.refresh()
        }}
      />
    )
  }

  if (showBreakDone) {
    return (
      <BreakDoneScreen
        onDone={() => {
          clearActiveSession()
          setSession(null)
          router.push('/dashboard')
          router.refresh()
        }}
        onNewSession={() => {
          clearActiveSession()
          setSession(null)
        }}
      />
    )
  }

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-between p-6 md:p-10 select-none overflow-hidden z-50 ${isForestTheme ? 'bg-[#253B2F]' : ''
        }`}
      style={
        !isForestTheme
          ? {
            backgroundImage: `url(${currentBg.file})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
          : undefined
      }
    >
      {!isForestTheme ? (
        <div className="absolute inset-0 bg-stone-950/65 backdrop-blur-[0.5px]" />
      ) : (
        <div className="tree-bars opacity-20">
          <div className="tree-bar" style={{ height: '30%', backgroundColor: '#0D1A13', width: '16px' }} />
          <div className="tree-bar" style={{ height: '55%', backgroundColor: '#0D1A13', width: '16px' }} />
          <div className="tree-bar" style={{ height: '85%', backgroundColor: '#0D1A13', width: '16px' }} />
          <div className="tree-bar" style={{ height: '45%', backgroundColor: '#0D1A13', width: '16px' }} />
          <div className="tree-bar" style={{ height: '75%', backgroundColor: '#0D1A13', width: '16px' }} />
          <div className="tree-bar" style={{ height: '40%', backgroundColor: '#0D1A13', width: '16px' }} />
          <div className="tree-bar" style={{ height: '65%', backgroundColor: '#0D1A13', width: '16px' }} />
        </div>
      )}

      <div className="relative z-20 w-full flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-white/75 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer bg-black/20 hover:bg-black/30 border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-xs"
          title="Return to Dashboard (timer runs in background)"
        >
          <ArrowLeft size={13} />
          <span>Home</span>
        </button>

        <button
          onClick={toggleFullscreen}
          className="text-white/75 hover:text-white p-2 rounded-full transition-colors cursor-pointer bg-black/20 hover:bg-black/30 border border-white/10 backdrop-blur-md shadow-xs"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center my-auto px-4">
        <div className="inline-flex items-center gap-1.5 bg-black/25 hover:bg-black/35 border border-white/20 text-white/95 text-xs font-medium px-4 py-1.5 rounded-full shadow-xs mb-3 backdrop-blur-md">
          <Clock size={12} className="text-white/80" />
          <span>{currentBg.name}</span>
        </div>

        <p className="text-xs text-white/80 font-normal tracking-wide mb-1">
          {session.title || 'Focus session'}
        </p>

        <div
          className={`timer-display font-serif italic tracking-tight my-2 font-normal drop-shadow-sm select-none transition-colors duration-700 ${phase !== 'break' && remainingSeconds <= 5 && remainingSeconds > 0
            ? 'text-red-400 animate-pulse'
            : 'text-white'
            }`}
          style={{ fontSize: 'clamp(5.5rem, 18vw, 12rem)', lineHeight: 1 }}
        >
          {phase === 'break'
            ? formatTimer(breakRemainingSeconds)
            : formatTimer(remainingSeconds)
          }
        </div>

        {phase !== 'break' && (
          <div className="w-64 sm:w-80 h-[2.5px] bg-white/20 rounded-full mt-2 mb-8 overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (elapsedSeconds / session.plannedDuration) * 100)}%` }}
            />
          </div>
        )}

        <div className="flex items-center gap-3 mt-2">
          {phase === 'break' ? (
            <button
              id="skip-break-btn"
              onClick={skipBreak}
              className="bg-white/15 hover:bg-white/25 border border-white/25 text-white px-7 py-3 rounded-full text-sm font-medium transition-all backdrop-blur-md shadow-md inline-flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <SkipForward size={15} />
              <span>Skip break</span>
            </button>
          ) : (
            <>
              <button
                id={phase === 'paused' ? 'resume-btn' : 'pause-btn'}
                onClick={phase === 'paused' ? resume : pause}
                className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-7 py-3 rounded-full text-sm font-medium transition-all backdrop-blur-md shadow-md inline-flex items-center gap-2 cursor-pointer active:scale-98"
              >
                {phase === 'paused' ? (
                  <><Play size={15} fill="currentColor" /> <span>Resume</span></>
                ) : (
                  <><Pause size={15} fill="currentColor" /> <span>Pause</span></>
                )}
              </button>

              <button
                id="end-early-btn"
                onClick={() => setShowEndConfirm(true)}
                className="bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 px-6 py-3 rounded-full text-sm font-medium transition-all backdrop-blur-md cursor-pointer active:scale-98"
              >
                <span>End early</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="relative z-10 h-6" />

      {showEndConfirm && (
        <EndEarlyModal
          elapsedSeconds={elapsedSeconds}
          onContinue={() => setShowEndConfirm(false)}
          onEnd={async () => {
            await endEarly()
            clearActiveSession()
            setSession(null)
            router.push('/dashboard')
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

function EndEarlyModal({
  elapsedSeconds,
  onContinue,
  onEnd,
}: {
  elapsedSeconds: number
  onContinue: () => void
  onEnd: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onContinue} />

      <div className="relative bg-[#FAF9F5] rounded-3xl p-7 sm:p-8 max-w-[340px] w-full text-center shadow-2xl animate-scale-in border border-stone-200/50">
        <h3 className="font-serif text-xl font-normal text-stone-900 mb-1.5">
          End this session?
        </h3>
        <p className="text-xs text-stone-500 mb-6">
          You&apos;ve focused for {formatDuration(elapsedSeconds)}.
        </p>

        <div className="space-y-2.5">
          <button
            id="continue-focusing-btn"
            onClick={onContinue}
            className="w-full bg-[#374C40] hover:bg-[#2C3E33] text-white font-medium rounded-full py-3 text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Continue focusing
          </button>

          <button
            id="confirm-end-btn"
            onClick={onEnd}
            className="w-full bg-[#F2EFE9] hover:bg-[#EBE6DC] text-stone-700 font-medium rounded-full py-3 text-xs sm:text-sm transition-colors cursor-pointer"
          >
            End session
          </button>
        </div>
      </div>
    </div>
  )
}

function CompletionScreen({
  session,
  elapsedSeconds,
  onDone,
}: {
  session: ActiveSessionData
  elapsedSeconds: number
  onDone: () => void
}) {
  return (
    <div className="fixed inset-0 bg-[#253B2F] flex flex-col items-center justify-center p-6 z-50 select-none">
      <div className="relative bg-[#FAF9F5] rounded-3xl p-8 sm:p-10 max-w-sm w-full text-center shadow-2xl animate-scale-in border border-stone-200/60 space-y-4">
        <div className="text-4xl">✨</div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#2C4436]">
          Session Complete
        </p>
        <h2 className="text-3xl font-serif text-stone-900 font-normal">
          {formatDuration(elapsedSeconds)}
        </h2>
        <p className="text-xs text-stone-500 leading-relaxed">
          Great job staying focused on &ldquo;{session.title}&rdquo;.
        </p>
        <button
          id="done-btn"
          onClick={onDone}
          className="w-full bg-[#374C40] hover:bg-[#2C3E33] text-white font-semibold py-3.5 rounded-full text-sm transition-all shadow-md cursor-pointer"
        >
          Return to Home
        </button>
      </div>
    </div>
  )
}

function BreakDoneScreen({
  onDone,
  onNewSession,
}: {
  onDone: () => void
  onNewSession: () => void
}) {
  return (
    <div className="fixed inset-0 bg-[#FAF8F5] flex flex-col items-center justify-center p-6 z-50 select-none">
      <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-sm w-full text-center shadow-md border border-stone-200/60 space-y-4">
        <div className="text-4xl">☕</div>
        <h2 className="text-xl font-serif text-stone-900 font-normal">
          Break complete
        </h2>
        <p className="text-xs text-stone-500">
          Feeling refreshed and ready for your next focus session?
        </p>
        <div className="space-y-2.5 pt-2">
          <button
            id="new-session-btn"
            onClick={onNewSession}
            className="w-full bg-[#374C40] hover:bg-[#2C3E33] text-white font-semibold py-3 rounded-full text-sm transition-all cursor-pointer"
          >
            Start next session
          </button>
          <button
            id="done-after-break-btn"
            onClick={onDone}
            className="w-full bg-[#F2EFE9] hover:bg-[#EBE6DC] text-stone-700 font-medium py-3 rounded-full text-sm transition-colors cursor-pointer"
          >
            I&apos;m done for now
          </button>
        </div>
      </div>
    </div>
  )
}
