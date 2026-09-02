'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, ArrowRight, Clock, Coffee, Sparkles } from 'lucide-react'
import { BACKGROUNDS } from '@/types'
import {
  createDbSession,
  saveActiveSession,
  type ActiveSessionData,
} from '@/lib/session'

interface Props {
  onClose: () => void
}

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

export default function SessionSetupModal({ onClose }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [focusDuration, setFocusDuration] = useState(1500)
  const [breakDuration, setBreakDuration] = useState(300)
  const [background, setBackground] = useState('forest')
  const [customFocus, setCustomFocus] = useState('')
  const [showCustomFocus, setShowCustomFocus] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleStart() {
    setLoading(true)
    const now = new Date()
    const id = await createDbSession({
      title: title.trim() || 'Focus session',
      plannedDuration: focusDuration,
      breakDuration,
      background,
      startedAt: now,
    })

    const sessionId = id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-000000000000')

    const data: ActiveSessionData = {
      id: sessionId,
      title: title.trim() || 'Focus session',
      plannedDuration: focusDuration,
      breakDuration,
      background,
      startedAt: now.getTime(),
      pausedAt: null,
      pausedDuration: 0,
      status: 'focusing',
      breakStartedAt: null,
    }
    saveActiveSession(data)
    router.push('/focus')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-stone-200/60 shadow-2xl animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-stone-900 font-serif text-xl font-normal">New Focus Session</h2>
            <p className="text-xs text-stone-500 mt-0.5">Customize your upcoming focus time block.</p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 transition-colors p-1.5 rounded-full hover:bg-stone-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-stone-600 text-xs font-semibold uppercase tracking-wider mb-2">
              What are you working on?
            </label>
            <input
              id="session-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Deep Work, Reading, Project planning…"
              maxLength={80}
              className="w-full bg-[#FAF8F5] border border-stone-200 rounded-2xl px-4 py-3 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-[#2C4436] transition-colors"
            />
          </div>

          <div>
            <label className="block text-stone-600 text-xs font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Clock size={13} className="text-[#2C4436]" /> Focus Duration
            </label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_PRESETS.map(p => (
                <button
                  key={p.seconds}
                  type="button"
                  onClick={() => { setFocusDuration(p.seconds); setShowCustomFocus(false) }}
                  className={`flex-1 min-w-[65px] py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${focusDuration === p.seconds && !showCustomFocus
                      ? 'bg-[#2C4436] text-white font-semibold shadow-xs'
                      : 'bg-[#FAF8F5] text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/60'
                    }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomFocus(true)}
                className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${showCustomFocus
                    ? 'bg-[#2C4436] text-white font-semibold shadow-xs'
                    : 'bg-[#FAF8F5] text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/60'
                  }`}
              >
                Custom
              </button>
            </div>
            {showCustomFocus && (
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="number"
                  min={1}
                  max={480}
                  placeholder="Minutes"
                  value={customFocus}
                  onChange={e => {
                    setCustomFocus(e.target.value)
                    const mins = parseInt(e.target.value)
                    if (mins > 0) setFocusDuration(mins * 60)
                  }}
                  className="w-36 bg-[#FAF8F5] border border-stone-200 rounded-xl px-3 py-2 text-stone-900 text-sm focus:outline-none focus:border-[#2C4436]"
                />
                <span className="text-stone-500 text-xs">minutes</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-stone-600 text-xs font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Coffee size={13} className="text-[#2C4436]" /> Break Afterward
            </label>
            <div className="flex flex-wrap gap-2">
              {BREAK_PRESETS.map(p => (
                <button
                  key={p.seconds}
                  type="button"
                  onClick={() => setBreakDuration(p.seconds)}
                  className={`flex-1 min-w-[65px] py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${breakDuration === p.seconds
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
            <label className="block text-stone-600 text-xs font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#2C4436]" /> Environment Theme
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {BACKGROUNDS.map(bg => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => setBackground(bg.id)}
                  title={bg.name}
                  className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${background === bg.id
                      ? 'border-[#2C4436] shadow-sm scale-[1.02]'
                      : 'border-transparent hover:border-stone-300 opacity-80 hover:opacity-100'
                    }`}
                >
                  {bg.isColorTheme ? (
                    <div className="absolute inset-0 bg-[#253B2F] flex items-center justify-center">
                      <span className="text-white text-xs">🌲</span>
                    </div>
                  ) : (
                    <>
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${bg.file})` }}
                      />
                      <div className="absolute inset-0 bg-black/30" />
                    </>
                  )}
                  <p className="absolute bottom-1 left-0 right-0 text-center text-white text-[9px] font-medium leading-tight px-0.5 drop-shadow">
                    {bg.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-3 border-t border-stone-100">
          <button
            id="start-session-btn"
            onClick={handleStart}
            disabled={loading}
            className="w-full bg-[#2C4436] hover:bg-[#23382C] text-white font-semibold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-[#2C4436]/20 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Start Session</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
