"use client"
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
    setLoading(false)
  }

  return (
    <button onClick={handleSignOut} className="btn w-full" disabled={loading}>
      {loading ? '로그아웃 중...' : '로그아웃'}
    </button>
  )
}
