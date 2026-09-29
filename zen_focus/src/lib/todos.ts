'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { TodoInsert, TodoUpdate } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthenticated')
  return { supabase, user }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getTodos() {
  const { supabase, user } = await getAuthenticatedClient()

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createTodo(payload: Omit<TodoInsert, 'user_id'>) {
  const { supabase, user } = await getAuthenticatedClient()

  const { data, error } = await supabase
    .from('todos')
    .insert({ ...payload, user_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/todos')
  return data
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateTodo(id: string, payload: TodoUpdate) {
  const { supabase, user } = await getAuthenticatedClient()

  const { data, error } = await supabase
    .from('todos')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)   // extra safety: never touch another user's row
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/todos')
  return data
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteTodo(id: string) {
  const { supabase, user } = await getAuthenticatedClient()

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/todos')
}
