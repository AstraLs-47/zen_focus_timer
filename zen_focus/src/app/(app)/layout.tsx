import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppNav from '@/components/layout/AppNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col md:flex-row">
      <AppNav />
      <main className="flex-1 md:pl-16 lg:pl-20 w-full min-h-screen">
        {children}
      </main>
    </div>
  )
}
