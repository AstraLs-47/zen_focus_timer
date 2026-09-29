import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    // Guarantee a profile row exists for the confirmed user.
    // This handles the case where: the trigger failed, the profile was manually
    // deleted from public.profiles, or email confirmation was added after signup.
    if (data?.user) {
      const u = data.user
      const displayName =
        u.user_metadata?.display_name ||
        u.user_metadata?.name ||
        u.email?.split('@')[0] ||
        'Friend'

      await supabase.from('profiles').upsert(
        {
          id:           u.id,
          user_id:      u.id,
          name:         u.user_metadata?.name || displayName,
          display_name: displayName,
        },
        { onConflict: 'user_id', ignoreDuplicates: true }
      )
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
