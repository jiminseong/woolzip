import { redirect } from 'next/navigation'
import { getSession } from '@/lib/supabase/server'
import AddPageClient from './AddPageClient'

export default async function AddPage() {
  const { session } = await getSession()
  if (!session) redirect('/login')

  return <AddPageClient />
}
