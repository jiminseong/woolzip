import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'
import { getSession } from '@/lib/supabase/server'

export default async function LoginPage() {
  const { session } = await getSession()
  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="section">
        <h1 className="text-2xl font-bold">로그인</h1>
      </header>
      <main className="flex-1 px-4 pb-16 flex items-start">
        <LoginForm />
      </main>
    </div>
  )
}
