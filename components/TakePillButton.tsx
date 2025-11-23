"use client";
import { useState } from "react";

export default function TakePillButton({
  medicationId,
  time_slot,
  initialTaken = false,
}: {
  medicationId: string;
  time_slot: "morning" | "noon" | "evening";
  initialTaken?: boolean;
}) {
  const [taken, setTaken] = useState(initialTaken);
  const [taking, setTaking] = useState(false);

  const timeSlotTexts = {
    morning: "아침",
    noon: "점심",
    evening: "저녁",
  };

  async function handleTake() {
    setTaking(true);
    try {
      const response = await fetch("/api/med/take", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicationId, time_slot }),
      });

      const result = await response.json();

      if (result.ok) {
        setTaken(true);
      } else {
        alert(result.error?.message || "복용 기록에 실패했습니다");
      }
    } catch (error) {
      console.error("Medication taking error:", error);
      alert("네트워크 오류가 발생했습니다");
    } finally {
      setTaking(false);
    }
  }

  return (
    <button
      onClick={handleTake}
      className={`h-12 w-full rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 transition ${
        taken
          ? "bg-token-signal-green text-white"
          : "bg-neutral-100 hover:bg-neutral-200 text-token-text-primary"
      } disabled:opacity-60`}
      disabled={taken || taking}
    >
      {taking ? "기록 중..." : taken ? "✓ 복용완료" : `${timeSlotTexts[time_slot]} 복용`}
    </button>
  );
}
