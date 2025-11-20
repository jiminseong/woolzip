import { redirect } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import EmotionComposer from '@/components/EmotionComposer'
import TakePillButton from '@/components/TakePillButton'
import SignOutButton from '@/components/SignOutButton'
import { getSession } from '@/lib/supabase/server'

export default async function MePage() {
  const { session } = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="section">
        <h1 className="text-2xl font-bold">내 정보</h1>
      </header>
      <main className="flex-1 px-4 pb-24 space-y-4">
        <div className="card">
          <div className="text-lg font-semibold mb-2">설정</div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span>신호 공유</span><input type="checkbox" defaultChecked /></div>
            <div className="flex items-center justify-between"><span>약 복용 공유</span><input type="checkbox" defaultChecked /></div>
            <div className="flex items-center justify-between"><span>감정 공유</span><input type="checkbox" defaultChecked /></div>
            <div className="flex items-center justify-between"><span>큰 글자 모드</span><input type="checkbox" /></div>
            <div className="flex items-center justify-between"><span>고대비</span><input type="checkbox" /></div>
            <div className="flex items-center justify-between"><span>푸시 허용</span><input type="checkbox" /></div>
          </div>
          <div className="pt-4">
            <SignOutButton />
          </div>
        </div>

        <div className="card">
          <div className="text-lg font-semibold mb-2">약 관리</div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <div>고혈압약 · 아침/저녁</div>
              <div className="w-40"><TakePillButton medicationId="m1" time_slot="morning" /></div>
            </div>
            <div className="flex items-center justify-between">
              <div>비타민D · 점심</div>
              <div className="w-40"><TakePillButton medicationId="m2" time_slot="noon" /></div>
            </div>
          </div>
        </div>

        <EmotionComposer />
      </main>
      <BottomNav />
    </div>
  )
}
