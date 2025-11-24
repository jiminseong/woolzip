"use client";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import SignalButton from "@/components/SignalButton";
import UndoToast from "@/components/UndoToast";

export default function AddPageClient() {
  const [toastUntil, setToastUntil] = useState<Date | null>(null);
  const [signalId, setSignalId] = useState<string | null>(null);
  const [tired, setTired] = useState(false);

  function posted(payload: { type: string; tag?: string; id?: string; undo_until?: string }) {
    if (payload.undo_until && payload.id) {
      const until = new Date(payload.undo_until);
      setToastUntil(until);
      setSignalId(payload.id);
    }
  }

  function handleUndo() {
    setToastUntil(null);
    setSignalId(null);
    // 페이지 새로고침하여 홈 화면 업데이트
    window.location.href = "/";
  }

  const quickActions = [
    { tag: "home", label: "귀가", emoji: "🏠" },
    { tag: "wake", label: "기상", emoji: "🌞" },
    { tag: "meal", label: "식사", emoji: "🍚" },
    { tag: "leave", label: "출발", emoji: "🏃" },
    { tag: "sleep", label: "취침", emoji: "🌙" },
  ] as const;

  const baseType = tired ? "yellow" : "green";

  async function sendSignal(
    tag: (typeof quickActions)[number]["tag"],
    type: "green" | "yellow" | "red" = baseType
  ) {
    try {
      const res = await fetch("/api/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, tag }),
      });
      const data = await res.json();
      if (data?.ok) {
        posted({ type, tag, id: data.id, undo_until: data.undo_until });
      } else {
        alert(data?.error?.message || "전송에 실패했습니다");
      }
    } catch (err) {
      alert("네트워크 오류가 발생했습니다");
    }
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="section">
        <h1 className="text-2xl font-bold">원터치</h1>
      </header>
      <main className="flex-1 px-4 pb-24 space-y-4">
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-lg">빠른 안부</div>
            <div className="inline-flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2 bg-neutral-100 rounded-full p-1">
                <button
                  type="button"
                  onClick={() => setTired(false)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${
                    !tired ? "bg-white text-token-accent shadow" : "text-token-text-secondary"
                  }`}
                >
                  괜찮아요 😊
                </button>
                <button
                  type="button"
                  onClick={() => setTired(true)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${
                    tired ? "bg-white text-token-text-primary shadow" : "text-token-text-secondary"
                  }`}
                >
                  피곤해요 😌
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.tag}
                type="button"
                onClick={() => sendSignal(action.tag, baseType)}
                className="rounded-2xl border border-neutral-200 bg-white shadow px-4 py-5 flex flex-col items-center gap-2 hover:border-token-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-accent/40"
              >
                <span className="text-4xl leading-none">{action.emoji}</span>
                <span className="font-semibold text-token-text-primary">{action.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-2">
            <div className="text-base font-semibold mb-2">긴급</div>
            <SignalButton type={"red"} tag="sos" label="SOS" onPosted={posted} />
          </div>
        </div>
      </main>
      <BottomNav />
      {toastUntil && (
        <UndoToast onUndo={handleUndo} until={toastUntil} signalId={signalId || undefined} />
      )}
    </div>
  );
}
