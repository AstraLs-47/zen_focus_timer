import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StatsClient from '@/components/stats/StatsClient'

export const metadata = { title: 'Statistics — ZEN' }

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sessions } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return <StatsClient sessions={sessions ?? []} />
}
