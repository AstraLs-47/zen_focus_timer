import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TodosClient from '@/components/todos/TodosClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tasks — ZEN',
  description: 'Manage your tasks and stay on top of your goals with the ZEN task manager.',
}

export default async function TodosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: todos } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  return <TodosClient initialTodos={todos ?? []} />
}
