import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'

export const metadata = {
  title: 'Dashboard — ZEN',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, sessionsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(20),
  ])

  const profile = profileRes.data
  const sessions = sessionsRes.data ?? []

  const resolvedName =
    profile?.name ||
    user.user_metadata?.name ||
    user.user_metadata?.display_name ||
    user.user_metadata?.first_name ||
    user.email?.split('@')[0] ||
    'Friend'

  return (
    <DashboardClient
      profile={profile ?? { id: '', user_id: user.id, name: resolvedName, avatar_url: null, created_at: '' }}
      sessions={sessions}
      userEmail={user.email ?? ''}
    />
  )
}
