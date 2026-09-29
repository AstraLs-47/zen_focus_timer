'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAYS = ['Mo','Tu','We','Th','Fr','Sa','Su']

function toLocalDateStr(d: Date): string {
  return d.toLocaleDateString('en-CA') // 'YYYY-MM-DD'
}

function todayStr() { return toLocalDateStr(new Date()) }

function buildCalendarDays(year: number, month: number) {
  // month is 0-indexed
  const firstDay    = new Date(year, month, 1)
  const startDow    = (firstDay.getDay() + 6) % 7   // Mon=0 … Sun=6
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev  = new Date(year, month, 0).getDate()

  const cells: { date: Date; inMonth: boolean }[] = []

  for (let i = startDow - 1; i >= 0; i--)
    cells.push({ date: new Date(year, month - 1, daysInPrev - i), inMonth: false })
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: new Date(year, month, d), inMonth: true })
  let next = 1
  while (cells.length % 7 !== 0)
    cells.push({ date: new Date(year, month + 1, next++), inMonth: false })

  return cells
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DatePickerProps {
  value:    string          // 'YYYY-MM-DD' or ''
  onChange: (v: string) => void
  id?:      string
}

// ─── Popover position helper ──────────────────────────────────────────────────

interface PopoverStyle {
  position: 'fixed'
  top:  number
  left: number
}

const CAL_W = 280
const CAL_H = 340   // conservative estimate
const GAP   = 6

function calcStyle(trigger: HTMLElement): PopoverStyle {
  const r = trigger.getBoundingClientRect()
  const spaceBelow = window.innerHeight - r.bottom
  const openAbove  = spaceBelow < CAL_H + GAP && r.top > CAL_H + GAP

  const top  = openAbove ? r.top - CAL_H - GAP : r.bottom + GAP
  let   left = r.left
  if (left + CAL_W > window.innerWidth - 8) left = window.innerWidth - CAL_W - 8
  if (left < 8) left = 8

  return { position: 'fixed', top, left }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DatePicker({ value, onChange, id = 'datepicker' }: DatePickerProps) {
  const initDate = value ? new Date(value + 'T00:00:00') : new Date()

  const [open, setOpen]       = useState(false)
  const [viewYear, setYear]   = useState(initDate.getFullYear())
  const [viewMonth, setMonth] = useState(initDate.getMonth())
  const [popStyle, setPopStyle] = useState<PopoverStyle | null>(null)
  const [mounted, setMounted]   = useState(false)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Recompute position on open / scroll / resize
  const recompute = useCallback(() => {
    if (triggerRef.current) setPopStyle(calcStyle(triggerRef.current))
  }, [])

  useEffect(() => {
    if (!open) return
    recompute()
    window.addEventListener('scroll', recompute, true)
    window.addEventListener('resize', recompute)
    return () => {
      window.removeEventListener('scroll', recompute, true)
      window.removeEventListener('resize', recompute)
    }
  }, [open, recompute])

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(t) &&
        popoverRef.current  && !popoverRef.current.contains(t)
      ) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00')
      setYear(d.getFullYear())
      setMonth(d.getMonth())
    }
  }, [value])

  function prevMonth() {
    if (viewMonth === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }
  function selectDay(date: Date) { onChange(toLocalDateStr(date)); setOpen(false) }
  function clearDate()           { onChange('');                    setOpen(false) }

  const cells       = buildCalendarDays(viewYear, viewMonth)
  const selectedStr = value || ''
  const today0      = todayStr()

  let label = 'Pick a date'
  if (value) {
    const d = new Date(value + 'T00:00:00')
    label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // ── Portal calendar ───────────────────────────────────────────────────────
  const calendar = open && popStyle && mounted ? createPortal(
    <div
      ref={popoverRef}
      style={popStyle}
      className="z-[9999] animate-scale-in origin-top-left"
    >
      <div className="bg-white border border-stone-200/80 rounded-3xl shadow-2xl shadow-stone-900/15 p-4 w-[280px]">

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-all cursor-pointer">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-stone-800 tracking-tight">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button type="button" onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-all cursor-pointer">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-stone-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map(({ date, inMonth }, i) => {
            const str       = toLocalDateStr(date)
            const isToday   = str === today0
            const isSel     = str === selectedStr
            const isPast    = str < today0 && !isSel
            const isWeekend = date.getDay() === 0 || date.getDay() === 6
            return (
              <button key={i} type="button" onClick={() => selectDay(date)}
                className={`
                  relative flex items-center justify-center h-8 w-full rounded-xl text-xs font-medium
                  transition-all duration-150 cursor-pointer
                  ${isSel
                    ? 'bg-[#2C4436] text-white shadow-md shadow-[#2C4436]/30 scale-105'
                    : isToday
                      ? 'bg-[#DDE7E1] text-[#2C4436] font-bold ring-1 ring-[#2C4436]/30'
                      : !inMonth
                        ? 'text-stone-300 hover:bg-stone-50 hover:text-stone-400'
                        : isPast
                          ? 'text-stone-400 hover:bg-stone-100'
                          : isWeekend
                            ? 'text-stone-600 hover:bg-[#DDE7E1]/60 hover:text-[#2C4436]'
                            : 'text-stone-700 hover:bg-[#DDE7E1]/60 hover:text-[#2C4436]'
                  }
                `}
              >
                {date.getDate()}
                {isToday && !isSel && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#2C4436]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
          <button type="button" onClick={clearDate}
            className="text-xs text-stone-400 hover:text-rose-500 font-medium transition-colors cursor-pointer px-1">
            Clear
          </button>
          <button type="button" onClick={() => selectDay(new Date())}
            className="text-xs font-semibold text-[#2C4436] hover:text-[#3a5a47] transition-colors cursor-pointer px-1">
            Today
          </button>
        </div>

      </div>
    </div>,
    document.body
  ) : null

  return (
    <div className="relative" id={id}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer
          ${open
            ? 'border-[#2C4436] bg-[#DDE7E1] text-[#2C4436]'
            : value
              ? 'border-[#A8C7B5] bg-[#DDE7E1]/50 text-[#2C4436]'
              : 'border-stone-200 bg-stone-100 text-stone-500 hover:border-stone-300 hover:bg-stone-50'
          }`}
      >
        <CalendarDays size={13} />
        {label}
        {value && (
          <span
            onClick={e => { e.stopPropagation(); clearDate() }}
            className="ml-0.5 text-stone-400 hover:text-rose-500 transition-colors cursor-pointer"
          >
            <X size={11} />
          </span>
        )}
      </button>

      {/* Floating calendar rendered into <body> */}
      {calendar}
    </div>
  )
}
