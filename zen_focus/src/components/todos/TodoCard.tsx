'use client'

import { useState, useTransition } from 'react'
import { Trash2, ChevronRight, CalendarDays, Flag, Circle, Clock3, CheckCircle2, Loader2, Check } from 'lucide-react'
import { updateTodo, deleteTodo } from '@/lib/todos'
import type { Todo, TodoStatus } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CYCLE: Record<TodoStatus, TodoStatus> = {
  todo:        'in_progress',
  in_progress: 'done',
  done:        'todo',
}

const STATUS_LABEL: Record<TodoStatus, string> = {
  todo:        'To Do',
  in_progress: 'In Progress',
  done:        'Done',
}

const PRIORITY_COLORS: Record<Todo['priority'], string> = {
  low:    'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100  text-amber-700',
  high:   'bg-rose-100   text-rose-700',
}

const PRIORITY_DOT: Record<Todo['priority'], string> = {
  low:    'bg-emerald-500',
  medium: 'bg-amber-500',
  high:   'bg-rose-500',
}

function getDueDateInfo(dueDate: string | null): { label: string; color: string; bgColor: string } | null {
  if (!dueDate) return null

  const today  = new Date()
  today.setHours(0, 0, 0, 0)
  const due    = new Date(dueDate + 'T00:00:00')
  const diff   = Math.round((due.getTime() - today.getTime()) / 86_400_000)

  if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, color: 'text-rose-600',   bgColor: 'bg-rose-50 border border-rose-200' }
  if (diff === 0) return { label: 'Due today',                  color: 'text-amber-600',  bgColor: 'bg-amber-50 border border-amber-200' }
  if (diff === 1) return { label: 'Due tomorrow',               color: 'text-sky-600',    bgColor: 'bg-sky-50 border border-sky-200' }
  if (diff <= 7)  return { label: `In ${diff} days`,            color: 'text-[#2C4436]',  bgColor: 'bg-[#DDE7E1] border border-[#A8C7B5]' }
  return { label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'text-stone-500', bgColor: 'bg-stone-100 border border-stone-200' }
}

function StatusIcon({ status }: { status: TodoStatus }) {
  if (status === 'done')        return <CheckCircle2 size={20} className="text-[#2C4436]" />
  if (status === 'in_progress') return <Clock3       size={20} className="text-amber-500" />
  return <Circle size={20} className="text-stone-300" />
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface TodoCardProps {
  todo:     Todo
  onUpdate: (updated: Todo) => void
  onDelete: (id: string)    => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TodoCard({ todo, onUpdate, onDelete }: TodoCardProps) {
  const [isPending, startTransition] = useTransition()
  const [deleting, setDeleting]      = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const dueDateInfo = getDueDateInfo(todo.due_date)
  const isDone      = todo.status === 'done'

  // ── Cycle status ─────────────────────────────────────────────────────────
  function handleStatusClick() {
    const next = STATUS_CYCLE[todo.status]
    const optimistic = { ...todo, status: next }
    onUpdate(optimistic)

    startTransition(async () => {
      try {
        const updated = await updateTodo(todo.id, { status: next })
        onUpdate(updated)
      } catch {
        // roll back
        onUpdate(todo)
      }
    })
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 2500)
      return
    }
    setDeleting(true)
    onDelete(todo.id)
    startTransition(async () => {
      try {
        await deleteTodo(todo.id)
      } catch {
        setDeleting(false)
        // restore
      }
    })
  }

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden
        ${isDone
          ? 'bg-[#EBF3EE] border-[#B6D4C2] shadow-xs hover:border-[#2C4436]/40 hover:shadow-sm'
          : 'bg-white border-stone-200/80 hover:border-[#2C4436]/30 hover:shadow-md'
        }
        ${deleting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
      `}
      style={{ transition: 'all 0.3s ease' }}
    >
      {/* Priority accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl transition-colors duration-300 ${
        isDone                     ? 'bg-[#2C4436]' :
        todo.priority === 'high'   ? 'bg-rose-400' :
        todo.priority === 'medium' ? 'bg-amber-400' :
                                     'bg-emerald-400'
      }`} />

      <div className="pl-4 pr-4 pt-4 pb-3.5 ml-1">
        {/* Top row: status toggle + title + delete */}
        <div className="flex items-start gap-3">
          <button
            id={`todo-status-${todo.id}`}
            onClick={handleStatusClick}
            disabled={isPending}
            className="mt-0.5 shrink-0 transition-transform hover:scale-110 cursor-pointer disabled:opacity-50"
            title={`Mark as ${STATUS_LABEL[STATUS_CYCLE[todo.status]]}`}
          >
            {isPending
              ? <Loader2 size={20} className="animate-spin text-stone-300" />
              : <StatusIcon status={todo.status} />
            }
          </button>

          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold leading-snug break-words transition-all duration-300 ${
              isDone ? 'text-[#1E3628]' : 'text-stone-900'
            }`}>
              {todo.title}
            </p>

            {todo.description && (
              <p className={`text-xs mt-1 leading-relaxed line-clamp-2 transition-all duration-300 ${
                isDone ? 'text-[#3B5947]' : 'text-stone-500'
              }`}>
                {todo.description}
              </p>
            )}
          </div>

          <button
            id={`todo-delete-${todo.id}`}
            onClick={handleDelete}
            className={`shrink-0 mt-0.5 flex items-center justify-center w-7 h-7 rounded-lg transition-all
              ${confirmDelete
                ? 'bg-rose-500 text-white scale-110'
                : 'text-stone-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100'
              }`}
            title={confirmDelete ? 'Click again to confirm delete' : 'Delete task'}
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Bottom row: badges */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pl-8">
          {/* Status badge */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all duration-300 ${
            todo.status === 'done'        ? 'bg-[#D2E4D9] text-[#2C4436] border border-[#A8C7B5]'   :
            todo.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                                            'bg-stone-100 text-stone-500'
          }`}>
            {todo.status === 'done' ? (
              <Check size={9} strokeWidth={2.8} />
            ) : (
              <ChevronRight size={9} />
            )}
            {STATUS_LABEL[todo.status]}
          </span>

          {/* Priority badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${PRIORITY_COLORS[todo.priority]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[todo.priority]}`} />
            <Flag size={8} />
            {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
          </span>

          {/* Due date badge */}
          {dueDateInfo && !isDone && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${dueDateInfo.bgColor} ${dueDateInfo.color}`}>
              <CalendarDays size={9} />
              {dueDateInfo.label}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
