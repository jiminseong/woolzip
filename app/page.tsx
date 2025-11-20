import { redirect } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import TodaySummaryCard from '@/components/TodaySummaryCard'
import TimelineItem from '@/components/TimelineItem'
import { getSession } from '@/lib/supabase/server'

export default async function Page() {
  const { session } = await getSession()
  if (!session) redirect('/login')

  const members = [
    { id: '1', name: '엄마', last: '귀가 18:40', gyrc: { g: 2, y: 0, r: 0 }, med: true },
    { id: '2', name: '아빠', last: '식사 12:10', gyrc: { g: 1, y: 1, r: 0 }, med: false },
    { id: '3', name: '나', last: '기상 07:30', gyrc: { g: 3, y: 0, r: 0 }, med: true },
  ]

  const feed = [
    { kind: 'signal' as const, title: '나 · 귀가 완료', time: '18:40', color: 'green' as const },
    { kind: 'med' as const, title: '엄마 · 저녁 약 복용', time: '19:10' },
    { kind: 'emotion' as const, title: '아빠 · 😊 오늘 산책 좋았어요', time: '17:20' },
  ]

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="section">
        <h1 className="text-2xl font-bold">오늘 요약</h1>
      </header>
      <main className="flex-1 px-4 pb-24 space-y-4">
        <TodaySummaryCard members={members} />
        <div className="card">
          <div className="text-lg font-semibold mb-2">타임라인</div>
          {feed.map((f, i) => (
            <TimelineItem key={i} kind={f.kind} title={f.title} time={f.time} color={(f as any).color} />
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
