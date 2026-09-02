'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { LogOut, Save, Loader2, User } from 'lucide-react'

interface Props {
  profile: Profile
  email: string
}

export default function SettingsClient({ profile, email }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState(profile.name ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    await supabase
      .from('profiles')
      .update({ name: name.trim() })
      .eq('user_id', profile.user_id)

    setSaving(false)
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-28 pt-8 md:pt-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight">
            Account Settings
          </h1>
          <p className="text-xs text-stone-500 mt-1 font-sans">
            Manage your personal profile and account credentials.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          
          {/* Profile Section */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/60 shadow-xs">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-stone-100">
              <User size={16} className="text-[#2C4436]" />
              <h2 className="text-stone-900 text-sm font-semibold">User Profile</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#2C4436] flex items-center justify-center text-white font-serif text-lg font-normal shadow-xs">
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="text-stone-900 text-sm font-medium">{name || 'Your Name'}</p>
                  <p className="text-stone-400 text-xs mt-0.5">{email}</p>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 text-xs font-semibold uppercase tracking-wider mb-2">
                  Display Name
                </label>
                <input
                  id="settings-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full bg-[#FAF8F5] border border-stone-200 rounded-2xl px-4 py-3 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-[#2C4436] transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Save Button */}
          <button
            id="save-settings-btn"
            type="submit"
            disabled={saving}
            className="w-full bg-[#2C4436] hover:bg-[#23382C] text-white font-semibold rounded-2xl py-3.5 text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-[#2C4436]/20 cursor-pointer disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{saving ? 'Saving changes…' : saved ? 'Saved successfully ✓' : 'Save Changes'}</span>
          </button>
        </form>

        {/* Sign Out Card */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-stone-800 text-xs font-medium">Signed in as</p>
            <p className="text-stone-500 text-xs">{email}</p>
          </div>
          <button
            id="logout-btn"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 bg-[#FAF8F5] hover:bg-red-50 text-stone-600 hover:text-red-600 border border-stone-200 hover:border-red-200 px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer"
          >
            {loggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
            <span>{loggingOut ? 'Signing out…' : 'Sign out'}</span>
          </button>
        </div>

      </div>
    </div>
  )
}
