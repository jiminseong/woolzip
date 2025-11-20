"use client"
import { useState } from 'react'
import BottomNav from '@/components/BottomNav'
import SignalButton from '@/components/SignalButton'
import UndoToast from '@/components/UndoToast'

export default function AddPageClient() {
  const [toastUntil, setToastUntil] = useState<Date | null>(null)
  const [tired, setTired] = useState(false)

  function posted() {
    const until = new Date(Date.now() + 5 * 60 * 1000)
    setToastUntil(until)
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="section">
        <h1 className="text-2xl font-bold">원터치</h1>
      </header>
      <main className="flex-1 px-4 pb-24 space-y-4">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-medium">살짝 피곤해요</div>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={tired} onChange={e => setTired(e.target.checked)} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SignalButton type={tired ? 'yellow' : 'green'} tag="leave" label="출발" onPosted={posted} />
            <SignalButton type={tired ? 'yellow' : 'green'} tag="home" label="귀가" onPosted={posted} />
            <SignalButton type={tired ? 'yellow' : 'green'} tag="meal" label="식사" onPosted={posted} />
            <SignalButton type={tired ? 'yellow' : 'green'} tag="sleep" label="취침" onPosted={posted} />
            <SignalButton type={tired ? 'yellow' : 'green'} tag="wake" label="기상" onPosted={posted} />
            <SignalButton type={'red'} tag="sos" label="SOS" onPosted={posted} />
          </div>
        </div>
      </main>
      <BottomNav />
      {toastUntil && <UndoToast onUndo={() => setToastUntil(null)} until={toastUntil} />}
    </div>
  )
}
