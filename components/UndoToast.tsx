"use client";
import { useState } from "react";

export default function UndoToast({
  onUndo,
  until,
  signalId,
}: {
  onUndo: () => void;
  until?: Date;
  signalId?: string;
}) {
  const [undoing, setUndoing] = useState(false);

  async function handleUndo() {
    if (!signalId) {
      onUndo();
      return;
    }

    setUndoing(true);
    try {
      const response = await fetch(`/api/signal?id=${signalId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.ok) {
        onUndo();
      } else {
        console.error("Undo failed:", result.error);
        alert(result.error?.message || "되돌리기에 실패했습니다");
      }
    } catch (error) {
      console.error("Undo error:", error);
      alert("네트워크 오류가 발생했습니다");
    } finally {
      setUndoing(false);
    }
  }

  return (
    <div className="fixed bottom-16 inset-x-0 mx-auto max-w-md px-4">
      <div className="card flex items-center justify-between">
        <div>
          <div className="font-medium">기록됨</div>
          {until && (
            <div className="text-sm text-token-text-secondary">
              되돌리기 가능: {until.toLocaleTimeString()}
            </div>
          )}
        </div>
        <button className="btn disabled:opacity-50" onClick={handleUndo} disabled={undoing}>
          {undoing ? "처리중..." : "되돌리기"}
        </button>
      </div>
    </div>
  );
}
