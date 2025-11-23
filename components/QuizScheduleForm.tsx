"use client";

import { useEffect, useState } from "react";

export default function QuizScheduleForm({
  initialTime,
}: {
  initialTime: string | null;
}) {
  const [time, setTime] = useState(initialTime ?? "20:00");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTime) setTime(initialTime.slice(0, 5));
  }, [initialTime]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/quiz/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time_of_day: `${time}:00`, enabled: true }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error?.message || "저장에 실패했습니다");
        return;
      }
      setMessage("질문 알림 시간이 저장되었습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card space-y-3">
      <div className="text-lg font-semibold">질문 알림 시간</div>
      <div className="space-y-2 text-sm">
        <label className="block">
          <span className="text-token-text-secondary">알림 시각 (한국 시간 기준)</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 bg-white p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-signal-green"
          />
        </label>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn btn-green w-full disabled:opacity-60"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        {message && <div className="text-xs text-token-text-secondary">{message}</div>}
        {error && <div className="text-xs text-token-signal-red">{error}</div>}
      </div>
    </div>
  );
}
