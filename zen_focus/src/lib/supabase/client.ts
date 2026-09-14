/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBrowserClient } from '@supabase/ssr'

/* const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder' */

const PLACEHOLDER_URL = '****'
const PLACEHOLDER_KEY = '**.placeholder'

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!url || url === 'your-supabase-url' || !url.startsWith('http')) {
    return PLACEHOLDER_URL
  }

  return url
}

function getSupabaseKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!key || key === 'your-supabase-publishable-key') {
    return PLACEHOLDER_KEY
  }

  return key
}

export function createClient() {
  return createBrowserClient(
    getSupabaseUrl(),
    getSupabaseKey()
  ) as any
}