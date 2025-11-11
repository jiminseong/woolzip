"use client"
export default function UndoToast({ onUndo, until }: { onUndo: () => void; until?: Date }) {
  return (
    <div className="fixed bottom-16 inset-x-0 mx-auto max-w-md px-4">
      <div className="card flex items-center justify-between">
        <div>
          <div className="font-medium">기록됨</div>
          {until && <div className="text-sm text-token-text-secondary">되돌리기 가능: {until.toLocaleTimeString()}</div>}
        </div>
        <button className="btn" onClick={onUndo}>되돌리기</button>
      </div>
    </div>
  )
}

