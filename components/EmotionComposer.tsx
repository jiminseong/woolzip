"use client"
import { useState } from 'react'

export default function EmotionComposer() {
  const [emoji, setEmoji] = useState('😊')
  const [text, setText] = useState('')
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button className="btn" onClick={() => setEmoji('😊')}>😊</button>
        <button className="btn" onClick={() => setEmoji('😌')}>😌</button>
        <button className="btn" onClick={() => setEmoji('😴')}>😴</button>
        <div className="ml-auto text-2xl">{emoji}</div>
      </div>
      <input value={text} onChange={e => setText(e.target.value)} className="w-full rounded-xl border p-3" placeholder="한 줄로 오늘 기분" maxLength={30} />
      <button className="btn btn-green">공유</button>
    </div>
  )
}

