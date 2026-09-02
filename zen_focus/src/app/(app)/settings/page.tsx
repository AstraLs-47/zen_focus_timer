import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from '@/components/settings/SettingsClient'

export const metadata = { title: 'Settings — ZEN' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const resolvedName =
    profile?.name ||
    user.user_metadata?.name ||
    user.user_metadata?.display_name ||
    user.user_metadata?.first_name ||
    ''

  return (
    <SettingsClient
      profile={profile ?? { id: '', user_id: user.id, name: resolvedName, avatar_url: null, created_at: '' }}
      email={user.email ?? ''}
    />
  )
}
