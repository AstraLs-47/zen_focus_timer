'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import {
  Plus, X, CheckSquare, Circle, Clock3, CheckCircle2,
  ChevronDown, Search, SlidersHorizontal, ListTodo,
} from 'lucide-react'
import { createTodo } from '@/lib/todos'
import TodoCard from './TodoCard'
import DatePicker from '@/components/ui/DatePicker'
import type { Todo, TodoStatus, TodoPriority } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | TodoStatus
type SortKey   = 'due_date' | 'priority' | 'created_at'

const PRIORITY_ORDER: Record<TodoPriority, number> = { high: 0, medium: 1, low: 2 }

const STATUS_CONFIG: Record<TodoStatus, { label: string; icon: React.ReactNode; accent: string; bg: string }> = {
  todo:        { label: 'To Do',       icon: <Circle       size={13} />, accent: 'text-stone-500',   bg: 'bg-stone-100'   },
  in_progress: { label: 'In Progress', icon: <Clock3       size={13} />, accent: 'text-amber-600',   bg: 'bg-amber-50'    },
  done:        { label: 'Done',        icon: <CheckCircle2 size={13} />, accent: 'text-[#2C4436]',   bg: 'bg-[#DDE7E1]'  },
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterTab }) {
  const messages: Record<FilterTab, { title: string; sub: string }> = {
    all:         { title: 'Your task list is clear',    sub: 'Add your first task using the button above.' },
    todo:        { title: 'No pending tasks',           sub: 'Everything is in motion. Great work!' },
    in_progress: { title: 'Nothing in progress',        sub: 'Pick a task and get started.' },
    done:        { title: 'No completed tasks yet',     sub: 'Finish something — you\'ll feel great!' },
  }
  const msg = messages[filter]
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-3xl bg-[#DDE7E1] flex items-center justify-center mb-4">
        <ListTodo size={28} className="text-[#2C4436]" />
      </div>
      <p className="text-stone-800 font-semibold text-base mb-1">{msg.title}</p>
      <p className="text-stone-400 text-sm max-w-xs">{msg.sub}</p>
    </div>
  )
}

// ─── Stats strip ─────────────────────────────────────────────────────────────

function StatsStrip({ todos }: { todos: Todo[] }) {
  const total       = todos.length
  const todoCount   = todos.filter(t => t.status === 'todo').length
  const inProgCount = todos.filter(t => t.status === 'in_progress').length
  const doneCount   = todos.filter(t => t.status === 'done').length
  const overdueCount = todos.filter(t => {
    if (!t.due_date || t.status === 'done') return false
    const today = new Date(); today.setHours(0,0,0,0)
    return new Date(t.due_date + 'T00:00:00') < today
  }).length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: 'Total',       value: total,       color: 'text-stone-700',   bg: 'bg-stone-100'   },
        { label: 'To Do',       value: todoCount,   color: 'text-stone-600',   bg: 'bg-stone-50'    },
        { label: 'In Progress', value: inProgCount, color: 'text-amber-700',   bg: 'bg-amber-50'    },
        { label: 'Done',        value: doneCount,   color: 'text-[#2C4436]',   bg: 'bg-[#DDE7E1]'  },
      ].map(({ label, value, color, bg }) => (
        <div key={label} className={`${bg} rounded-2xl px-4 py-3.5 border border-stone-200/60`}>
          <p className={`text-2xl font-serif font-semibold ${color}`}>{value}</p>
          <p className="text-xs text-stone-500 font-medium mt-0.5">{label}</p>
        </div>
      ))}
      {overdueCount > 0 && (
        <div className="col-span-2 sm:col-span-4 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-2.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <p className="text-xs text-rose-700 font-medium">
            {overdueCount} task{overdueCount > 1 ? 's are' : ' is'} overdue
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Add Task Form ────────────────────────────────────────────────────────────

interface AddTaskFormProps {
  onAdd:    (todo: Todo) => void
  onCancel: () => void
}

function AddTaskForm({ onAdd, onCancel }: AddTaskFormProps) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle]         = useState('')
  const [description, setDesc]    = useState('')
  const [dueDate, setDueDate]     = useState('')
  const [priority, setPriority]   = useState<TodoPriority>('medium')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    startTransition(async () => {
      try {
        const created = await createTodo({
          title:       title.trim(),
          description: description.trim() || null,
          due_date:    dueDate || null,
          priority,
          status:      'todo',
        })
        onAdd(created)
        setTitle(''); setDesc(''); setDueDate(''); setPriority('medium')
      } catch (err) {
        console.error(err)
      }
    })
  }

  const priorityOptions: { value: TodoPriority; label: string; color: string }[] = [
    { value: 'low',    label: 'Low',    color: 'text-emerald-600 bg-emerald-50  border-emerald-300' },
    { value: 'medium', label: 'Medium', color: 'text-amber-600  bg-amber-50   border-amber-300'  },
    { value: 'high',   label: 'High',   color: 'text-rose-600   bg-rose-50    border-rose-300'   },
  ]

  return (
    <div className="animate-scale-in bg-white border border-[#2C4436]/20 rounded-3xl p-5 mb-5 shadow-lg shadow-[#2C4436]/5">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <input
            ref={titleRef}
            id="todo-title-input"
            type="text"
            placeholder="Task title…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full text-sm font-semibold text-stone-800 placeholder:text-stone-300 bg-transparent border-b border-stone-200 pb-2 focus:outline-none focus:border-[#2C4436] transition-colors"
            maxLength={200}
          />
        </div>
        <div>
          <textarea
            id="todo-desc-input"
            placeholder="Add a description (optional)"
            value={description}
            onChange={e => setDesc(e.target.value)}
            rows={2}
            className="w-full text-xs text-stone-600 placeholder:text-stone-300 bg-stone-50 rounded-xl px-3 py-2.5 border border-stone-200 focus:outline-none focus:border-[#2C4436] resize-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Due date */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-400 font-medium">Due</span>
            <DatePicker
              id="todo-due-input"
              value={dueDate}
              onChange={setDueDate}
            />
          </div>

          {/* Priority */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-400 font-medium">Priority</span>
            <div className="flex gap-1">
              {priorityOptions.map(o => (
                <button
                  key={o.value}
                  type="button"
                  id={`todo-priority-${o.value}`}
                  onClick={() => setPriority(o.value)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                    priority === o.value ? o.color : 'text-stone-400 bg-white border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-stone-400 hover:text-stone-600 font-medium px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="todo-submit-btn"
            type="submit"
            disabled={!title.trim() || isPending}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#2C4436] hover:bg-[#3a5a47] disabled:opacity-40 px-4 py-2 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus size={13} />
            )}
            Add Task
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  initialTodos: Todo[]
}

export default function TodosClient({ initialTodos }: Props) {
  const [todos, setTodos]         = useState<Todo[]>(initialTodos)
  const [filter, setFilter]       = useState<FilterTab>('all')
  const [sort, setSort]           = useState<SortKey>('due_date')
  const [search, setSearch]       = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [showSort, setShowSort]   = useState(false)

  // ── Derived ──────────────────────────────────────────────────────────────
  const filtered = todos
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sort === 'due_date') {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return a.due_date.localeCompare(b.due_date)
      }
      if (sort === 'priority') {
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      }
      return b.created_at.localeCompare(a.created_at)
    })

  // ── Callbacks ─────────────────────────────────────────────────────────────
  function handleAdd(created: Todo) {
    setTodos(prev => [created, ...prev])
    setShowForm(false)
  }

  function handleUpdate(updated: Todo) {
    setTodos(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  function handleDelete(id: string) {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  const SORT_LABELS: Record<SortKey, string> = {
    due_date:   'Due Date',
    priority:   'Priority',
    created_at: 'Created',
  }

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all',         label: 'All',         count: todos.length },
    { key: 'todo',        label: 'To Do',        count: todos.filter(t => t.status === 'todo').length },
    { key: 'in_progress', label: 'In Progress',  count: todos.filter(t => t.status === 'in_progress').length },
    { key: 'done',        label: 'Done',         count: todos.filter(t => t.status === 'done').length },
  ]

  return (
    <div className="min-h-screen bg-[#FAF8F5] w-full pb-32 md:pb-20">
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-8 md:pt-10">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif text-stone-900 mb-1 tracking-tight">
              My Tasks
            </h1>
            <p className="text-stone-500 text-xs md:text-sm font-sans">
              Stay on top of your goals. One task at a time.
            </p>
          </div>

          <button
            id="todo-add-btn"
            onClick={() => { setShowForm(v => !v) }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-sm transition-all duration-200 cursor-pointer
              ${showForm
                ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                : 'bg-[#2C4436] text-white hover:bg-[#3a5a47] hover:shadow-md'
              }`}
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            <span className="hidden sm:inline">{showForm ? 'Cancel' : 'New Task'}</span>
          </button>
        </div>

        {/* ── Stats strip ─────────────────────────────────────────────── */}
        <StatsStrip todos={todos} />

        {/* ── Add Task form ────────────────────────────────────────────── */}
        {showForm && (
          <AddTaskForm
            onAdd={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* ── Filter & Sort bar ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          {/* Filter tabs */}
          <div className="flex items-center bg-white border border-stone-200/80 rounded-2xl p-1 gap-0.5">
            {filterTabs.map(({ key, label, count }) => (
              <button
                key={key}
                id={`todo-filter-${key}`}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filter === key
                    ? 'bg-[#2C4436] text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                }`}
              >
                {label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  filter === key ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Sort + Search */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input
                id="todo-search"
                type="text"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#2C4436] w-28 sm:w-36 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer">
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                id="todo-sort-btn"
                onClick={() => setShowSort(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-500 bg-white border border-stone-200 rounded-xl hover:border-stone-300 hover:text-stone-700 transition-all cursor-pointer"
              >
                <SlidersHorizontal size={12} />
                {SORT_LABELS[sort]}
                <ChevronDown size={11} />
              </button>
              {showSort && (
                <div className="absolute right-0 top-full mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-lg z-10 overflow-hidden min-w-[130px] animate-scale-in">
                  {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => { setSort(k); setShowSort(false) }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
                        sort === k ? 'bg-[#DDE7E1] text-[#2C4436] font-semibold' : 'text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Task list ─────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="space-y-3">
            {filtered.map(todo => (
              <div key={todo.id} className="animate-fade-up">
                <TodoCard
                  todo={todo}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Footer count ──────────────────────────────────────────────── */}
        {filtered.length > 0 && (
          <p className="text-center text-xs text-stone-300 font-medium mt-8">
            {filtered.length} task{filtered.length !== 1 ? 's' : ''} shown
          </p>
        )}
      </div>
    </div>
  )
}
