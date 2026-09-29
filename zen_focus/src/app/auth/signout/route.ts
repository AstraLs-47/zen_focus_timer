import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /auth/signout
 * Server-side sign-out route. Clears the Supabase session cookie and
 * redirects to /login. Called from the layout when a deleted/invalid
 * user is detected, and from the AppNav sign-out button.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const supabase = await createClient()

  // This is a Route Handler so cookies() modifications are legal here.
  await supabase.auth.signOut()

  return NextResponse.redirect(`${origin}/login`)
}
