"use client"
import { useState } from 'react'

type SignalType = 'green' | 'yellow' | 'red'
type Tag = 'meal' | 'home' | 'leave' | 'sleep' | 'wake' | 'sos'

export default function SignalButton({
  type,
  tag,
  label,
  onPosted,
}: {
  type: SignalType
  tag?: Tag
  label: string
  onPosted?: (payload: { type: SignalType; tag?: Tag }) => void
}) {
  const [posting, setPosting] = useState(false)
  const color = type === 'green' ? 'btn-green' : type === 'yellow' ? 'btn-amber' : 'btn-red'

  async function handleClick() {
    setPosting(true)
    try {
      // TODO: call `/api/signal` with payload once backend is wired.
      await new Promise(r => setTimeout(r, 300))
      onPosted?.({ type, tag })
    } finally {
      setPosting(false)
    }
  }

  return (
    <button disabled={posting} onClick={handleClick} className={`btn ${color} w-full`}>{label}</button>
  )
}

