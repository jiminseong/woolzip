"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Medication = {
  id: string;
  name: string;
  times: string[] | null;
};

const TIME_OPTIONS: { value: "morning" | "noon" | "evening"; label: string }[] = [
  { value: "morning", label: "아침" },
  { value: "noon", label: "점심" },
  { value: "evening", label: "저녁" },
];

export default function MedicationManager({ initial }: { initial: Medication[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const toggleTime = (value: "morning" | "noon" | "evening") => {
    setTimes((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]));
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      setError("약 이름을 입력해주세요");
      return;
    }
    if (times.length === 0) {
      setError("복용 시간대를 선택해주세요");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      const { data: insert, error: insertError } = await (supabase.from("medications") as any)
        .insert({
          user_id: user.id,
          name: name.trim(),
          times,
          is_active: true,
        })
        .select("id, name, times")
        .single();

      if (insertError) {
        setError(insertError.message || "약 추가에 실패했습니다");
        return;
      }

      if (insert) {
        setItems((prev) => [...prev, insert]);
        setName("");
        setTimes([]);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "약 추가 중 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  };

  const timeBadges = (t: string[] | null) => {
    if (!t || t.length === 0) return "시간대 미지정";
    const map: Record<string, string> = { morning: "아침", noon: "점심", evening: "저녁" };
    return t.map((v) => map[v] || v).join(", ");
  };

  return (
    <div className="card space-y-3">
      <div className="text-lg font-semibold">약 관리</div>

      <div className="space-y-2">
        <label className="block text-sm">
          <span className="text-token-text-secondary">약 이름</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 혈압약, 고지혈증약"
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-signal-green"
            maxLength={30}
          />
        </label>

        <div className="text-sm text-token-text-secondary">복용 시간대</div>
        <div className="grid grid-cols-3 gap-2">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleTime(opt.value)}
              className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                times.includes(opt.value)
                  ? "border-token-signal-green bg-green-50 text-token-signal-green"
                  : "border-neutral-200 bg-white hover:border-token-signal-green"
              }`}
            >
            {opt.label}
          </button>
        ))}
      </div>

        {error && <div className="text-sm text-token-signal-red">{error}</div>}

        <button
          type="button"
          onClick={handleAdd}
          disabled={saving}
          className="btn btn-green w-full disabled:opacity-50"
        >
          {saving ? "저장 중..." : "약 추가하기"}
        </button>
      </div>

      <div className="pt-2 space-y-3">
        <div className="text-sm text-token-text-secondary">내 약 목록</div>
        {items.length === 0 ? (
          <div className="text-sm text-token-text-secondary">등록된 약이 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {items.map((med) => (
              <div key={med.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2">
                <div>
                  <div className="font-medium">{med.name}</div>
                  <div className="text-xs text-token-text-secondary">{timeBadges(med.times)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
