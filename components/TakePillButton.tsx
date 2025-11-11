"use client"
import { useState } from 'react'

export default function TakePillButton({ medicationId, time_slot }: { medicationId: string; time_slot: 'morning'|'noon'|'evening' }) {
  const [taken, setTaken] = useState(false)
  return (
    <button
      onClick={() => setTaken(true)}
      className={`btn ${taken ? 'btn-green' : ''} w-full`}
      disabled={taken}
    >{taken ? '기록됨' : `복용 (${time_slot})`}</button>
  )
}

