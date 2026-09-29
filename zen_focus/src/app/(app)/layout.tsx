import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppNav from '@/components/layout/AppNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // getUser() validates the JWT against the Supabase auth server on every
  // request — this catches deleted/banned users that getSession() misses.
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) {
    // Redirect through the signout Route Handler which is allowed to clear
    // cookies. Direct redirect('/login') would leave the stale cookie in place.
    redirect('/auth/signout')
  }

  // Auto-create a profile if one doesn't exist yet.
  // Covers: email-confirmation-disabled signups where the trigger may not have
  // fired, and cases where the profile row was manually deleted.
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) {
    const displayName =
      user.user_metadata?.display_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Friend'

    await supabase.from('profiles').upsert(
      {
        id:           user.id,
        user_id:      user.id,
        name:         user.user_metadata?.name || displayName,
        display_name: displayName,
      },
      { onConflict: 'user_id', ignoreDuplicates: true }
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col md:flex-row">
      <AppNav />
      <main className="flex-1 md:pl-16 lg:pl-20 w-full min-h-screen">
        {children}
      </main>
    </div>
  )
}
